import { DomainEvent } from '@shared/domain/domain-event.base';
import { TenantId, UserId } from '@shared/domain/types';
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface FindUsersOptions {
  tenantId: TenantId;
  page: number;
  limit: number;
  search?: string;
}

export interface UserRepository {
  findById(id: UserId, tenantId: TenantId): Promise<User | null>;
  findByEmail(email: string, tenantId: TenantId): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findMany(
    options: FindUsersOptions,
  ): Promise<{ items: User[]; total: number }>;
  save(user: User, outboxEvents?: DomainEvent[]): Promise<void>;
}
