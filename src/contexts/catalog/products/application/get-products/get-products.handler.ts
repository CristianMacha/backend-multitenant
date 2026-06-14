import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ProductReadModel, toProductReadModel } from '../product.read-model';
import { GetProductsQuery } from './get-products.query';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<GetProductsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetProductsQuery,
  ): Promise<PaginatedResultDto<ProductReadModel>> {
    const where: Prisma.ProductWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.type
        ? { type: query.type as Prisma.EnumProductTypeFilter }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.status
        ? { status: query.status as Prisma.EnumProductStatusFilter }
        : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return PaginatedResultDto.of(
      products.map(toProductReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
