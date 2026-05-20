import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

// ─── Helper function for required env vars ──────────────────────────────────
function throwError(message: string): never {
  throw new Error(`Configuration Error: ${message}. Please set the required environment variable.`);
}

export interface JwtPayload {
  sub: string;           // user UUID
  email: string;
  tenantId: string;      // hospital UUID
  role: string;
  permissions: string[];
  name: string;
}

// Extract JWT from: 1) Authorization Bearer header, 2) accessToken cookie
const jwtExtractor = (req: Request): string | null => {
  // Priority 1: Bearer token (for API clients, Swagger, mobile)
  const bearerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearerToken) return bearerToken;

  // Priority 2: HttpOnly cookie (for browser-based sessions)
  if (req?.cookies?.accessToken) return req.cookies.accessToken;

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || throwError('JWT_SECRET is required'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload; // This becomes req.user in all controllers
  }
}
