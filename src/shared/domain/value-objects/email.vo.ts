import { DomainException } from '@shared/exceptions';
import { ValueObject } from '../value-object.base';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /** Normalizes (trim + lowercase) and validates the address. */
  static from(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new DomainException(`Invalid email: ${raw}`, 'INVALID_EMAIL');
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
}
