FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (clean install)
RUN npm ci

# Copy backend source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

CMD ["node", "src/index.js"]
