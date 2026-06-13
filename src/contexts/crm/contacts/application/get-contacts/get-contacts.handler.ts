import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ContactReadModel, toContactReadModel } from '../contact.read-model';
import { GetContactsQuery } from './get-contacts.query';

@QueryHandler(GetContactsQuery)
export class GetContactsHandler implements IQueryHandler<GetContactsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetContactsQuery,
  ): Promise<PaginatedResultDto<ContactReadModel>> {
    const where: Prisma.ContactWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.accountId ? { accountId: query.accountId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [contacts, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return PaginatedResultDto.of(
      contacts.map(toContactReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
