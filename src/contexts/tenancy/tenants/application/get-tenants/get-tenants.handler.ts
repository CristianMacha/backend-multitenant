import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { TenantReadModel, toTenantReadModel } from '../tenant.read-model';
import { GetTenantsQuery } from './get-tenants.query';

@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetTenantsQuery,
  ): Promise<PaginatedResultDto<TenantReadModel>> {
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [tenants, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return PaginatedResultDto.of(
      tenants.map(toTenantReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
