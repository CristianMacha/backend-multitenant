import { DomainException } from '@shared/exceptions';
import { Money } from './money.vo';

describe('Money', () => {
  it('exposes amount and normalized currency', () => {
    const money = Money.of(1234.56, 'usd');
    expect(money.amount).toBe(1234.56);
    expect(money.currency).toBe('USD');
  });

  it('formats via toString', () => {
    expect(Money.of(10, 'EUR').toString()).toBe('10.00 EUR');
  });

  it('allows zero', () => {
    expect(Money.of(0, 'PEN').amount).toBe(0);
  });

  it('rejects negative amounts', () => {
    expect(() => Money.of(-1, 'USD')).toThrow(DomainException);
  });

  it('rejects non-finite amounts', () => {
    expect(() => Money.of(Number.NaN, 'USD')).toThrow(DomainException);
    expect(() => Money.of(Number.POSITIVE_INFINITY, 'USD')).toThrow(
      DomainException,
    );
  });

  it('rejects more than 2 decimals', () => {
    expect(() => Money.of(1.234, 'USD')).toThrow(DomainException);
  });

  it.each(['US', 'USDD', 'us1', ''])(
    'rejects invalid currency %p',
    (currency) => {
      expect(() => Money.of(10, currency)).toThrow(DomainException);
    },
  );

  it('treats equal amount + currency as equal', () => {
    expect(Money.of(5, 'USD').equals(Money.of(5, 'usd'))).toBe(true);
  });
});
