import { Module } from '@nestjs/common';

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
 * Integrates with the `crm` context only via domain events on the EventBus
 * or read models — never by importing another context's internals.
 */
@Module({
  imports: [],
  exports: [],
})
export class SalesContextModule {}
