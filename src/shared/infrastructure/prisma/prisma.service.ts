import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RequestContextStorage } from '@shared/context/request-context';
import { getCurrentTx } from './unit-of-work';
import {
  TENANT_CLIENT_RESOLVER,
  TenantClientResolver,
} from './tenant-client.resolver';

/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging,
   @typescript-eslint/no-empty-object-type --
   Intentional declaration merging: the interface gives the facade the full
   PrismaClient API at the type level, while the Proxy in the constructor
   provides it at runtime by delegating to the tenant-resolved client. */
export interface PrismaService extends PrismaClient {}

/**
 * Tenant-aware facade over PrismaClient. Every property access is
 * forwarded to the client that `TenantClientResolver` returns for the
 * tenant in the current request context, so the tenancy topology
 * (shared DB today, schema/database per tenant tomorrow) can change
 * without touching any of the call sites that inject this service.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  constructor(
    @Inject(TENANT_CLIENT_RESOLVER)
    private readonly resolver: TenantClientResolver,
  ) {
    return new Proxy(this, {
      get: (target, property, receiver): unknown => {
        if (Reflect.has(target, property)) {
          return Reflect.get(target, property, receiver);
        }
        // Inside a UnitOfWork.run() the transaction client takes priority.
        const source =
          getCurrentTx() ??
          resolver.resolve(RequestContextStorage.getTenantId());
        const value = Reflect.get(source, property) as unknown;
        return typeof value === 'function'
          ? (value as (...args: unknown[]) => unknown).bind(source)
          : value;
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.resolver.dispose();
  }
}
