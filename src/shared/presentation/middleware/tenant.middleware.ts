import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestContextStorage } from '../../context/request-context';

export const TENANT_HEADER = 'x-tenant-id';

/**
 * Captures the tenant requested via header. The authenticated user's
 * tenant (resolved by the auth guard) always takes precedence; this
 * header mainly supports SUPER_ADMIN cross-tenant operations and
 * unauthenticated tenant resolution.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const tenantId = req.headers[TENANT_HEADER] as string | undefined;
    if (tenantId) {
      RequestContextStorage.setTenantId(tenantId);
    }
    next();
  }
}
