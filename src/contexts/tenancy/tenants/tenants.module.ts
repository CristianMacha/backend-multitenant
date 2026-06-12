import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { TenantsController } from './presentation/controllers/tenants.controller';
import {
  CreateTenantHandler,
  DeleteTenantHandler,
  GetTenantByIdHandler,
  GetTenantsHandler,
  UpdateTenantHandler,
} from './application/handlers/tenant.handlers';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [TenantsController],
  providers: [
    CreateTenantHandler,
    UpdateTenantHandler,
    DeleteTenantHandler,
    GetTenantByIdHandler,
    GetTenantsHandler,
  ],
})
export class TenantsModule {}
