# RSM HMS — Enterprise-Grade Audit Report
**Date**: March 26, 2026 | **Standard**: HIMSS Stage 7 / ISO 27001 / HL7 FHIR R4 / HIPAA Security Rule

---

## Executive Summary

> [!NOTE]
> The RSM HMS has a **solid enterprise foundation** — Helmet security headers, JWT+RBAC guards, HIPAA audit trails, and a standardized API response envelope are all in place. However, **6 critical gaps** must be closed before this can be considered production-ready for a live hospital environment.

**Overall Enterprise Maturity Score: 6.5 / 10**

| Domain | Score | Status |
|---|---|---|
| 🔐 Security & Auth | 7.5/10 | ✅ Strong |
| 🌐 API Design | 6/10 | ⚠️ Needs Work |
| 🏗️ Backend Architecture | 6.5/10 | ⚠️ Needs Work |
| 🖥️ Frontend Architecture | 5.5/10 | ⚠️ Needs Work |
| 📊 Observability & Logging | 3/10 | 🔴 Critical Gap |
| 🗄️ Data & Storage | 5/10 | ⚠️ Needs Work |
| 🚀 DevOps & CI/CD | 4/10 | 🔴 Critical Gap |
| 📋 Compliance & Governance | 7/10 | ✅ Reasonable |

---

## Domain 1 — Security & Auth (7.5/10) ✅

### What's Already Enterprise-Grade
- ✅ **Helmet** security headers (XSS, clickjacking, HSTS)
- ✅ **HttpOnly cookie-based JWT** — localStorage XSS vulnerability fixed
- ✅ **RBAC** with `@Roles()` decorator and `RolesGuard` globally applied
- ✅ **ThrottlerGuard** — 100 req/min rate limiting
- ✅ **bcrypt** password hashing
- ✅ **Refresh token** rotation with separate secret
- ✅ **CORS** locked to specific origin list

### Gaps Found

> [!CAUTION]
> **P0 — Hardcoded Secrets**: [auth.service.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.ts) line 49 and [main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts) line 18 use fallback string literals for secrets (`'hms-refresh-secret'`, `'hms-cookie-secret'`). These MUST be environment-variable-only in production.

```diff
- secret: process.env.JWT_REFRESH_SECRET ?? 'hms-refresh-secret'
+ secret: process.env.JWT_REFRESH_SECRET  // Throw if undefined in production
```

> [!WARNING]
> **P1 — `/auth/seed` endpoint exposed in production**: The dev seed endpoint creates an admin user with `admin123`. It must be blocked by an environment guard.

> [!WARNING]
> **P1 — Missing `forbidNonWhitelisted: true`**: [main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts) line 38 sets `forbidNonWhitelisted: false`, allowing extra unknown fields into the DB. This is a data injection risk.

> [!NOTE]
> **P2 — No CSRF protection**: Cookie-based auth needs CSRF token validation (e.g., `csurf` or Double-Submit Cookie pattern) for state-mutating requests.

> [!NOTE]
> **P2 — No account lockout on failed logins**: A brute-force attack can enumerate passwords. Add failed-login counters with exponential backoff.

---

## Domain 2 — API Design (6/10) ⚠️

