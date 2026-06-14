import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { IdResponseDto } from '@shared/presentation/dto/standard-response.dto';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from '@shared/presentation/swagger/api-standard-response.decorator';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { Perm } from '@shared/authorization/permissions';
import { UserContext } from '@shared/context/request-context';
import { CreateOpportunityCommand } from '../../application/create-opportunity/create-opportunity.command';
import { UpdateOpportunityCommand } from '../../application/update-opportunity/update-opportunity.command';
import { MoveOpportunityStageCommand } from '../../application/move-opportunity-stage/move-opportunity-stage.command';
import { ReassignOpportunityCommand } from '../../application/reassign-opportunity/reassign-opportunity.command';
import { DeleteOpportunityCommand } from '../../application/delete-opportunity/delete-opportunity.command';
import { GetOpportunitiesQuery } from '../../application/get-opportunities/get-opportunities.query';
import { GetOpportunityByIdQuery } from '../../application/get-opportunity-by-id/get-opportunity-by-id.query';
import { GetPipelineBoardQuery } from '../../application/get-pipeline-board/get-pipeline-board.query';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { MoveStageDto } from '../dto/move-stage.dto';
import { ReassignOpportunityDto } from '../dto/reassign-opportunity.dto';
import { OpportunitiesQueryDto } from '../dto/opportunities-query.dto';
import {
  OpportunityResponseDto,
  PipelineBoardResponseDto,
} from '../dto/opportunity-response.dto';

@ApiTags('Opportunities')
@ApiBearerAuth()
@Controller({ path: 'opportunities', version: '1' })
export class OpportunitiesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.opportunities.create)
  @ApiOperation({ summary: 'Create an opportunity' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateOpportunityDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateOpportunityCommand(
        tenantId,
        dto.ownerId ?? currentUserId,
        dto.name,
        dto.accountId,
        dto.pipelineId,
        dto.amount,
        dto.currency,
        dto.stageId,
        dto.contactId,
        dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      ),
    );
  }

  @Get()
  @Permissions(Perm.opportunities.read)
  @ApiOperation({ summary: 'List opportunities (paginated, filterable)' })
  @ApiPaginatedResponse(OpportunityResponseDto)
  async findAll(
    @Query() query: OpportunitiesQueryDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser() user: UserContext,
  ) {
    const isManagerOrAdmin =
      user.isPlatformAdmin ||
      user.roles.includes('ADMIN') ||
      user.roles.includes('MANAGER');
    const ownerId = isManagerOrAdmin ? query.ownerId : user.userId;

    return this.queryBus.execute(
      new GetOpportunitiesQuery(
        tenantId,
        query.page,
        query.limit,
        query.search,
        query.pipelineId,
        query.stageId,
        ownerId,
        query.status,
      ),
    );
  }

  @Get('board/:pipelineId')
  @Permissions(Perm.opportunities.read)
  @ApiOperation({ summary: 'Pipeline board: opportunities grouped by stage' })
  @ApiParam({ name: 'pipelineId', format: 'uuid' })
  @ApiStandardResponse({ type: PipelineBoardResponseDto })
  async board(
    @Param('pipelineId', ParseUUIDPipe) pipelineId: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(
      new GetPipelineBoardQuery(pipelineId, tenantId),
    );
  }

  @Get(':id')
  @Permissions(Perm.opportunities.read)
  @ApiOperation({ summary: 'Get an opportunity by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: OpportunityResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(new GetOpportunityByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.opportunities.update)
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateOpportunityCommand(id, tenantId, {
        name: dto.name,
        contactId: dto.contactId,
        expectedCloseDate:
          dto.expectedCloseDate === undefined
            ? undefined
            : dto.expectedCloseDate === null
              ? null
              : new Date(dto.expectedCloseDate),
        amount: dto.amount,
        currency: dto.currency,
      }),
    );
  }

  @Patch(':id/stage')
  @Permissions(Perm.opportunities.update)
  @ApiOperation({ summary: 'Move an opportunity to another stage' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async moveStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveStageDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new MoveOpportunityStageCommand(id, tenantId, dto.stageId),
    );
  }

  @Patch(':id/owner')
  @Permissions(Perm.opportunities.reassign)
  @ApiOperation({ summary: 'Reassign an opportunity to a new owner' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReassignOpportunityDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ReassignOpportunityCommand(id, tenantId, dto.ownerId),
    );
  }

  @Delete(':id')
  @Permissions(Perm.opportunities.delete)
  @ApiOperation({ summary: 'Soft-delete an opportunity' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteOpportunityCommand(id, tenantId));
  }
}
