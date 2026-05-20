import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

// ─── Helpers ────────────────────────────────────────────────────────────────
function createMockContext(userRole: string, permissions: string[] = []): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { role: userRole, permissions },
      }),
    }),
  } as any;
}

// ─── Tests ──────────────────────────────────────────────────────────────────
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should ALLOW access when no @Roles() decorator is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)   // IS_PUBLIC_KEY → not public
      .mockReturnValueOnce(undefined); // ROLES_KEY → no roles required
    const ctx = createMockContext('nurse');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should ALLOW access when user role matches required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['doctor']);
    const ctx = createMockContext('doctor');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should ALLOW super_admin regardless of required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['billing_officer']);
    const ctx = createMockContext('super_admin');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should ALLOW hospital_admin regardless of required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['doctor', 'nurse']);
    const ctx = createMockContext('hospital_admin');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should ALLOW user with wildcard permissions (*:*)', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['doctor']);
    const ctx = createMockContext('receptionist', ['*:*']);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should DENY access when role is insufficient', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['doctor']);
    const ctx = createMockContext('receptionist');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should DENY receptionist access to hospital_admin-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['hospital_admin']);
    const ctx = createMockContext('nurse');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should DENY when user is missing from request', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(['doctor']);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
    } as any;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
