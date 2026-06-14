import { Module } from '@nestjs/common';
import { PipelinesModule } from './pipelines/pipelines.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { SalesLookupModule } from './lookup/sales-lookup.module';

/**
 * Sales bounded context — selling process.
 *
 * Owns the configurable sales pipeline and the deals moving through it, plus
 * the read-side dashboard aggregations. Modules are added per phase of the CRM
 * plan (see docs/crm-implementation-plan.md):
 *   - pipelines     (Phase 2, per-tenant configurable stages)
 *   - opportunities (Phase 2)
 *   - dashboard     (Phase 4, query-only aggregation)
 *
 * Integrates with the `crm` context only via the published CRM_LOOKUP port and
 * crm domain events on the EventBus — never by importing crm internals.
 */
@Module({
  imports: [PipelinesModule, OpportunitiesModule, SalesLookupModule],
  exports: [PipelinesModule, OpportunitiesModule, SalesLookupModule],
})
export class SalesContextModule {}
