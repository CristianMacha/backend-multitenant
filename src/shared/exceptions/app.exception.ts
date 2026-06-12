import { HttpStatus } from '@nestjs/common';

/**
 * Root of the application exception hierarchy. Every layer throws a
 * subclass of this so the global exception filter can map errors to
 * the standard response envelope.
 */
export abstract class AppException extends Error {
  abstract readonly code: string;
  abstract readonly status: HttpStatus;

  protected constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
