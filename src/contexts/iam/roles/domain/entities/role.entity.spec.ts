import { DomainException } from '@shared/exceptions';
import { Role } from './role.entity';

const makeRole = () => {
  const r = Role.create('tenant-1', 'SALES_REP', 'Sales representative');
  r.pullDomainEvents();
  return r;
};

const makeSystemRole = () =>
  Role.fromPersistence({
    id: 'sys-1',
    tenantId: 'tenant-1',
    name: 'ADMIN',
    description: null,
    isSystem: true,
    permissionIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

describe('Role', () => {
  describe('create', () => {
    it('creates role with name uppercased', () => {
      const role = Role.create('tenant-1', 'sales_rep', null);
      expect(role.name).toBe('SALES_REP');
      expect(role.isSystem).toBe(false);
    });

    it('throws when name is empty', () => {
      expect(() => Role.create('tenant-1', '  ', null)).toThrow(
        DomainException,
      );
    });
  });

  describe('update', () => {
    it('updates name', () => {
      const role = makeRole();
      role.update({ name: 'new_name' });
      expect(role.name).toBe('NEW_NAME');
    });

    it('updates description', () => {
      const role = makeRole();
      role.update({ description: 'Updated desc' });
      expect(role.description).toBe('Updated desc');
    });

    it('throws when updated name is empty', () => {
      const role = makeRole();
      expect(() => role.update({ name: '' })).toThrow(DomainException);
    });

    it('throws when updating a system role', () => {
      const role = makeSystemRole();
      expect(() => role.update({ name: 'HACKED' })).toThrow(DomainException);
    });
  });

  describe('setPermissions', () => {
    it('sets permissions and deduplicates', () => {
      const role = makeRole();
      role.setPermissions(['perm-1', 'perm-2', 'perm-1']);
      expect(role.permissionIds).toHaveLength(2);
    });

    it('throws when setting permissions on a system role', () => {
      const role = makeSystemRole();
      expect(() => role.setPermissions(['perm-1'])).toThrow(DomainException);
    });
  });

  describe('delete', () => {
    it('soft-deletes the role', () => {
      const role = makeRole();
      role.delete();
      expect(role.isDeleted).toBe(true);
    });

    it('throws when deleting a system role', () => {
      const role = makeSystemRole();
      expect(() => role.delete()).toThrow(DomainException);
    });

    it('throws when role is already deleted', () => {
      const role = makeRole();
      role.delete();
      role.pullDomainEvents();
      expect(() => role.delete()).toThrow(DomainException);
    });
  });
});
