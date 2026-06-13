import { DomainEvent } from '@shared/domain/domain-event.base';
import { AccountId, ContactId, TenantId } from '@shared/domain/types';
import { Contact } from '../entities/contact.entity';

export const CONTACT_REPOSITORY = Symbol('CONTACT_REPOSITORY');

export interface FindContactsOptions {
  tenantId: TenantId;
  page: number;
  limit: number;
  search?: string;
  accountId?: AccountId;
}

export interface ContactRepository {
  findById(id: ContactId, tenantId: TenantId): Promise<Contact | null>;
  findMany(
    options: FindContactsOptions,
  ): Promise<{ items: Contact[]; total: number }>;
  save(contact: Contact, outboxEvents?: DomainEvent[]): Promise<void>;
}
