import { DomainEvent } from '@shared/domain/domain-event.base';
import { RoleId, TenantId } from '@shared/domain/types';
import { Role } from '../entities/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findById(id: RoleId, tenantId: TenantId): Promise<Role | null>;
  findByName(name: string, tenantId: TenantId): Promise<Role | null>;
  save(role: Role, outboxEvents?: DomainEvent[]): Promise<void>;
}
