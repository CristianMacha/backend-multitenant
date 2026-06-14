import { EventBus } from '@nestjs/cqrs';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { CreateProductCommand } from './create-product.command';
import { CreateProductHandler } from './create-product.handler';

const makeMocks = () => {
  const save = jest
    .fn<Promise<void>, Parameters<ProductRepository['save']>>()
    .mockResolvedValue(undefined);
  const repo: ProductRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save,
  };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;
  return { repo, save, publishAll, eventBus };
};

const validCommand = new CreateProductCommand(
  'tenant-1',
  'Widget Pro',
  'PRODUCT',
  99.99,
  'USD',
  'unit',
);

describe('CreateProductHandler', () => {
  it('creates a product, saves it and publishes events (R1, R2, R6)', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreateProductHandler(repo, eventBus);

    const result = await handler.execute(validCommand);

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    const [savedProduct, savedEvents] = save.mock.calls[0];
    expect(savedProduct.tenantId).toBe('tenant-1');
    expect(savedEvents).toHaveLength(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    expect(publishAll.mock.calls[0][0]).toHaveLength(1);
  });

  it('propagates DomainException for empty name (R3)', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreateProductHandler(repo, eventBus);

    await expect(
      handler.execute(
        new CreateProductCommand(
          'tenant-1',
          '   ',
          'PRODUCT',
          10,
          'USD',
          'unit',
        ),
      ),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('propagates DomainException for negative price (R5)', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreateProductHandler(repo, eventBus);

    await expect(
      handler.execute(
        new CreateProductCommand(
          'tenant-1',
          'Widget',
          'PRODUCT',
          -5,
          'USD',
          'unit',
        ),
      ),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('propagates DomainException for invalid currency (R5)', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreateProductHandler(repo, eventBus);

    await expect(
      handler.execute(
        new CreateProductCommand(
          'tenant-1',
          'Widget',
          'PRODUCT',
          10,
          'XX',
          'unit',
        ),
      ),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('creates a SERVICE type product', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreateProductHandler(repo, eventBus);

    const result = await handler.execute(
      new CreateProductCommand(
        'tenant-1',
        'Consulting',
        'SERVICE',
        150,
        'EUR',
        'hour',
      ),
    );

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    const [savedProduct] = save.mock.calls[0];
    expect(savedProduct.type).toBe('SERVICE');
    expect(publishAll).toHaveBeenCalledTimes(1);
  });
});
