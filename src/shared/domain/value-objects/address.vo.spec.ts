import { DomainException } from '@shared/exceptions';
import { Address } from './address.vo';

describe('Address', () => {
  it('trims fields and exposes them', () => {
    const address = Address.from({
      street: '  742 Evergreen Terrace ',
      city: ' Springfield ',
      country: ' US ',
    });
    expect(address.street).toBe('742 Evergreen Terrace');
    expect(address.city).toBe('Springfield');
    expect(address.country).toBe('US');
    expect(address.state).toBeUndefined();
  });

  it('drops blank fields to undefined', () => {
    const address = Address.from({ city: 'Lima', state: '   ' });
    expect(address.city).toBe('Lima');
    expect(address.state).toBeUndefined();
  });

  it('serializes via toJSON', () => {
    expect(Address.from({ city: 'Lima' }).toJSON()).toEqual({
      street: undefined,
      city: 'Lima',
      state: undefined,
      postalCode: undefined,
      country: undefined,
    });
  });

  it('rejects an entirely empty address', () => {
    expect(() => Address.from({})).toThrow(DomainException);
    expect(() => Address.from({ street: '  ', city: '' })).toThrow(
      DomainException,
    );
  });

  it('treats equal addresses as equal', () => {
    expect(
      Address.from({ city: 'Lima' }).equals(Address.from({ city: 'Lima' })),
    ).toBe(true);
  });
});
