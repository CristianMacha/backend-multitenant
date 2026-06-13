import { Module } from '@nestjs/common';

/**
 * CRM bounded context — relationship data.
 *
 * Owns the central customer database and the interaction history:
 * accounts (companies), contacts (people) and activities (calls, meetings,
 * emails, tasks, notes). Modules are added per phase of the CRM plan
 * (see docs/crm-implementation-plan.md):
 *   - accounts   (Phase 1)
 *   - contacts   (Phase 1)
 *   - activities (Phase 3)
 *
 * Integrates with the `sales` context only via domain events on the EventBus
 * or read models exported here — never by importing another context's internals.
 */
@Module({
  imports: [],
  exports: [],
})
export class CrmContextModule {}
