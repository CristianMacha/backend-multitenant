import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RequestContextStorage,
  UserContext,
} from '@shared/context/request-context';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Enforces tenant isolation: every authenticated request must resolve
 * to a tenant, and non-platform-admin users can only operate within
 * their own tenant.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UserContext }>();
    if (!user) return false;

    const requestedTenantId = RequestContextStorage.getTenantId();

    if (
      requestedTenantId &&
      requestedTenantId !== user.tenantId &&
      !user.isPlatformAdmin
    ) {
      throw new ForbiddenException('Cross-tenant access is not allowed');
    }

    RequestContextStorage.setTenantId(requestedTenantId ?? user.tenantId);
    return true;
  }
}
