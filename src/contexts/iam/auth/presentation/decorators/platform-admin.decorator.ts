import { SetMetadata } from '@nestjs/common';

export const IS_PLATFORM_ADMIN_KEY = 'isPlatformAdminOnly';

/**
 * Restricts a route to platform-level super admins (global operators
 * that manage the platform across all tenants, e.g. tenant management).
 * This is the only correct way to gate cross-tenant administration —
 * never a per-tenant role.
 */
export const PlatformAdmin = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PLATFORM_ADMIN_KEY, true);
