import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * RolesGuard
 * -----------
 * Applied AFTER JwtAuthGuard (user is already authenticated).
 * Checks that req.user.role is included in the @Roles() list.
 * Falls through (allows) if no @Roles() decorator is present.
 *
 * Role Hierarchy (most-privileged first):
 *   super_admin > hospital_admin > doctor > nurse > billing_officer > receptionist
 */
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  hospital_admin: 80,
  doctor: 60,
  nurse: 40,
  billing_officer: 30,
  receptionist: 20,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public routes bypass all role checks
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('User identity not established.');

    // super_admin and hospital_admin bypass all role restrictions
    if (user.role === 'super_admin' || user.role === 'hospital_admin') return true;

    // Wildcard permissions bypass role check
    if (user.permissions?.includes('*:*')) return true;

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const hasRequiredRole = requiredRoles.some(
      (role) => role === user.role || userLevel >= (ROLE_HIERARCHY[role] ?? 999),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Requires role: [${requiredRoles.join(', ')}]. Your role: '${user.role}'.`,
      );
    }

    return true;
  }
}
