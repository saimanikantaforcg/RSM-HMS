import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * TenantMiddleware: Reads the JWT on every incoming request and
 * automatically attaches req.tenantId from the token payload.
 * This enables all services to filter records by tenantId without
 * each controller having to manually extract it.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request & { tenantId?: string }, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        // CRITICAL FIX: Use verify instead of decode to ensure signature integrity
        // Pre-decoding tenantId for downstream middleware, but it's now cryptographically verified.
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error('JWT_SECRET environment variable is required');
        const payload: any = this.jwtService.verify(token, { secret: jwtSecret });
        if (payload?.tenantId) {
          req.tenantId = payload.tenantId;
        }
      } catch {
        // Ignore malformed tokens — JwtAuthGuard will reject them later
      }
    }
    next();
  }
}
