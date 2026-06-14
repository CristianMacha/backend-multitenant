import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { Product } from '../../domain/entities/product.entity';
import { ProductType } from '../../domain/entities/product.entity';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { CreateProductCommand } from './create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProductCommand): Promise<{ id: string }> {
    const product = Product.create({
      tenantId: TenantId(command.tenantId),
      name: command.name,
      type: command.type as ProductType,
      unitPriceAmount: command.unitPriceAmount,
      unitPriceCurrency: command.unitPriceCurrency,
      unitOfMeasure: command.unitOfMeasure,
      description: command.description,
      category: command.category,
    });

    const events = product.pullDomainEvents();
    await this.productRepository.save(product, events);
    this.eventBus.publishAll(events);

    return { id: product.id };
  }
}
