import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { IdResponseDto } from '@shared/presentation/dto/standard-response.dto';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from '@shared/presentation/swagger/api-standard-response.decorator';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { UserContext } from '@shared/context/request-context';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { Perm } from '@shared/authorization/permissions';
import { CreateActivityCommand } from '../../application/create-activity/create-activity.command';
import { CompleteActivityCommand } from '../../application/complete-activity/complete-activity.command';
import { RescheduleActivityCommand } from '../../application/reschedule-activity/reschedule-activity.command';
import { DeleteActivityCommand } from '../../application/delete-activity/delete-activity.command';
import { GetActivitiesQuery } from '../../application/get-activities/get-activities.query';
import { GetRecordTimelineQuery } from '../../application/get-record-timeline/get-record-timeline.query';
import {
  CreateActivityDto,
  RelatedToTypeDto,
} from '../dto/create-activity.dto';
import { RescheduleActivityDto } from '../dto/reschedule-activity.dto';
import { ActivitiesQueryDto } from '../dto/activities-query.dto';
import { ActivityResponseDto } from '../dto/activity-response.dto';
import { ActivityReadModel } from '../../application/activity.read-model';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller({ path: 'activities', version: '1' })
export class ActivitiesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.activities.create)
  @ApiOperation({
    summary: 'Log an activity (call, meeting, email, task, note)',
  })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateActivityDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateActivityCommand(
        tenantId,
        dto.ownerId ?? currentUserId,
        dto.type,
        dto.subject,
        dto.relatedToType,
        dto.relatedToId,
        dto.body,
        dto.dueAt,
      ),
    );
  }

  @Get()
  @Permissions(Perm.activities.read)
  @ApiOperation({ summary: 'List activities (paginated, filterable)' })
  @ApiPaginatedResponse(ActivityResponseDto)
  async findAll(
    @Query() query: ActivitiesQueryDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser() user: UserContext,
  ): Promise<PaginatedResultDto<ActivityReadModel>> {
    const isManagerOrAdmin =
      user.isPlatformAdmin ||
      user.roles.includes('ADMIN') ||
      user.roles.includes('MANAGER');
    const ownerId = isManagerOrAdmin ? query.ownerId : user.userId;

    return this.queryBus.execute(
      new GetActivitiesQuery(
        tenantId,
        query.page,
        query.limit,
        query.relatedToType,
        query.relatedToId,
        ownerId,
        query.status,
        query.dueDateFrom,
        query.dueDateTo,
      ),
    );
  }

  @Get('timeline/:relatedToType/:relatedToId')
  @Permissions(Perm.activities.read)
  @ApiOperation({ summary: 'Chronological activity timeline for a record' })
  @ApiParam({ name: 'relatedToType', enum: RelatedToTypeDto })
  @ApiParam({ name: 'relatedToId', format: 'uuid' })
  @ApiStandardResponse({ type: ActivityResponseDto, isArray: true })
  async timeline(
    @Param('relatedToType', new ParseEnumPipe(RelatedToTypeDto))
    relatedToType: RelatedToTypeDto,
    @Param('relatedToId', ParseUUIDPipe) relatedToId: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<ActivityReadModel[]> {
    return this.queryBus.execute(
      new GetRecordTimelineQuery(tenantId, relatedToType, relatedToId),
    );
  }

  @Patch(':id/complete')
  @Permissions(Perm.activities.update)
  @ApiOperation({ summary: 'Mark an activity as completed' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new CompleteActivityCommand(id, tenantId));
  }

  @Patch(':id/reschedule')
  @Permissions(Perm.activities.update)
  @ApiOperation({ summary: 'Reschedule an activity due date' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleActivityDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RescheduleActivityCommand(id, tenantId, dto.dueAt),
    );
  }

  @Delete(':id')
  @Permissions(Perm.activities.delete)
  @ApiOperation({ summary: 'Soft-delete an activity' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteActivityCommand(id, tenantId));
  }
}
