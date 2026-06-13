import { DomainException } from '@shared/exceptions';
import { ValueObject } from '../value-object.base';

export interface AddressProps {
  readonly street?: string;
  readonly city?: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country?: string;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  /**
   * Trims every field and drops empties. Requires at least one non-empty
   * field — an entirely empty address is meaningless (use `undefined` instead).
   */
  static from(props: AddressProps): Address {
    const normalized: AddressProps = {
      street: clean(props.street),
      city: clean(props.city),
      state: clean(props.state),
      postalCode: clean(props.postalCode),
      country: clean(props.country),
    };
    const hasAny = Object.values(normalized).some((v) => v !== undefined);
    if (!hasAny) {
      throw new DomainException('Address cannot be empty', 'INVALID_ADDRESS');
    }
    return new Address(normalized);
  }

  get street(): string | undefined {
    return this.value.street;
  }

  get city(): string | undefined {
    return this.value.city;
  }

  get state(): string | undefined {
    return this.value.state;
  }

  get postalCode(): string | undefined {
    return this.value.postalCode;
  }

  get country(): string | undefined {
    return this.value.country;
  }

  toJSON(): AddressProps {
    return { ...this.value };
  }
}

function clean(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}