### What's Already Enterprise-Grade
- ✅ **Versioned API** via global prefix `/api/v1`
- ✅ **Standardized response envelope** `{ success, data, timestamp }` via [ApiResponseInterceptor](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/common/interceptors/api-response.interceptor.ts#19-41)
- ✅ **Swagger/OpenAPI** documentation with cookie + bearer auth
- ✅ **Consistent HTTP methods** across all modules

### Gaps Found

> [!CAUTION]
> **P0 — Missing Global Exception Filter**: There is no `HttpExceptionFilter` registered. Unhandled NestJS errors leak raw stack traces and Node.js internals to the browser — a major security and UX issue. All errors must return the same `{ success: false, error: '...', statusCode: ... }` envelope.

```typescript
// Missing from main.ts:
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
app.useGlobalFilters(new AllExceptionsFilter());
```

> [!WARNING]
> **P1 — `@Body() data: any` in controllers**: [analytics.controller.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/analytics/analytics.controller.ts) uses `@Body() data: any`. Every endpoint must use typed DTOs with class-validator. Using `any` bypasses the `ValidationPipe` completely.

> [!WARNING]
> **P1 — No API pagination standard**: Data endpoints (patients, encounters) should return `{ data, total, page, limit }` — currently they return raw arrays. This will fail at scale.

> [!NOTE]
> **P2 — No request/response logging**: Add a `LoggingInterceptor` to track request method, path, duration, and status code for every API call.

---

## Domain 3 — Backend Architecture (6.5/10) ⚠️

### What's Already Enterprise-Grade
- ✅ **NestJS modular architecture** — domain modules are properly separated
- ✅ **TypeORM** with entity-per-table design
- ✅ **Postgres/SQLite dual-mode** DB config
- ✅ **HIPAA Audit Log module** integrated
- ✅ **Global guards and interceptors** applied via `APP_GUARD`

### Gaps Found

> [!CAUTION]
> **P0 — `synchronize: true` in production**: [app.module.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/app.module.ts) line 96 uses `synchronize: process.env.NODE_ENV !== 'production'`. This must use **TypeORM migrations** in production — `synchronize: true` can silently drop columns or tables on schema changes.

> [!WARNING]
> **P1 — No service-level error handling strategy**: Services throw raw errors or `console.warn`. All services should use NestJS's `Logger` class and proper HTTP exceptions:
```typescript
private readonly logger = new Logger(AuthService.name);
this.logger.warn(`Login failed for ${dto.email}`);
```

> [!WARNING]
> **P1 — DTOs are plain interfaces, not classes**: [LoginDto](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.ts#11-15) and [RegisterDto](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.ts#16-24) in [auth.service.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.ts) are TypeScript interfaces — they cannot use `class-validator` decorators. They must be converted to classes.

> [!NOTE]
> **P2 — Missing health check endpoint**: Enterprise platforms expose `/health` (liveness) and `/readyz` (readiness) endpoints for load balancers and Kubernetes probes. Use `@nestjs/terminus`.

> [!NOTE]
> **P2 — No caching layer**: High-frequency reads (patient lists, physician schedules, bed status) should use Redis or in-memory caching (`@nestjs/cache-manager`) to reduce DB load.

---

## Domain 4 — Frontend Architecture (5.5/10) ⚠️

### What's Already Enterprise-Grade
- ✅ **Centralized [api.js](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/lib/api.js)** — all fetches go through one authenticated client
- ✅ **Automatic 401 redirect** on token expiry
- ✅ **Role-based navigation** — sidebar filtered by user permissions
- ✅ **Patient Workspace** — unified 3-panel clinical view

### Gaps Found

> [!CAUTION]
> **P0 — No React Error Boundary**: A single JavaScript runtime error in any component will crash the entire app (blank white screen). Every module requires an error boundary wrapper.

> [!CAUTION]
> **P0 — No global state management**: User profile, tenant info, and permissions are fetched and cached in [api.js](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/lib/api.js) as module-level variables — not in React state. This can cause stale data after role changes or on multi-tab sessions. Use **Zustand** or **React Context + useReducer**.

> [!WARNING]
> **P1 — API calls in component bodies without loading states**: Many modules show empty tables while data is loading (no skeletons). This violates enterprise UX standards.

> [!WARNING]
> **P1 — No form validation library**: Forms across modules use plain `<input required>` HTML validation. Enterprise apps use **React Hook Form + Zod** for type-safe, accessible form validation.

> [!NOTE]
> **P2 — No offline/PWA support**: Healthcare workers often operate in low-connectivity environments. A service worker + cache-first strategy for critical pages would be a significant enterprise differentiator.

> [!NOTE]
> **P2 — Hardcoded `API_BASE` URL**: [api.js](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/lib/api.js) line 12 hardcodes `http://localhost:3001`. This must read from `import.meta.env.VITE_API_BASE_URL` for environment-specific deployments.

---

## Domain 5 — Observability & Logging (3/10) 🔴

> [!CAUTION]
> This is the most critical gap for enterprise deployment. Currently there is **no structured logging, no metrics, and no distributed tracing**.

### Gaps Found

| Gap | Enterprise Standard | Recommendation |
|---|---|---|
| `console.log/warn` used everywhere | Structured JSON logs | Replace with `winston` or NestJS `Logger` |
| No request tracing | Correlation IDs | Add `X-Request-ID` header middleware |
| No metrics | Prometheus/Grafana | Expose `/metrics` via `@willsoto/nestjs-prometheus` |
| No centralized log aggregation | ELK / Loki | Configure log shipping to a log platform |
| No error tracking | Sentry/Datadog | Add Sentry SDK to both frontend and backend |
| No performance monitoring | APM | Add OpenTelemetry tracing |

**Minimum Viable Observability Stack (Recommended)**:
```
Backend Logs → Winston (JSON) → stdout → Loki
Metrics      → Prometheus → Grafana
Errors       → Sentry (frontend + backend)
Tracing      → OpenTelemetry
```

---

## Domain 6 — Data & Storage (5/10) ⚠️

### What's Already Enterprise-Grade
- ✅ **`synchronize: false` in production** (conditional on env)
- ✅ **SSL support** for Postgres connections

### Gaps Found

> [!CAUTION]
> **P0 — No database migrations**: TypeORM migrations must replace `synchronize`. This is a data safety requirement for production.

> [!WARNING]
> **P1 — No data backup strategy**: There is no documented or automated DB backup procedure. Enterprise standard: daily encrypted backups retained for 30 days (HIPAA).

> [!WARNING]
> **P1 — No connection pooling config**: The TypeORM config doesn't specify `extra: { max: 10 }` pool size. Under load, this will exhaust DB connections.

> [!NOTE]
> **P2 — No soft-delete pattern consistently applied**: Patient and Encounter entities should use `@DeleteDateColumn()` (TypeORM soft-delete) instead of `isActive: false` flags, which break standard queries.

---

## Domain 7 — DevOps & CI/CD (4/10) 🔴

### What's Already Present
- ✅ `Dockerfile` structure and `k8s/` directory exist
- ✅ `.github/` directory present (potential workflow configs)

### Gaps Found

> [!CAUTION]
> **P0 — No automated tests**: Zero unit tests in the backend (only [auth.service.spec.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.spec.ts) skeleton), zero E2E tests for frontend. Enterprise requires ≥ 80% code coverage gating on CI.

> [!CAUTION]
> **P0 — No `.env.example` file**: Secrets management has no documented schema. Every developer needs an `.env.example` to know what variables are required.

> [!WARNING]
> **P1 — No CI pipeline**: No GitHub Actions workflow for automated build, test, lint, and security scan on every PR.

> [!WARNING]
> **P1 — No secrets manager**: Secrets are passed as environment variables without rotation. Enterprise standard: AWS Secrets Manager / Azure Key Vault / HashiCorp Vault.

> [!NOTE]
> **P2 — No container image scanning**: Docker images must be scanned for CVEs on every build (Trivy / Snyk).

---

## Domain 8 — Compliance & Governance (7/10) ✅

### What's Already Enterprise-Grade
- ✅ **HIPAA Audit Log** module tracking all mutations with `userId` and `tenantId`
- ✅ **Multi-tenant architecture** — `tenantId` scoped on every entity
- ✅ **ABDM / ABHA** integration module for Indian health registry compliance
- ✅ **TPA/Insurance claim** module for billing compliance
- ✅ **Swagger API documentation** for regulatory review

### Gaps Found

> [!WARNING]
> **P1 — Audit logs not immutable**: Audit logs stored in the same DB can be altered by a DBA. Enterprise standard: write audit logs to a separate append-only store (e.g., AWS CloudTrail, separate DB with no-delete policy).

> [!NOTE]
> **P2 — No data retention policy**: HIPAA requires defining how long patient data is retained. Implement archival jobs for records older than the policy window.

> [!NOTE]
> **P2 — No consent management**: Patient consent for data processing (GDPR Article 7) is not formally captured in the data model.

---

## Prioritized Improvement Roadmap

### 🔴 P0 — Critical (Do Before Any Production Deployment)

| # | Action | File(s) |
|---|---|---|
| 1 | Move all secrets to environment variables, remove fallback strings | [main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts), [auth.service.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.ts), [app.module.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/app.module.ts) |
| 2 | Add global `AllExceptionsFilter` to return standardized error envelope | New: `common/filters/all-exceptions.filter.ts` |
| 3 | Add React `ErrorBoundary` component wrapping all routes | New: [frontend/src/components/ErrorBoundary.jsx](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/components/ErrorBoundary.jsx) |
| 4 | Replace `synchronize: true` with TypeORM migrations | [app.module.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/app.module.ts) |
| 5 | Add global state management (Zustand) for user/session | New: `frontend/src/store/` |
| 6 | Block `/auth/seed` endpoint in production | [auth.controller.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.controller.ts) |

### 🟡 P1 — High (Sprint 1 of Enterprise Hardening)

| # | Action | File(s) |
|---|---|---|
| 7 | Add `AllExceptionsFilter` + `LoggingInterceptor` | `common/filters/`, `common/interceptors/` |
| 8 | Convert all `interface` DTOs to `class` with `class-validator` | All service files |
| 9 | Replace `@Body() data: any` with typed DTOs | [analytics.controller.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/analytics/analytics.controller.ts) + others |
| 10 | Add pagination to all list endpoints | All controller GET handlers |
| 11 | Integrate Sentry for error tracking (frontend + backend) | [main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts), `main.jsx` |
| 12 | Add `@nestjs/terminus` health check endpoints | New: `health/health.module.ts` |
| 13 | Set `VITE_API_BASE_URL` env var instead of hardcoded URL | [api.js](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/lib/api.js), `.env.local` |

### 🔵 P2 — Medium (Sprint 2 of Enterprise Hardening)

| # | Action | File(s) |
|---|---|---|
| 14 | Add CI/CD pipeline (GitHub Actions: lint → test → build → scan) | `.github/workflows/ci.yml` |
| 15 | Integrate Prometheus metrics + Grafana dashboards | [main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts), `docker-compose.yml` |
| 16 | Add Redis caching for high-frequency reads | [app.module.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/app.module.ts) |
| 17 | Implement DB connection pooling config | [app.module.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/app.module.ts) TypeORM config |
| 18 | Add React Hook Form + Zod to all frontend forms | All `*.jsx` form components |
| 19 | Implement CSRF token on cookie auth endpoints | [main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts) (csurf middleware) |
| 20 | Add account lockout after N failed logins | [auth.service.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.ts) |

---

## Quick Wins (Can Be Done in < 1 Hour Each)

These are low-effort, high-impact changes you can make immediately:

1. **Create `.env.example`** — document all required environment variables
2. **Add `forbidNonWhitelisted: true`** in `ValidationPipe` ([main.ts](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/main.ts) line 38)
3. **Set `VITE_API_BASE_URL`** in `frontend/.env.local` and update [api.js](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/lib/api.js) line 12
4. **Add `helmet.contentSecurityPolicy()`** with a hospital-appropriate CSP policy
5. **Add NestJS `Logger`** class to replace all `console.log/warn` in services
6. **Add `extra: { max: 10 }` to TypeORM config** for DB connection pooling
