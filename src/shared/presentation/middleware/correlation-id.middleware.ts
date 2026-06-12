import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestContextStorage } from '../../context/request-context';

export const CORRELATION_ID_HEADER = 'x-request-id';

/**
 * Initializes the per-request AsyncLocalStorage context and guarantees
 * every request carries an x-request-id for end-to-end traceability.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) ?? randomUUID();
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    RequestContextStorage.run(
      {
        correlationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      () => next(),
    );
  }
}
