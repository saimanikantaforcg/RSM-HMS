import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * CSRF Double-Submit Cookie Middleware
 * ------------------------------------
 * Strategy: Double-Submit Cookie pattern
 *   1. On GET requests, set a `csrf-token` cookie (non-HttpOnly, JS-readable).
 *   2. On state-mutating requests (POST/PUT/PATCH/DELETE), require the client
 *      to echo the token in the `x-csrf-token` request header.
 *   3. Middleware compares header value to cookie value — a cross-origin attacker
 *      cannot read the cookie (SameSite + CORS) so they cannot forge the header.
 *
 * Exemptions:
 *   - /api/v1/auth/login, /api/v1/auth/refresh — bootstraps the token
 *   - /api/v1/health, /api/v1/metrics — monitoring endpoints
 *   - Swagger docs
 *   - GET / HEAD / OPTIONS requests (read-only, safe methods)
 *
 * Frontend contract:
 *   - On first load (or after login), call GET /api/v1/auth/csrf-token to receive
 *     the cookie.
 *   - Include `x-csrf-token: <value>` header on every mutating request.
 *   - api.js should read document.cookie for 'csrf-token' and inject the header.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/csrf-token',
  '/api/v1/health',
  '/api/v1/metrics',
  '/api/docs',
];

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Allow disabling CSRF in test environments
    if (process.env.NODE_ENV === 'test') return next();

    const path = req.originalUrl?.split('?')[0] ?? req.url?.split('?')[0] ?? req.path;
    const method = req.method.toUpperCase();

    // Skip safe HTTP methods
    if (SAFE_METHODS.has(method)) {
      // Issue a token on GET if one isn't already set
      this.ensureToken(req, res);
      return next();
    }

    // Skip exempt paths
    if (EXEMPT_PATHS.some(p => path.startsWith(p))) {
      return next();
    }

    // Validate token on mutating requests
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch. Refresh the page and try again.');
    }

    next();
  }

  private ensureToken(req: Request, res: Response): void {
    if (req.cookies?.[CSRF_COOKIE]) return; // Already set

    const token = randomUUID();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,   // MUST be JS-readable so the frontend can read and send it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_TTL_MS,
      path: '/',
    });
  }
}
