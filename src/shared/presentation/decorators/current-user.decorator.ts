import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@shared/context/request-context';

/** Injects the authenticated UserContext (or one of its fields) into a handler parameter. */
export const CurrentUser = createParamDecorator(
  (field: keyof UserContext | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<{ user?: UserContext }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
