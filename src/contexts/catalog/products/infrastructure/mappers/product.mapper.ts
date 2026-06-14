import { Prisma, Product as PrismaProduct } from '@prisma/client';
import { TenantId } from '@shared/domain/types';
import { Product } from '../../domain/entities/product.entity';

export class ProductMapper {
  static toDomain(raw: PrismaProduct): Product {
    return Product.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      name: raw.name,
      description: raw.description ?? undefined,
      type: raw.type,
      category: raw.category ?? undefined,
      unitPriceAmount: Number(raw.unitPrice),
      unitPriceCurrency: raw.currency,
      unitOfMeasure: raw.unitOfMeasure,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(product: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      description: product.description ?? null,
      type: product.type,
      category: product.category ?? null,
      unitPrice: product.unitPrice.amount,
      currency: product.unitPrice.currency,
      unitOfMeasure: product.unitOfMeasure,
      status: product.status,
      deletedAt: product.deletedAt,
    };
  }
}
