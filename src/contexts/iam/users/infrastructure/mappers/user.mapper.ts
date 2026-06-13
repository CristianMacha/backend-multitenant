import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { RoleId, TenantId } from '@shared/domain/types';
import { User } from '../../domain/entities/user.entity';

type PrismaUserWithRoles = PrismaUser & { userRoles: PrismaUserRole[] };

export class UserMapper {
  static toDomain(raw: PrismaUserWithRoles): User {
    return User.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      firebaseUid: raw.firebaseUid,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      isActive: raw.isActive,
      roleIds: raw.userRoles.map((ur) => RoleId(ur.roleId)),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(
    user: User,
  ): Omit<PrismaUser, 'createdAt' | 'updatedAt' | 'isPlatformAdmin'> {
    return {
      id: user.id,
      tenantId: user.tenantId,
      firebaseUid: user.firebaseUid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
    };
  }
}
