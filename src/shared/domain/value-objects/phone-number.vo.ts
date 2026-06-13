import { DomainException } from '@shared/exceptions';
import { ValueObject } from '../value-object.base';

/** Matches an optional leading `+` followed by 7–15 digits (E.164-ish). */
const E164_REGEX = /^\+?[1-9]\d{6,14}$/;

export class PhoneNumber extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Normalizes a raw phone number (strips spaces, dashes, dots, parentheses)
   * and validates it loosely against E.164. Keeps a single optional leading `+`.
   */
  static from(raw: string): PhoneNumber {
    const normalized = raw.replace(/[\s().-]/g, '');
    if (!E164_REGEX.test(normalized)) {
      throw new DomainException(
        `Invalid phone number: ${raw}`,
        'INVALID_PHONE_NUMBER',
      );
    }
    return new PhoneNumber(normalized);
  }

  toString(): string {
    return this.value;
  }
}
