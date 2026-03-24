# Docker Setup Guide - Resume Analyzer

This project includes comprehensive Docker configuration for both development and production environments.

## 📋 What's Included

- **docker-compose.yml** - Production environment setup
- **docker-compose.dev.yml** - Development environment with hot reload
- **Dockerfile** - Backend Lambda functions (Python)
- **Dockerfile (frontend)** - Frontend React app with Nginx
- **Dockerfile.dev** - Frontend development with Vite hot reload
- **.dockerignore** - Excludes unnecessary files from Docker builds
- **nginx.conf** - Nginx configuration for frontend
- **Makefile** - Convenient commands for Docker operations

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git
- Make (optional, for Makefile commands)

### Development Environment (Recommended)

```bash
# Start development environment
make dev

# Or without make:
docker-compose -f docker-compose.dev.yml up -d

# View logs
make dev-logs

# Stop services
make dev-down
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- DynamoDB Admin: http://localhost:8000
- LocalStack: http://localhost:4566

### Production Environment

```bash
# Build images
make build

# Start services
make up

# View logs
make logs

# Stop services
make down
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## 📦 Services Included

### Frontend (Node.js + React)
- **Port:** 3000 (prod) / 5173 (dev)
- **Features:**
  - Vite hot module reload (dev)
  - Nginx reverse proxy (prod)
  - Security headers
  - Gzip compression
  - Health checks

### Backend (Python + AWS Lambda)
- **Port:** 4000
- **Services:**
  - Resume analysis Lambda
  - Chat Lambda (Groq AI)
  - Auth Lambda (Signup/Login)
  - Presign Lambda (S3 uploads)

### LocalStack (AWS Services Emulation)
- **Port:** 4566
- **Services:**
  - S3 (file storage)
  - DynamoDB (database)
  - SecretsManager (credentials)
  - API Gateway
  - Lambda

### DynamoDB Local
- **Port:** 8000
- Admin UI for database management

### Redis Cache (Optional)
- **Port:** 6379
- Session storage & caching

---

## 🎯 Common Tasks

### Initialize LocalStack Resources

```bash
make init-localstack

# Or manually:
docker-compose exec localstack awslocal s3 mb s3://resume-analyzer-bucket
docker-compose exec localstack awslocal dynamodb create-table ...
```

### View Logs

```bash
# All services
make logs

# Specific service
make backend-logs
make frontend-logs

# Or with docker-compose
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access Container Shell

```bash
make shell-backend
make shell-frontend
make shell-localstack
```

### Install Dependencies Inside Container

```bash
make install-deps
```

### Run Linters & Tests

```bash
make lint
make test
```

### Restart Services

```bash
make restart
```

### Check Status

```bash
make status
```

### Clean Everything

```bash
make clean
```

---

## 🔧 Environment Variables

### Development (.env)
```bash
VITE_API_URL=http://localhost:4000
VITE_API_KEY=test-api-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
BUCKET_NAME=resume-analyzer-bucket
TABLE_NAME=resume-analyzer-analysis
USERS_TABLE_NAME=resume-analyzer-users
GROQ_SECRET_NAME=resume-analyzer/groq-api-key
JWT_SECRET=resume-analyzer-jwt-secret-key-change-in-prod
```

---

## 📁 Docker File Locations

```
resume-analyzer/
├── .dockerignore           # Files to exclude from Docker
├── Makefile                # Convenient commands
├── docker-compose.yml      # Production setup
├── docker-compose.dev.yml  # Development setup
├── backend/
│   └── Dockerfile          # Backend image
├── resume-insights/
│   ├── Dockerfile          # Frontend production image
│   ├── Dockerfile.dev      # Frontend development image
│   └── nginx.conf          # Nginx configuration
└── .gitignore              # Git ignore patterns
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it

# Or use different port in docker-compose
```

### Database Connection Issues
```bash
# Check if DynamoDB is running
docker-compose ps

# Reinitialize LocalStack
make clean
make dev
make init-localstack
```

### Container Won't Start
```bash
# Check logs
docker-compose logs <service>

# Rebuild without cache
docker-compose build --no-cache
```

### Permission Issues
```bash
# Run with sudo if needed
sudo chown -R $(id -u):$(id -g) .
```

---

## 🔐 Security Notes

⚠️ **Development Only:**
- Default credentials (test/test) are for local development only
- Do NOT use in production
- Change JWT_SECRET before deploying
- Use AWS Secrets Manager for production

---

## 📊 Performance Tips

1. **Volume Mounts:** Dev environment mounts source code for hot reload
2. **Layer Caching:** Docker layers are cached for faster rebuilds
3. **Resource Limits:** Consider adding memory limits for LocalStack:
   ```yaml
   localstack:
     deploy:
       resources:
         limits:
           memory: 2G
   ```

---

## 🚢 Deployment

For production deployment:

1. Push images to ECR/DockerHub
2. Use AWS ECS, EKS, or Docker Swarm
3. Use environment-specific docker-compose files
4. Update credentials in AWS Secrets Manager
5. Enable health checks and auto-restart policies

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Lambda Docker Support](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)

---

## ❓ Need Help?

```bash
# View all available commands
make help

# Check service status
make status

# View logs
make logs
```
