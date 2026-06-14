import { TenantId } from '@shared/domain/types';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from './user.mapper';

const makeRaw = () => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  firebaseUid: 'firebase-uid-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  isPlatformAdmin: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
  userRoles: [{ roleId: 'role-1' }],
});

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row (with roles) to User aggregate', () => {
      const user = UserMapper.toDomain(makeRaw() as never);
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('user@example.com');
      expect(user.firstName).toBe('John');
      expect(user.roleIds).toHaveLength(1);
    });

    it('maps user with no roles', () => {
      const raw = { ...makeRaw(), userRoles: [] };
      const user = UserMapper.toDomain(raw);
      expect(user.roleIds).toHaveLength(0);
    });
  });

  describe('toPersistence', () => {
    it('maps User aggregate to persistence shape', () => {
      const user = User.create({
        tenantId: TenantId('tenant-1'),
        firebaseUid: 'firebase-uid-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      user.pullDomainEvents();
      const row = UserMapper.toPersistence(user);
      expect(row.email).toBe('user@example.com');
      expect(row.firstName).toBe('John');
      expect(row.tenantId).toBe('tenant-1');
    });
  });
});
