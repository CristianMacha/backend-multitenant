import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserContext } from '@shared/context/request-context';
import { ROLES_KEY } from '../decorators/roles.decorator';

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: UserContext }>();
    if (!user) return false;

    if (user.roles.includes(SUPER_ADMIN_ROLE)) return true;

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of the roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
