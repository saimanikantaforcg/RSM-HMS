# ─────────────────────────────────────────────────────────────────────────────
# RSM HMS — Single-Container Build for Hugging Face Spaces
#
# Serves compiled React frontend + NestJS API on the same port (7860).
# SQLite is persisted inside the container (POC / demo use only).
# ─────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output: /build/dist/

# ─── Stage 2: Build NestJS backend ──────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /build
COPY services/clinical-service/package*.json ./
RUN npm ci
COPY services/clinical-service/ ./
RUN npm run build
# Output: /build/dist/

# ─── Stage 3: Production image ───────────────────────────────────────────────
FROM node:20-alpine

# Hugging Face Spaces requires a non-root user with UID 1000
RUN addgroup -S appgroup && adduser -S -u 1000 -G appgroup user
USER user

ENV HOME=/home/user
WORKDIR $HOME/app

# Install only production dependencies
COPY --chown=user:appgroup services/clinical-service/package*.json ./
RUN npm ci --omit=dev

# Copy compiled NestJS output
COPY --chown=user:appgroup --from=backend-builder /build/dist ./dist

# Copy compiled React output into a path NestJS will serve
COPY --chown=user:appgroup --from=frontend-builder /build/dist ./frontend/dist

# SQLite data directory (writable by the user)
RUN mkdir -p $HOME/app/data

# ─── Runtime configuration ───────────────────────────────────────────────────
# Hugging Face Spaces requires port 7860
EXPOSE 7860

ENV PORT=7860
ENV NODE_ENV=production

# Activate NestJS static-file serving (ServeStaticModule)
ENV SERVE_STATIC=true
ENV FRONTEND_DIST_PATH=/home/user/app/frontend/dist

# SQLite database path (writable directory)
ENV DB_NAME=/home/user/app/data/hms.sqlite

# Disable Redis — use in-memory cache for POC
ENV USE_REDIS_MOCK=true

# Allow any origin (same-origin in single-container; safe for POC)
ENV ALLOWED_ORIGINS=*

# ── Secrets: set these via HF Spaces Repository Secrets, not here ────────────
# Default demo values are provided so the container starts without manual config.
# REPLACE THESE in production via HF Spaces → Settings → Repository Secrets.
ENV COOKIE_SECRET=rsm-hms-poc-cookie-secret-replace-in-prod
ENV JWT_SECRET=rsm-hms-poc-jwt-secret-replace-in-prod

# ─── Start NestJS ────────────────────────────────────────────────────────────
CMD ["node", "dist/main.js"]
