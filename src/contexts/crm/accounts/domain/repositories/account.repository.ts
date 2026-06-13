import { DomainEvent } from '@shared/domain/domain-event.base';
import { AccountId, TenantId } from '@shared/domain/types';
import { Account } from '../entities/account.entity';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface FindAccountsOptions {
  tenantId: TenantId;
  page: number;
  limit: number;
  search?: string;
}

export interface AccountRepository {
  findById(id: AccountId, tenantId: TenantId): Promise<Account | null>;
  findMany(
    options: FindAccountsOptions,
  ): Promise<{ items: Account[]; total: number }>;
  save(account: Account, outboxEvents?: DomainEvent[]): Promise<void>;
}
