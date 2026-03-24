.PHONY: help build up down logs clean dev prod restart

# Default target
help:
	@echo "Resume Analyzer - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development environment with hot reload"
	@echo "  make dev-logs         - View development logs"
	@echo "  make dev-down         - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  make build            - Build production images"
	@echo "  make up               - Start production environment"
	@echo "  make down             - Stop production environment"
	@echo "  make logs             - View production logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            - Remove all containers and images"
	@echo "  make restart          - Restart all services"
	@echo "  make status           - Show service status"
	@echo "  make backend-logs     - View backend logs only"
	@echo "  make frontend-logs    - View frontend logs only"

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✓ Development environment is running"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:4000"
	@echo "DynamoDB Admin: http://localhost:8000"

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-down:
	@echo "Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✓ Development environment stopped"

# Production environment
build:
	@echo "Building production images..."
	docker-compose build --no-cache
	@echo "✓ Build complete"

up:
	@echo "Starting production environment..."
	docker-compose up -d
	@echo "✓ Production environment is running"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:4000"

down:
	@echo "Stopping production environment..."
	docker-compose down
	@echo "✓ Production environment stopped"

logs:
	docker-compose logs -f

# Utilities
restart:
	@echo "Restarting services..."
	docker-compose restart
	@echo "✓ Services restarted"

status:
	@echo "Service Status:"
	docker-compose ps

backend-logs:
	docker-compose logs -f backend

frontend-logs:
	docker-compose logs -f frontend

clean:
	@echo "Cleaning up Docker resources..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	docker system prune -f --volumes
	@echo "✓ Cleanup complete"

# Initialize LocalStack with required resources
init-localstack:
	@echo "Initializing LocalStack resources..."
	docker-compose exec localstack awslocal s3 mb s3://resume-analyzer-bucket
	docker-compose exec localstack awslocal dynamodb create-table \
		--table-name resume-analyzer-analysis \
		--attribute-definitions AttributeName=analysis_id,AttributeType=S \
		--key-schema AttributeName=analysis_id,KeyType=HASH \
		--billing-mode PAY_PER_REQUEST
	docker-compose exec localstack awslocal dynamodb create-table \
		--table-name resume-analyzer-users \
		--attribute-definitions AttributeName=email,AttributeType=S AttributeName=user_id,AttributeType=S \
		--key-schema AttributeName=email,KeyType=HASH \
		--global-secondary-indexes 'IndexName=user_id-index,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
		--billing-mode PAY_PER_REQUEST
	@echo "✓ LocalStack initialized"

# Shell access into containers
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-localstack:
	docker-compose exec localstack sh

# Install dependencies
install-deps:
	@echo "Installing backend dependencies..."
	pip install -r backend/requirements.txt
	@echo "Installing frontend dependencies..."
	cd resume-insights && npm install

# Run linters and tests
lint:
	@echo "Running linters..."
	docker-compose exec backend flake8 backend/lambdas
	docker-compose exec frontend npm run lint

test:
	@echo "Running tests..."
	docker-compose exec backend python -m pytest tests/
	docker-compose exec frontend npm run test

# Database utilities
db-backup:
	@echo "Backing up DynamoDB data..."
	docker exec resume-analyzer-dynamodb cp -r /data ./backup-$(shell date +%Y%m%d-%H%M%S)

# Show this help message
.DEFAULT_GOAL := help
