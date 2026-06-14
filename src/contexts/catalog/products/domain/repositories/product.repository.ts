import { DomainEvent } from '@shared/domain/domain-event.base';
import { ProductId, TenantId } from '@shared/domain/types';
import { Product } from '../entities/product.entity';
import { ProductType, ProductStatus } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface FindProductsOptions {
  tenantId: TenantId;
  page: number;
  limit: number;
  type?: ProductType;
  category?: string;
  status?: ProductStatus;
}

export interface ProductRepository {
  findById(id: ProductId, tenantId: TenantId): Promise<Product | null>;
  findMany(
    options: FindProductsOptions,
  ): Promise<{ items: Product[]; total: number }>;
  save(product: Product, outboxEvents?: DomainEvent[]): Promise<void>;
}
