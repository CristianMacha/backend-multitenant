import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import {
  RequestContextStorage,
  UserContext,
} from '@shared/context/request-context';

/**
 * Resolves the effective tenant for the current request:
 * - Regular users → their own tenant (from the authenticated UserContext).
 * - Platform admins → the tenant from the `x-tenant-id` header if provided,
 *   falling back to their own tenant. This enables cross-tenant operations
 *   without requiring a separate endpoint per tenant.
 */
export const EffectiveTenantId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const user = ctx.switchToHttp().getRequest<{ user?: UserContext }>().user;
    if (!user) throw new UnauthorizedException();

    if (user.isPlatformAdmin) {
      return RequestContextStorage.getTenantId() ?? user.tenantId;
    }
    return user.tenantId;
  },
);
