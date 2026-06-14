import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';

/**
 * Catalog bounded context — product and service catalog.
 *
 * Owns the multi-tenant product/service catalog. Exposes `ProductQueryService`
 * and the `ProductId` branded type so that other contexts (e.g. sales) can
 * reference products by id without importing catalog internals.
 */
@Module({
  imports: [ProductsModule],
  exports: [ProductsModule],
})
export class CatalogContextModule {}
