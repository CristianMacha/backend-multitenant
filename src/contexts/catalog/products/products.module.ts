import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { ProductsController } from './presentation/controllers/products.controller';
import { CreateProductHandler } from './application/create-product/create-product.handler';
import { UpdateProductHandler } from './application/update-product/update-product.handler';
import { ArchiveProductHandler } from './application/archive-product/archive-product.handler';
import { GetProductsHandler } from './application/get-products/get-products.handler';
import { GetProductByIdHandler } from './application/get-product-by-id/get-product-by-id.handler';
import { ProductQueryService } from './application/product-query.service';

const commandHandlers = [
  CreateProductHandler,
  UpdateProductHandler,
  ArchiveProductHandler,
];

const queryHandlers = [GetProductsHandler, GetProductByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    ...commandHandlers,
    ...queryHandlers,
    ProductQueryService,
  ],
  exports: [PRODUCT_REPOSITORY, ProductQueryService],
})
export class ProductsModule {}
