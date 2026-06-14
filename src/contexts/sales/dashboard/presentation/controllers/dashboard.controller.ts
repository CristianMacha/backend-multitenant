import { Controller, Get, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perm } from '@shared/authorization/permissions';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { ApiStandardResponse } from '@shared/presentation/swagger/api-standard-response.decorator';
import { UserContext } from '@shared/context/request-context';
import { GetDashboardSummaryQuery } from '../../application/get-dashboard-summary/get-dashboard-summary.query';
import { DashboardSummaryReadModel } from '../../application/dashboard.read-model';
import { DashboardSummaryResponseDto } from '../dto/dashboard-summary-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('summary')
  @Permissions(Perm.dashboard.read)
  @ApiOperation({ summary: 'Retrieve dashboard summary metrics' })
  @ApiStandardResponse({
    type: DashboardSummaryResponseDto,
    status: HttpStatus.OK,
  })
  async getSummary(
    @EffectiveTenantId() tenantId: string,
    @CurrentUser() user: UserContext,
  ): Promise<DashboardSummaryReadModel> {
    const isManagerOrAdmin =
      user.isPlatformAdmin ||
      user.roles.includes('ADMIN') ||
      user.roles.includes('MANAGER');

    const scopedOwnerId = isManagerOrAdmin ? undefined : user.userId;

    return this.queryBus.execute(
      new GetDashboardSummaryQuery(tenantId, user.userId, scopedOwnerId),
    );
  }
}
