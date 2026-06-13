import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { RoleReadModel, toRoleReadModel } from '../role.read-model';
import { GetRolesQuery } from './get-roles.query';

@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetRolesQuery,
  ): Promise<PaginatedResultDto<RoleReadModel>> {
    const where: Prisma.RoleWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: { rolePermissions: { include: { permission: true } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.role.count({ where }),
    ]);

    return PaginatedResultDto.of(
      roles.map(toRoleReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
