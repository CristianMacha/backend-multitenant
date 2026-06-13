import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository';
import { PrismaTenantRepository } from './infrastructure/repositories/prisma-tenant.repository';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { CreateTenantHandler } from './application/create-tenant/create-tenant.handler';
import { UpdateTenantHandler } from './application/update-tenant/update-tenant.handler';
import { DeleteTenantHandler } from './application/delete-tenant/delete-tenant.handler';
import { GetTenantsHandler } from './application/get-tenants/get-tenants.handler';
import { GetTenantByIdHandler } from './application/get-tenant-by-id/get-tenant-by-id.handler';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [TenantsController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    CreateTenantHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,
    GetTenantsHandler,
    GetTenantByIdHandler,
  ],
})
export class TenantsModule {}
