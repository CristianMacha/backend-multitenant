import { DomainEvent } from '@shared/domain/domain-event.base';
import { Tenant } from '../entities/tenant.entity';

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface FindTenantsOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findMany(
    options: FindTenantsOptions,
  ): Promise<{ items: Tenant[]; total: number }>;
  save(tenant: Tenant, outboxEvents?: DomainEvent[]): Promise<void>;
}
