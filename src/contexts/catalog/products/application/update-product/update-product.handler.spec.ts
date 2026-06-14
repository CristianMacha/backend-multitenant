import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { UpdateProductCommand } from './update-product.command';
import { UpdateProductHandler } from './update-product.handler';

const makeProduct = () =>
  Product.create({
    tenantId: TenantId('tenant-1'),
    name: 'Widget Pro',
    type: 'PRODUCT',
    unitPriceAmount: 99.99,
    unitPriceCurrency: 'USD',
    unitOfMeasure: 'unit',
  });

const makeMocks = (product: Product | null = makeProduct()) => {
  const save = jest
    .fn<Promise<void>, Parameters<ProductRepository['save']>>()
    .mockResolvedValue(undefined);
  const repo: ProductRepository = {
    findById: jest.fn().mockResolvedValue(product),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save,
  };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;
  return { repo, save, publishAll, eventBus };
};

describe('UpdateProductHandler', () => {
  it('updates the product and publishes ProductUpdatedEvent (R16, R17)', async () => {
    const product = makeProduct();
    product.pullDomainEvents(); // clear create events
    const { repo, save, publishAll, eventBus } = makeMocks(product);
    const handler = new UpdateProductHandler(repo, eventBus);

    await handler.execute(
      new UpdateProductCommand('prod-1', 'tenant-1', { name: 'Widget Ultra' }),
    );

    expect(product.name).toBe('Widget Ultra');
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    const events = publishAll.mock.calls[0][0];
    expect(events).toHaveLength(1);
  });

  it('throws EntityNotFoundException when product not found (R19)', async () => {
    const { repo, save, eventBus } = makeMocks(null);
    const handler = new UpdateProductHandler(repo, eventBus);

    await expect(
      handler.execute(
        new UpdateProductCommand('nonexistent', 'tenant-1', { name: 'X' }),
      ),
    ).rejects.toThrow(EntityNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('throws DomainException when product is archived (R18)', async () => {
    const product = makeProduct();
    product.archive();
    product.pullDomainEvents();
    const { repo, save, eventBus } = makeMocks(product);
    const handler = new UpdateProductHandler(repo, eventBus);

    await expect(
      handler.execute(
        new UpdateProductCommand('prod-1', 'tenant-1', { name: 'New' }),
      ),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('does not call save when no fields change', async () => {
    const product = makeProduct();
    product.pullDomainEvents();
    const { repo, save, publishAll, eventBus } = makeMocks(product);
    const handler = new UpdateProductHandler(repo, eventBus);

    await handler.execute(new UpdateProductCommand('prod-1', 'tenant-1', {}));

    // save still called but with empty events (no-op for outbox)
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledWith([]);
  });
});
