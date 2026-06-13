import { AsyncLocalStorage } from 'async_hooks';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  TENANT_CLIENT_RESOLVER,
  TenantClientResolver,
} from './tenant-client.resolver';
import { RequestContextStorage } from '@shared/context/request-context';

type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const txStorage = new AsyncLocalStorage<PrismaTx>();

/**
 * Returns the active Prisma transaction client if a UnitOfWork is running,
 * or undefined otherwise. Used by the PrismaService Proxy to transparently
 * route all PrismaService calls through the current transaction.
 */
export const getCurrentTx = (): PrismaTx | undefined => txStorage.getStore();

/**
 * Wraps a unit of work in a single Prisma transaction. Any PrismaService
 * call made inside `run()` automatically participates in the transaction —
 * repositories and handlers need no changes.
 *
 * Example:
 *   await this.uow.run(async () => {
 *     await this.userRepository.save(user);
 *     await this.roleRepository.save(role);
 *   });
 */
@Injectable()
export class UnitOfWork {
  constructor(
    @Inject(TENANT_CLIENT_RESOLVER)
    private readonly resolver: TenantClientResolver,
  ) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    const client = this.resolver.resolve(RequestContextStorage.getTenantId());
    return client.$transaction((tx) => txStorage.run(tx, work));
  }
}
