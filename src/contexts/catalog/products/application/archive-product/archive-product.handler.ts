import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ProductId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { ArchiveProductCommand } from './archive-product.command';

@CommandHandler(ArchiveProductCommand)
export class ArchiveProductHandler implements ICommandHandler<ArchiveProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ArchiveProductCommand): Promise<void> {
    const product = await this.productRepository.findById(
      ProductId(command.id),
      TenantId(command.tenantId),
    );
    if (!product) throw new EntityNotFoundException('Product', command.id);

    product.archive();

    const events = product.pullDomainEvents();
    await this.productRepository.save(product, events);
    this.eventBus.publishAll(events);
  }
}
