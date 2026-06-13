import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SharedDatabaseClientResolver } from './shared-database-client.resolver';
import { TENANT_CLIENT_RESOLVER } from './tenant-client.resolver';
import { UnitOfWork } from './unit-of-work';

@Global()
@Module({
  providers: [
    // Tenancy strategy: swap this binding (schema-per-tenant,
    // database-per-tenant) without touching any PrismaService consumer.
    { provide: TENANT_CLIENT_RESOLVER, useClass: SharedDatabaseClientResolver },
    PrismaService,
    UnitOfWork,
  ],
  exports: [PrismaService, UnitOfWork],
})
export class PrismaModule {}
