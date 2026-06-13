import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { RoleId, TenantId, UserId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { User } from '../../domain/entities/user.entity';
import {
  FindUsersOptions,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId, tenantId: TenantId): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { userRoles: true },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string, tenantId: TenantId): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), tenantId, deletedAt: null },
      include: { userRoles: true },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, deletedAt: null },
      include: { userRoles: true },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findMany(
    options: FindUsersOptions,
  ): Promise<{ items: User[]; total: number }> {
    const where = {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.search
        ? { email: { contains: options.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { userRoles: true },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users.map((user) => UserMapper.toDomain(user)), total };
  }

  async save(user: User, outboxEvents: DomainEvent[] = []): Promise<void> {
    const data = UserMapper.toPersistence(user);
    const roleIds = [...user.roleIds];

    await this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: user.id },
        create: data,
        update: data,
      });

      const currentRoles = await tx.userRole.findMany({
        where: { userId: user.id },
      });
      const currentRoleIds = new Set(
        currentRoles.map((ur) => RoleId(ur.roleId)),
      );

      const toAdd = roleIds.filter((rid) => !currentRoleIds.has(rid));
      const toRemove = [...currentRoleIds].filter(
        (rid) => !roleIds.includes(rid),
      );

      if (toAdd.length > 0) {
        await tx.userRole.createMany({
          data: toAdd.map((roleId) => ({ userId: user.id, roleId })),
        });
      }
      if (toRemove.length > 0) {
        await tx.userRole.deleteMany({
          where: { userId: user.id, roleId: { in: toRemove } },
        });
      }

      await writeToOutbox(tx, outboxEvents);
    });
  }
}
