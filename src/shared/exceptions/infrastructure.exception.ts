import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

/** Failures in external dependencies: database, cache, queues, third-party APIs. */
export class InfrastructureException extends AppException {
  readonly status = HttpStatus.INTERNAL_SERVER_ERROR;

  constructor(
    message: string,
    readonly code: string = 'INFRASTRUCTURE_ERROR',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}
