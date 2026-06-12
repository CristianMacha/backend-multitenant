import { Module } from '@nestjs/common';
import { TenantsModule } from './tenants/tenants.module';

/**
 * Tenancy bounded context.
 * Owns the tenant lifecycle (organizations/companies) that every
 * other context isolates its data by.
 */
@Module({
  imports: [TenantsModule],
  exports: [TenantsModule],
})
export class TenancyContextModule {}
