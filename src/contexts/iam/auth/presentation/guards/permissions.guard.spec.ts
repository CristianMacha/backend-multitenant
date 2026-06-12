import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { UserContext } from '@shared/context/request-context';

const createContext = (user?: Partial<UserContext>): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('PermissionsGuard', () => {
  let reflector: Reflector;
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('denies access when there is no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.read']);
    expect(guard.canActivate(createContext(undefined))).toBe(false);
  });

  it('allows users holding all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['users.read', 'users.update']);
    const context = createContext({
      roles: ['ADMIN'],
      permissions: ['users.read', 'users.update', 'users.delete'],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException listing missing permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['users.delete']);
    const context = createContext({
      roles: ['USER'],
      permissions: ['users.read'],
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('bypasses the check for SUPER_ADMIN', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['users.delete']);
    const context = createContext({ roles: ['SUPER_ADMIN'], permissions: [] });
    expect(guard.canActivate(context)).toBe(true);
  });
});
