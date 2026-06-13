import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { TenantId, UserId } from '@shared/domain/types';
import { Address, AddressProps } from '@shared/domain/value-objects/address.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { DomainException } from '@shared/exceptions';
import {
  AccountArchivedEvent,
  AccountCreatedEvent,
  AccountOwnerChangedEvent,
  AccountUpdatedEvent,
} from '../events/account.events';

export type AccountStatus = 'ACTIVE' | 'ARCHIVED';

export interface AccountProps extends BaseEntityProps {
  tenantId: TenantId;
  name: string;
  industry?: string;
  website?: string;
  phone?: PhoneNumber;
  address?: Address;
  ownerId: UserId;
  status: AccountStatus;
}

/** Raw props for create — value objects are validated inside. */
export interface CreateAccountProps {
  tenantId: TenantId;
  name: string;
  ownerId: UserId;
  industry?: string;
  website?: string;
  phone?: string;
  address?: AddressProps;
}

/** Mutable fields. `null` clears an optional field; `undefined` leaves it. */
export interface UpdateAccountProps {
  name?: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: AddressProps | null;
}

export interface RehydrateAccountProps extends Omit<
  AccountProps,
  'phone' | 'address'
> {
  phone?: string | null;
  address?: AddressProps | null;
}

export class Account extends AggregateRoot<AccountProps> {
  private constructor(props: AccountProps) {
    super(props);
  }

  static create(props: CreateAccountProps): Account {
    const name = props.name.trim();
    if (!name) {
      throw new DomainException('Account name is required', 'INVALID_ACCOUNT');
    }
    const account = new Account({
      tenantId: props.tenantId,
      name,
      industry: clean(props.industry),
      website: clean(props.website),
      phone: props.phone ? PhoneNumber.from(props.phone) : undefined,
      address: props.address ? Address.from(props.address) : undefined,
      ownerId: props.ownerId,
      status: 'ACTIVE',
    });
    account.addDomainEvent(
      new AccountCreatedEvent(
        account.id,
        account.tenantId,
        account.name,
        account.ownerId,
      ),
    );
    return account;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: RehydrateAccountProps): Account {
    return new Account({
      ...props,
      phone: props.phone ? PhoneNumber.from(props.phone) : undefined,
      address: props.address ? Address.from(props.address) : undefined,
    });
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get industry(): string | undefined {
    return this.props.industry;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get phone(): string | undefined {
    return this.props.phone?.toString();
  }

  get address(): AddressProps | undefined {
    return this.props.address?.toJSON();
  }

  get ownerId(): UserId {
    return this.props.ownerId;
  }

  get status(): AccountStatus {
    return this.props.status;
  }

  get isArchived(): boolean {
    return this.props.status === 'ARCHIVED';
  }

  update(changes: UpdateAccountProps): void {
    this.assertActive();

    const applied: Record<string, unknown> = {};

    if (changes.name !== undefined) {
      const name = changes.name.trim();
      if (!name) {
        throw new DomainException(
          'Account name is required',
          'INVALID_ACCOUNT',
        );
      }
      this.props.name = name;
      applied.name = name;
    }
    if (changes.industry !== undefined) {
      this.props.industry = clean(changes.industry);
      applied.industry = this.props.industry ?? null;
    }
    if (changes.website !== undefined) {
      this.props.website = clean(changes.website);
      applied.website = this.props.website ?? null;
    }
    if (changes.phone !== undefined) {
      this.props.phone = changes.phone
        ? PhoneNumber.from(changes.phone)
        : undefined;
      applied.phone = this.props.phone?.toString() ?? null;
    }
    if (changes.address !== undefined) {
      this.props.address = changes.address
        ? Address.from(changes.address)
        : undefined;
      applied.address = this.props.address?.toJSON() ?? null;
    }

    if (Object.keys(applied).length === 0) return;

    this.touch();
    this.addDomainEvent(
      new AccountUpdatedEvent(this.id, this.tenantId, applied),
    );
  }

  changeOwner(ownerId: UserId): void {
    this.assertActive();
    if (this.props.ownerId === ownerId) return;
    this.props.ownerId = ownerId;
    this.touch();
    this.addDomainEvent(
      new AccountOwnerChangedEvent(this.id, this.tenantId, ownerId),
    );
  }

  archive(): void {
    if (this.isArchived) {
      throw new DomainException(
        'Account is already archived',
        'ACCOUNT_ALREADY_ARCHIVED',
      );
    }
    this.props.status = 'ARCHIVED';
    this.softDelete();
    this.addDomainEvent(new AccountArchivedEvent(this.id, this.tenantId));
  }

  private assertActive(): void {
    if (this.isArchived || this.isDeleted) {
      throw new DomainException(
        'Cannot modify an archived account',
        'ACCOUNT_ARCHIVED',
      );
    }
  }
}

function clean(raw?: string | null): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}
