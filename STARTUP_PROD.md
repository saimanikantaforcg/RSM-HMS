# RSM HMS - Production Startup Guide

## 1. Environment Configuration
Copy `.env.production` to `.env` in the `services/clinical-service` directory and fill in your actual production secrets (PostgreSQL credentials, 64-character JWT secrets, SMTP keys).

## 2. Docker Deployment
The quickest and most reliable way to run the backend in production is via Docker.

```bash
cd services/clinical-service
docker build -t rsm-hms-backend:latest .
docker run -d \
  --name rsm-hms \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  rsm-hms-backend:latest
```

## 3. Database Migrations
TypeORM synchronizes schema by default in development (`synchronize: true`).
In production, `NODE_ENV=production` disables auto-sync. You must run migrations.

### Generating a Migration (Development)
If you made changes to entities, generate a migration first:
```bash
npm run typeorm migration:generate src/migrations/UpdateSchema -d src/data-source.ts
```

### Running Migrations (Production)
Run the migration script against the production database:
```bash
npm run typeorm migration:run -d src/data-source.ts
```

## 4. Frontend Deployment
The React frontend should be statically built and hosted on a CDN (Vercel, AWS S3+Cloudfront, Nginx).

```bash
cd frontend
npm run build
```
Copy the contents of the `dist/` directory to your web server.
Ensure your web server is configured to rewrite all routes to `index.html` (for React Router to work).

## 5. Security Checklist
- [ ] Database restricted to VPC only (no public IP).
- [ ] Valid SSL Certificates on Load Balancer / API Gateway.
- [ ] Hardened JWT secrets applied in `.env`.
- [ ] WAF (Web Application Firewall) enabled.
- [ ] Logging aggregated to Datadog/CloudWatch.
