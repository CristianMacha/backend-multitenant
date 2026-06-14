import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { CrmSettings } from '../../domain/entities/crm-settings.entity';
import { CrmSettingsRepository } from '../../domain/repositories/crm-settings.repository';
import { CrmSettingsMapper } from '../mappers/crm-settings.mapper';

@Injectable()
export class PrismaCrmSettingsRepository implements CrmSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantId(tenantId: TenantId): Promise<CrmSettings | null> {
    const row = await this.prisma.crmSettings.findUnique({
      where: { tenantId },
    });
    return row ? CrmSettingsMapper.toDomain(row) : null;
  }

  async save(
    settings: CrmSettings,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = CrmSettingsMapper.toPersistence(settings);

    await this.prisma.$transaction(async (tx) => {
      await tx.crmSettings.upsert({
        where: { tenantId: settings.tenantId },
        create: {
          ...data,
          createdAt: settings.createdAt,
        },
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }
}
