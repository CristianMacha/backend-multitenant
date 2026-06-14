import { OpportunityId, TenantId } from '@shared/domain/types';

export const SALES_LOOKUP = Symbol('SALES_LOOKUP');

/**
 * Public, cross-context read surface of the `sales` context. Other contexts
 * (e.g. `crm/activities`) consume this port to check that an opportunity exists
 * in a tenant WITHOUT importing sales repositories, entities or Prisma models.
 */
export interface SalesLookup {
  opportunityExists(id: OpportunityId, tenantId: TenantId): Promise<boolean>;
}
