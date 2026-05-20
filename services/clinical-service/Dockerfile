# Stage 1: Build NestJS Microservice
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production execution environment
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Non-root user execution
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
