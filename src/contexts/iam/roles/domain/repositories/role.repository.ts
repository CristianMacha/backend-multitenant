import { Role } from '../entities/role.entity';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findById(id: string, tenantId: string): Promise<Role | null>;
  findByName(name: string, tenantId: string): Promise<Role | null>;
  save(role: Role): Promise<void>;
}
