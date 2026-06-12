import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

/** Invariant violations inside the domain model. */
export class DomainException extends AppException {
  readonly status = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(
    message: string,
    readonly code: string = 'DOMAIN_RULE_VIOLATION',
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}
