import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';

/** Use-case level errors (application layer). */
export class BusinessException extends AppException {
  constructor(
    message: string,
    readonly code: string = 'BUSINESS_RULE_VIOLATION',
    readonly status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class EntityNotFoundException extends BusinessException {
  constructor(entity: string, id: string) {
    super(
      `${entity} with id "${id}" not found`,
      'ENTITY_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      {
        entity,
        id,
      },
    );
  }
}

export class EntityAlreadyExistsException extends BusinessException {
  constructor(entity: string, field: string, value: string) {
    super(
      `${entity} with ${field} "${value}" already exists`,
      'ENTITY_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      { entity, field, value },
    );
  }
}

/**
 * The actor is authenticated but not allowed to perform this specific
 * action (e.g. privilege escalation: granting a role/permission they do
 * not themselves hold, or mutating a protected system role).
 */
export class ForbiddenActionException extends BusinessException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'FORBIDDEN_ACTION', HttpStatus.FORBIDDEN, details);
  }
}
