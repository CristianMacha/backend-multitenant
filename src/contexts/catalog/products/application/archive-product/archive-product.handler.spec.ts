import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { DomainException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { ArchiveProductCommand } from './archive-product.command';
import { ArchiveProductHandler } from './archive-product.handler';

const makeProduct = () => {
  const p = Product.create({
    tenantId: TenantId('tenant-1'),
    name: 'Widget Pro',
    type: 'PRODUCT',
    unitPriceAmount: 99.99,
    unitPriceCurrency: 'USD',
    unitOfMeasure: 'unit',
  });
  p.pullDomainEvents(); // clear create events
  return p;
};

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

describe('ArchiveProductHandler', () => {
  it('archives the product, soft-deletes it and publishes ProductArchivedEvent (R21, R22)', async () => {
    const product = makeProduct();
    const { repo, save, publishAll, eventBus } = makeMocks(product);
    const handler = new ArchiveProductHandler(repo, eventBus);

    await handler.execute(new ArchiveProductCommand('prod-1', 'tenant-1'));

    expect(product.isArchived).toBe(true);
    expect(product.isDeleted).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    const events = publishAll.mock.calls[0][0];
    expect(events).toHaveLength(1);
  });

  it('throws EntityNotFoundException when product not found (R24)', async () => {
    const { repo, save, eventBus } = makeMocks(null);
    const handler = new ArchiveProductHandler(repo, eventBus);

    await expect(
      handler.execute(new ArchiveProductCommand('nonexistent', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });

  it('throws DomainException when product is already archived (R23)', async () => {
    const product = makeProduct();
    product.archive();
    product.pullDomainEvents();
    const { repo, save, eventBus } = makeMocks(product);
    const handler = new ArchiveProductHandler(repo, eventBus);

    await expect(
      handler.execute(new ArchiveProductCommand('prod-1', 'tenant-1')),
    ).rejects.toThrow(DomainException);
    expect(save).not.toHaveBeenCalled();
  });
});
