import { Module } from '@nestjs/common';
import { CRM_LOOKUP } from './crm-lookup.port';
import { CrmLookupService } from './crm-lookup.service';

/**
 * Published integration surface of the crm context. Exposes the CRM_LOOKUP
 * port so other contexts can validate account/contact existence without
 * reaching into crm internals. Re-exported by CrmContextModule.
 */
@Module({
  providers: [{ provide: CRM_LOOKUP, useClass: CrmLookupService }],
  exports: [CRM_LOOKUP],
})
export class CrmLookupModule {}
