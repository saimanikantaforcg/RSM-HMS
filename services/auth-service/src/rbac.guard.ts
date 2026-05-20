import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  // In a robust implementation, roles are injected via Custom @Roles() Decorator and Reflector.
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Assuming the JWT payload is attached to the request header or request.user
    const userRole = request.headers['x-user-role'] || 'guest';
    const requiredRole = 'doctor'; // Example default guard
    
    if (userRole === 'super_admin' || userRole === 'hospital_admin' || userRole === requiredRole) {
      return true;
    }
    
    throw new ForbiddenException('Insufficient RBAC permissions context.');
  }
}
