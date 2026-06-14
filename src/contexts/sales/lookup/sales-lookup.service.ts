import { Injectable } from '@nestjs/common';
import { OpportunityId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { SalesLookup } from './sales-lookup.port';

@Injectable()
export class SalesLookupService implements SalesLookup {
  constructor(private readonly prisma: PrismaService) {}

  async opportunityExists(
    id: OpportunityId,
    tenantId: TenantId,
  ): Promise<boolean> {
    const count = await this.prisma.opportunity.count({
      where: { id, tenantId, deletedAt: null },
    });
    return count > 0;
  }
}
