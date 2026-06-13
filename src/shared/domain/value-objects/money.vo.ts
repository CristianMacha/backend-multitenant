import { DomainException } from '@shared/exceptions';
import { ValueObject } from '../value-object.base';

interface MoneyProps {
  /** Amount in major units (e.g. 1234.56), non-negative, max 2 decimals. */
  readonly amount: number;
  /** ISO 4217 currency code, 3 uppercase letters (e.g. USD, EUR, PEN). */
  readonly currency: string;
}

const ISO_4217_REGEX = /^[A-Z]{3}$/;

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  /** Validates and normalizes an amount + ISO 4217 currency pair. */
  static of(amount: number, currency: string): Money {
    if (!Number.isFinite(amount)) {
      throw new DomainException(
        `Invalid money amount: ${amount}`,
        'INVALID_MONEY_AMOUNT',
      );
    }
    if (amount < 0) {
      throw new DomainException(
        'Money amount cannot be negative',
        'INVALID_MONEY_AMOUNT',
      );
    }
    if (Math.round(amount * 100) !== amount * 100) {
      throw new DomainException(
        `Money amount supports at most 2 decimals: ${amount}`,
        'INVALID_MONEY_AMOUNT',
      );
    }
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!ISO_4217_REGEX.test(normalizedCurrency)) {
      throw new DomainException(
        `Invalid currency code: ${currency}`,
        'INVALID_CURRENCY',
      );
    }
    return new Money({ amount, currency: normalizedCurrency });
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): string {
    return this.value.currency;
  }

  toString(): string {
    return `${this.value.amount.toFixed(2)} ${this.value.currency}`;
  }
}
