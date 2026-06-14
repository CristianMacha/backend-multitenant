import { Injectable } from '@nestjs/common';
import { ProductId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

/** Lightweight read model for cross-context consumption (e.g. sales context). */
export interface ProductSummary {
  id: string;
  name: string;
  type: string;
  unitPrice: { amount: number; currency: string };
  status: string;
}

/**
 * Cross-context query service. Exported from CatalogContextModule so that
 * other bounded contexts can look up products by id without importing catalog
 * internals.
 */
@Injectable()
export class ProductQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a lightweight summary of a product, or `null` if the product
   * does not exist, is soft-deleted, or belongs to a different tenant.
   * Never throws — callers must handle the `null` case.
   */
  async findById(
    tenantId: TenantId,
    productId: ProductId,
  ): Promise<ProductSummary | null> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        unitPrice: true,
        currency: true,
        status: true,
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      type: product.type,
      unitPrice: {
        amount: Number(product.unitPrice),
        currency: product.currency,
      },
      status: product.status,
    };
  }
}
