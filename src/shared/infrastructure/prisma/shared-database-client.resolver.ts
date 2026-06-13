import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantClientResolver } from './tenant-client.resolver';

/**
 * Current tenancy strategy: every tenant lives in the same database and
 * isolation is enforced by `tenant_id` filters, so all tenants resolve
 * to one shared PrismaClient.
 */
@Injectable()
export class SharedDatabaseClientResolver
  implements TenantClientResolver, OnModuleInit
{
  private readonly client = new PrismaClient();

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  resolve(): PrismaClient {
    return this.client;
  }

  async dispose(): Promise<void> {
    await this.client.$disconnect();
  }
}
