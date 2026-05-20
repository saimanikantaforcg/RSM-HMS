import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles('doctor', 'hospital_admin')
 * Apply to any controller method to restrict access by role.
 * Works in conjunction with RolesGuard.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
