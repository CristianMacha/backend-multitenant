import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { ProductId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Product } from '../../domain/entities/product.entity';
import {
  FindProductsOptions,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: ProductId, tenantId: TenantId): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return product ? ProductMapper.toDomain(product) : null;
  }

  async findMany(
    options: FindProductsOptions,
  ): Promise<{ items: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.type ? { type: options.type } : {}),
      ...(options.category ? { category: options.category } : {}),
      ...(options.status ? { status: options.status } : {}),
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => ProductMapper.toDomain(p)),
      total,
    };
  }

  async save(
    product: Product,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = ProductMapper.toPersistence(product);

    await this.prisma.$transaction(async (tx) => {
      await tx.product.upsert({
        where: { id: product.id },
        create: data,
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }
}
