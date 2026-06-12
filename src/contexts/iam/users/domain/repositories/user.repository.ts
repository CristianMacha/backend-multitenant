import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface FindUsersOptions {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface UserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findByFirebaseUid(firebaseUid: string): Promise<User | null>;
  findMany(
    options: FindUsersOptions,
  ): Promise<{ items: User[]; total: number }>;
  save(user: User): Promise<void>;
}
