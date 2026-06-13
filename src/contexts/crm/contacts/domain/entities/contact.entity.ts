import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { AccountId, TenantId, UserId } from '@shared/domain/types';
import { Email } from '@shared/domain/value-objects/email.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { DomainException } from '@shared/exceptions';
import {
  ContactCreatedEvent,
  ContactDeletedEvent,
  ContactLinkedToAccountEvent,
  ContactUpdatedEvent,
} from '../events/contact.events';

export interface ContactProps extends BaseEntityProps {
  tenantId: TenantId;
  firstName: string;
  lastName: string;
  email?: Email;
  phone?: PhoneNumber;
  jobTitle?: string;
  accountId?: AccountId;
  ownerId: UserId;
}

/** Raw props for create — value objects are validated inside. */
export interface CreateContactProps {
  tenantId: TenantId;
  ownerId: UserId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  accountId?: AccountId;
}

/** Mutable fields. `null` clears an optional field; `undefined` leaves it. */
export interface UpdateContactProps {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
}

export interface RehydrateContactProps extends Omit<
  ContactProps,
  'email' | 'phone'
> {
  email?: string | null;
  phone?: string | null;
}

export class Contact extends AggregateRoot<ContactProps> {
  private constructor(props: ContactProps) {
    super(props);
  }

  static create(props: CreateContactProps): Contact {
    const firstName = props.firstName.trim();
    const lastName = props.lastName.trim();
    if (!firstName || !lastName) {
      throw new DomainException(
        'Contact first and last name are required',
        'INVALID_CONTACT',
      );
    }
    const contact = new Contact({
      tenantId: props.tenantId,
      firstName,
      lastName,
      email: props.email ? Email.from(props.email) : undefined,
      phone: props.phone ? PhoneNumber.from(props.phone) : undefined,
      jobTitle: clean(props.jobTitle),
      accountId: props.accountId,
      ownerId: props.ownerId,
    });
    contact.addDomainEvent(
      new ContactCreatedEvent(contact.id, contact.tenantId, contact.ownerId),
    );
    return contact;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: RehydrateContactProps): Contact {
    return new Contact({
      ...props,
      email: props.email ? Email.from(props.email) : undefined,
      phone: props.phone ? PhoneNumber.from(props.phone) : undefined,
    });
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get email(): string | undefined {
    return this.props.email?.getValue();
  }

  get phone(): string | undefined {
    return this.props.phone?.toString();
  }

  get jobTitle(): string | undefined {
    return this.props.jobTitle;
  }

  get accountId(): AccountId | undefined {
    return this.props.accountId;
  }

  get ownerId(): UserId {
    return this.props.ownerId;
  }

  update(changes: UpdateContactProps): void {
    this.assertNotDeleted();

    const applied: Record<string, unknown> = {};

    if (changes.firstName !== undefined) {
      const firstName = changes.firstName.trim();
      if (!firstName) {
        throw new DomainException(
          'Contact first name is required',
          'INVALID_CONTACT',
        );
      }
      this.props.firstName = firstName;
      applied.firstName = firstName;
    }
    if (changes.lastName !== undefined) {
      const lastName = changes.lastName.trim();
      if (!lastName) {
        throw new DomainException(
          'Contact last name is required',
          'INVALID_CONTACT',
        );
      }
      this.props.lastName = lastName;
      applied.lastName = lastName;
    }
    if (changes.email !== undefined) {
      this.props.email = changes.email ? Email.from(changes.email) : undefined;
      applied.email = this.props.email?.getValue() ?? null;
    }
    if (changes.phone !== undefined) {
      this.props.phone = changes.phone
        ? PhoneNumber.from(changes.phone)
        : undefined;
      applied.phone = this.props.phone?.toString() ?? null;
    }
    if (changes.jobTitle !== undefined) {
      this.props.jobTitle = clean(changes.jobTitle);
      applied.jobTitle = this.props.jobTitle ?? null;
    }

    if (Object.keys(applied).length === 0) return;

    this.touch();
    this.addDomainEvent(
      new ContactUpdatedEvent(this.id, this.tenantId, applied),
    );
  }

  linkToAccount(accountId: AccountId | null): void {
    this.assertNotDeleted();
    const next = accountId ?? undefined;
    if (this.props.accountId === next) return;
    this.props.accountId = next;
    this.touch();
    this.addDomainEvent(
      new ContactLinkedToAccountEvent(this.id, this.tenantId, accountId),
    );
  }

  delete(): void {
    if (this.isDeleted) {
      throw new DomainException(
        'Contact is already deleted',
        'CONTACT_ALREADY_DELETED',
      );
    }
    this.softDelete();
    this.addDomainEvent(new ContactDeletedEvent(this.id, this.tenantId));
  }

  private assertNotDeleted(): void {
    if (this.isDeleted) {
      throw new DomainException(
        'Cannot modify a deleted contact',
        'CONTACT_DELETED',
      );
    }
  }
}

function clean(raw?: string | null): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}
