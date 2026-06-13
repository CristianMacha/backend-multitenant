import { Prisma, Account as PrismaAccount } from '@prisma/client';
import { TenantId, UserId } from '@shared/domain/types';
import { AddressProps } from '@shared/domain/value-objects/address.vo';
import { Account } from '../../domain/entities/account.entity';

export class AccountMapper {
  static toDomain(raw: PrismaAccount): Account {
    return Account.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      name: raw.name,
      industry: raw.industry ?? undefined,
      website: raw.website ?? undefined,
      phone: raw.phone,
      address: (raw.address as AddressProps | null) ?? undefined,
      ownerId: UserId(raw.ownerId),
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(account: Account): Prisma.AccountUncheckedCreateInput {
    return {
      id: account.id,
      tenantId: account.tenantId,
      name: account.name,
      industry: account.industry ?? null,
      website: account.website ?? null,
      phone: account.phone ?? null,
      address: (account.address as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      ownerId: account.ownerId,
      status: account.status,
      deletedAt: account.deletedAt,
    };
  }
}
