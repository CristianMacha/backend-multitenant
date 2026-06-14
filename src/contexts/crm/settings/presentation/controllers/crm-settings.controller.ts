import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perm } from '@shared/authorization/permissions';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { ApiStandardResponse } from '@shared/presentation/swagger/api-standard-response.decorator';
import { GetCrmSettingsQuery } from '../../application/get-crm-settings/get-crm-settings.query';
import { UpsertCrmSettingsCommand } from '../../application/upsert-crm-settings/upsert-crm-settings.command';
import { CrmSettingsReadModel } from '../../application/crm-settings.read-model';
import { UpsertCrmSettingsDto } from '../dto/upsert-crm-settings.dto';
import { CrmSettingsResponseDto } from '../dto/crm-settings-response.dto';

@ApiTags('CRM Settings')
@ApiBearerAuth()
@Controller({ path: 'crm-settings', version: '1' })
export class CrmSettingsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Permissions(Perm.crmSettings.read)
  @ApiOperation({ summary: 'Get CRM settings for the current tenant' })
  @ApiStandardResponse({ type: CrmSettingsResponseDto })
  async get(
    @EffectiveTenantId() tenantId: string,
  ): Promise<CrmSettingsReadModel> {
    return this.queryBus.execute(new GetCrmSettingsQuery(tenantId));
  }

  @Patch()
  @Permissions(Perm.crmSettings.update)
  @ApiOperation({ summary: 'Update CRM settings for the current tenant' })
  @ApiStandardResponse({ type: CrmSettingsResponseDto })
  @HttpCode(HttpStatus.OK)
  async upsert(
    @Body() dto: UpsertCrmSettingsDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<CrmSettingsReadModel> {
    await this.commandBus.execute(
      new UpsertCrmSettingsCommand(tenantId, dto.defaultCurrency, dto.timezone),
    );
    return this.queryBus.execute(new GetCrmSettingsQuery(tenantId));
  }
}
