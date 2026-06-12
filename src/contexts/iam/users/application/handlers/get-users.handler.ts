import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetUsersQuery } from '../queries/get-users.query';
import { UserReadModel } from '../read-models/user.read-model';

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

    const items: UserReadModel[] = users.map((user) => ({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.userRoles.map((userRole) => userRole.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return PaginatedResultDto.of(items, total, query.page, query.limit);
  }
}
