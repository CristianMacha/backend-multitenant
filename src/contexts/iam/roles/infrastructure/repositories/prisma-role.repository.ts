import { Injectable } from '@nestjs/common';
import { Role as PrismaRole, RolePermission } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { RoleId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Role } from '../../domain/entities/role.entity';
import { RoleRepository } from '../../domain/repositories/role.repository';

type PrismaRoleWithPermissions = PrismaRole & {
  rolePermissions: RolePermission[];
};

const toDomain = (raw: PrismaRoleWithPermissions): Role =>
  Role.fromPersistence({
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    description: raw.description,
    isSystem: raw.isSystem,
    permissionIds: raw.rolePermissions.map((rp) => rp.permissionId),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt,
  });

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: RoleId, tenantId: TenantId): Promise<Role | null> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { rolePermissions: true },
    });
    return role ? toDomain(role) : null;
  }

  async findByName(name: string, tenantId: TenantId): Promise<Role | null> {
    const role = await this.prisma.role.findFirst({
      where: { name, tenantId, deletedAt: null },
      include: { rolePermissions: true },
    });
    return role ? toDomain(role) : null;
  }

  async save(role: Role, outboxEvents: DomainEvent[] = []): Promise<void> {
    const data = {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      deletedAt: role.deletedAt,
    };
    const permissionIds = [...role.permissionIds];

    await this.prisma.$transaction(async (tx) => {
      await tx.role.upsert({
        where: { id: role.id },
        create: data,
        update: data,
      });

      const current = await tx.rolePermission.findMany({
        where: { roleId: role.id },
      });
      const currentIds = new Set(current.map((rp) => rp.permissionId));

      const toAdd = permissionIds.filter((id) => !currentIds.has(id));
      const toRemove = [...currentIds].filter(
        (id) => !permissionIds.includes(id),
      );

      if (toAdd.length > 0) {
        await tx.rolePermission.createMany({
          data: toAdd.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }
      if (toRemove.length > 0) {
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id, permissionId: { in: toRemove } },
        });
      }

      await writeToOutbox(tx, outboxEvents);
    });
  }
}
