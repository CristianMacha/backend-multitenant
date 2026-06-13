import { Injectable } from '@nestjs/common';
import { AccountId, ContactId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CrmLookup } from './crm-lookup.port';

@Injectable()
export class CrmLookupService implements CrmLookup {
  constructor(private readonly prisma: PrismaService) {}

  async accountExists(id: AccountId, tenantId: TenantId): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: { id, tenantId, deletedAt: null },
    });
    return count > 0;
  }

  async contactExists(id: ContactId, tenantId: TenantId): Promise<boolean> {
    const count = await this.prisma.contact.count({
      where: { id, tenantId, deletedAt: null },
    });
    return count > 0;
  }
}
