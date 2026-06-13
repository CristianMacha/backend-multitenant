import { DomainException } from '@shared/exceptions';
import { PhoneNumber } from './phone-number.vo';

describe('PhoneNumber', () => {
  it('normalizes by stripping spaces, dashes, dots and parentheses', () => {
    expect(PhoneNumber.from('+1 (415) 555-2671').toString()).toBe(
      '+14155552671',
    );
    expect(PhoneNumber.from('51.987.654.321').toString()).toBe('51987654321');
  });

  it('keeps a single leading plus sign', () => {
    expect(PhoneNumber.from('+34911222333').toString()).toBe('+34911222333');
  });

  it('treats equal normalized numbers as equal', () => {
    expect(
      PhoneNumber.from('+1 415 555 2671').equals(
        PhoneNumber.from('+14155552671'),
      ),
    ).toBe(true);
  });

  it.each([
    '',
    'abc',
    '123',
    '+0123456789',
    '++14155552671',
    '12345678901234567',
  ])('rejects invalid number %p', (raw) => {
    expect(() => PhoneNumber.from(raw)).toThrow(DomainException);
  });
});
