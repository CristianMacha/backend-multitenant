import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserContext } from '@shared/context/request-context';
import { IS_PLATFORM_ADMIN_KEY } from '../decorators/platform-admin.decorator';

/**
 * Enforces `@PlatformAdmin()`: routes marked with it are reachable only
 * by platform-level super admins. Routes without the marker pass through.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const platformAdminOnly = this.reflector.getAllAndOverride<boolean>(
      IS_PLATFORM_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!platformAdminOnly) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UserContext }>();
    if (!user) return false;

    if (!user.isPlatformAdmin) {
      throw new ForbiddenException(
        'Requires platform administrator privileges',
      );
    }
    return true;
  }
}
