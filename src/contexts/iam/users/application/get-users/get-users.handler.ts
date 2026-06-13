import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserReadModel, toUserReadModel } from '../user.read-model';
import { GetUsersQuery } from './get-users.query';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetUsersQuery,
  ): Promise<PaginatedResultDto<UserReadModel>> {
    const where: Prisma.UserWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { userRoles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return PaginatedResultDto.of(
      users.map(toUserReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
