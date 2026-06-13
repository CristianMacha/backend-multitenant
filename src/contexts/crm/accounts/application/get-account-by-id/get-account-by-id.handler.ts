import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AccountReadModel, toAccountReadModel } from '../account.read-model';
import { GetAccountByIdQuery } from './get-account-by-id.query';

@QueryHandler(GetAccountByIdQuery)
export class GetAccountByIdHandler implements IQueryHandler<GetAccountByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAccountByIdQuery): Promise<AccountReadModel> {
    const account = await this.prisma.account.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
    });

    if (!account) throw new EntityNotFoundException('Account', query.id);

    return toAccountReadModel(account);
  }
}
