import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ProductReadModel, toProductReadModel } from '../product.read-model';
import { GetProductByIdQuery } from './get-product-by-id.query';

@QueryHandler(GetProductByIdQuery)
export class GetProductByIdHandler implements IQueryHandler<GetProductByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetProductByIdQuery): Promise<ProductReadModel> {
    const product = await this.prisma.product.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
    });

    if (!product) throw new EntityNotFoundException('Product', query.id);

    return toProductReadModel(product);
  }
}
