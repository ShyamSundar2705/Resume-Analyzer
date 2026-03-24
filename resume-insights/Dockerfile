# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY resume-insights/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY resume-insights/src ./src
COPY resume-insights/*.html ./
COPY resume-insights/*.js ./
COPY resume-insights/*.config.js ./

# Build the app
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY resume-insights/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
