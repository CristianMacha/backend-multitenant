import { Module } from '@nestjs/common';
import { SALES_LOOKUP } from './sales-lookup.port';
import { SalesLookupService } from './sales-lookup.service';

@Module({
  providers: [{ provide: SALES_LOOKUP, useClass: SalesLookupService }],
  exports: [SALES_LOOKUP],
})
export class SalesLookupModule {}
