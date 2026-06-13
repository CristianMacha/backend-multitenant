import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Tenant } from '../../domain/entities/tenant.entity';
import {
  FindTenantsOptions,
  TenantRepository,
} from '../../domain/repositories/tenant.repository';

// Per-tenant system roles. SUPER_ADMIN is intentionally absent: platform
// super admins are global operators flagged on the user account
// (User.isPlatformAdmin), never a per-tenant role.
const SYSTEM_ROLES = ['ADMIN', 'MANAGER', 'USER'] as const;

const MANAGER_PERMISSIONS = [
  'users.read',
  'users.update',
  'roles.read',
  'permissions.read',
  'audit-logs.read',
];

@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findMany(
    options: FindTenantsOptions,
  ): Promise<{ items: Tenant[]; total: number }> {
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { slug: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(tenant: Tenant, outboxEvents: DomainEvent[] = []): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.tenant.findUnique({
        where: { id: tenant.id },
      });

      if (!existing) {
        await tx.tenant.create({
          data: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            isActive: tenant.isActive,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
          },
        });
        await this.seedSystemRoles(tx, tenant.id);
      } else {
        await tx.tenant.update({
          where: { id: tenant.id },
          data: {
            name: tenant.name,
            isActive: tenant.isActive,
            deletedAt: tenant.deletedAt,
            updatedAt: tenant.updatedAt,
          },
        });
      }

      await writeToOutbox(tx, outboxEvents);
    });
  }

  private async seedSystemRoles(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<void> {
    await tx.role.createMany({
      data: SYSTEM_ROLES.map((name) => ({ tenantId, name, isSystem: true })),
    });

    const [allPermissions, allRoles] = await Promise.all([
      tx.permission.findMany({ where: { deletedAt: null } }),
      tx.role.findMany({ where: { tenantId } }),
    ]);

    const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));
    const rolePermissions: { roleId: string; permissionId: string }[] = [];

    for (const perm of allPermissions) {
      if (!perm.code.startsWith('tenants.')) {
        const adminId = roleMap.get('ADMIN');
        if (adminId) {
          rolePermissions.push({ roleId: adminId, permissionId: perm.id });
        }
      }
      if (MANAGER_PERMISSIONS.includes(perm.code)) {
        const managerId = roleMap.get('MANAGER');
        if (managerId) {
          rolePermissions.push({ roleId: managerId, permissionId: perm.id });
        }
      }
      if (perm.code === 'users.read') {
        const userId = roleMap.get('USER');
        if (userId) {
          rolePermissions.push({ roleId: userId, permissionId: perm.id });
        }
      }
    }

    await tx.rolePermission.createMany({ data: rolePermissions });
  }

  private toDomain(row: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Tenant {
    return Tenant.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }
}
