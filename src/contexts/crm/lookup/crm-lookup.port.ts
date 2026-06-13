import { AccountId, ContactId, TenantId } from '@shared/domain/types';

export const CRM_LOOKUP = Symbol('CRM_LOOKUP');

/**
 * Public, cross-context read surface of the `crm` context. Other contexts
 * (e.g. `sales`) consume this port — exported by CrmContextModule — to check
 * that an account/contact exists in a tenant, WITHOUT importing crm
 * repositories, entities or Prisma models. This is the only sanctioned
 * synchronous integration point into crm; everything else is event-driven.
 */
export interface CrmLookup {
  accountExists(id: AccountId, tenantId: TenantId): Promise<boolean>;
  contactExists(id: ContactId, tenantId: TenantId): Promise<boolean>;
}
