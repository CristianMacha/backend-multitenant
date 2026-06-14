import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ProductId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { UpdateProductCommand } from './update-product.command';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateProductCommand): Promise<void> {
    const product = await this.productRepository.findById(
      ProductId(command.id),
      TenantId(command.tenantId),
    );
    if (!product) throw new EntityNotFoundException('Product', command.id);

    product.update(command.changes);

    const events = product.pullDomainEvents();
    await this.productRepository.save(product, events);
    this.eventBus.publishAll(events);
  }
}
