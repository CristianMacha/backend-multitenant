import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { AccountId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Account } from '../../domain/entities/account.entity';
import {
  AccountRepository,
  FindAccountsOptions,
} from '../../domain/repositories/account.repository';
import { AccountMapper } from '../mappers/account.mapper';

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: AccountId, tenantId: TenantId): Promise<Account | null> {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return account ? AccountMapper.toDomain(account) : null;
  }

  async findMany(
    options: FindAccountsOptions,
  ): Promise<{ items: Account[]; total: number }> {
    const where: Prisma.AccountWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.search
        ? { name: { contains: options.search, mode: 'insensitive' } }
        : {}),
    };

    const [accounts, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      items: accounts.map((account) => AccountMapper.toDomain(account)),
      total,
    };
  }

  async save(
    account: Account,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = AccountMapper.toPersistence(account);

    await this.prisma.$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: account.id },
        create: data,
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }
}
