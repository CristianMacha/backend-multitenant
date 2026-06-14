import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AccountReadModel, toAccountReadModel } from '../account.read-model';
import { GetAccountsQuery } from './get-accounts.query';

@QueryHandler(GetAccountsQuery)
export class GetAccountsHandler implements IQueryHandler<GetAccountsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetAccountsQuery,
  ): Promise<PaginatedResultDto<AccountReadModel>> {
    const where: Prisma.AccountWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.scopedOwnerId ? { ownerId: query.scopedOwnerId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { industry: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [accounts, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.account.count({ where }),
    ]);

    return PaginatedResultDto.of(
      accounts.map(toAccountReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
