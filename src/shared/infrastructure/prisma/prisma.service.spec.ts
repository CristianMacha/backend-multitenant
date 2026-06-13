import { PrismaClient } from '@prisma/client';
import { RequestContextStorage } from '@shared/context/request-context';
import { PrismaService } from './prisma.service';
import { TenantClientResolver } from './tenant-client.resolver';

describe('PrismaService', () => {
  let findMany: jest.Mock;
  let client: PrismaClient;
  let resolve: jest.Mock;
  let dispose: jest.Mock;
  let resolver: TenantClientResolver;
  let service: PrismaService;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    client = { user: { findMany } } as unknown as PrismaClient;
    resolve = jest.fn().mockReturnValue(client);
    dispose = jest.fn().mockResolvedValue(undefined);
    resolver = { resolve, dispose };
    service = new PrismaService(resolver);
  });

  it('forwards calls to the client resolved for the current tenant', async () => {
    await RequestContextStorage.run(
      { correlationId: 'c-1', tenantId: 'tenant-1' },
      () => service.user.findMany(),
    );

    expect(resolve).toHaveBeenCalledWith('tenant-1');
    expect(findMany).toHaveBeenCalled();
  });

  it('resolves with undefined tenant outside a request context', () => {
    void service.user;

    expect(resolve).toHaveBeenCalledWith(undefined);
  });

  it('disposes the resolver clients on shutdown', async () => {
    await service.onModuleDestroy();

    expect(dispose).toHaveBeenCalled();
  });
});
