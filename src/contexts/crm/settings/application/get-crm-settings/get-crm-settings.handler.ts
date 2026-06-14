import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  CrmSettingsReadModel,
  DEFAULT_CRM_SETTINGS,
} from '../crm-settings.read-model';
import { GetCrmSettingsQuery } from './get-crm-settings.query';

@QueryHandler(GetCrmSettingsQuery)
export class GetCrmSettingsHandler implements IQueryHandler<GetCrmSettingsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCrmSettingsQuery): Promise<CrmSettingsReadModel> {
    const row = await this.prisma.crmSettings.findUnique({
      where: { tenantId: query.tenantId },
    });

    if (!row) return { ...DEFAULT_CRM_SETTINGS };

    return {
      defaultCurrency: row.defaultCurrency,
      timezone: row.timezone,
    };
  }
}
