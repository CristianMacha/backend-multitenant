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
import { ApiStandardResponse } from '@shared/presentation/swagger/api-standard-response.decorator';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { Perm } from '@shared/authorization/permissions';
import { CreatePipelineCommand } from '../../application/create-pipeline/create-pipeline.command';
import { UpdatePipelineCommand } from '../../application/update-pipeline/update-pipeline.command';
import { AddStageCommand } from '../../application/add-stage/add-stage.command';
import { ReorderStagesCommand } from '../../application/reorder-stages/reorder-stages.command';
import { DeletePipelineCommand } from '../../application/delete-pipeline/delete-pipeline.command';
import { GetPipelinesQuery } from '../../application/get-pipelines/get-pipelines.query';
import { GetPipelineByIdQuery } from '../../application/get-pipeline-by-id/get-pipeline-by-id.query';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { UpdatePipelineDto } from '../dto/update-pipeline.dto';
import { AddStageDto } from '../dto/add-stage.dto';
import { ReorderStagesDto } from '../dto/reorder-stages.dto';
import { PipelineResponseDto } from '../dto/pipeline-response.dto';

@ApiTags('Pipelines')
@ApiBearerAuth()
@Controller({ path: 'pipelines', version: '1' })
export class PipelinesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.pipelines.create)
  @ApiOperation({ summary: 'Create a sales pipeline with its stages' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreatePipelineDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreatePipelineCommand(
        tenantId,
        dto.name,
        dto.isDefault ?? false,
        dto.stages,
      ),
    );
  }

  @Get()
  @Permissions(Perm.pipelines.read)
  @ApiOperation({ summary: 'List pipelines with their stages' })
  @ApiStandardResponse({ type: PipelineResponseDto, isArray: true })
  async findAll(@EffectiveTenantId() tenantId: string) {
    return this.queryBus.execute(new GetPipelinesQuery(tenantId));
  }

  @Get(':id')
  @Permissions(Perm.pipelines.read)
  @ApiOperation({ summary: 'Get a pipeline by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: PipelineResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(new GetPipelineByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.pipelines.update)
  @ApiOperation({ summary: 'Update a pipeline (name / default flag)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePipelineDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdatePipelineCommand(id, tenantId, dto));
  }

  @Post(':id/stages')
  @Permissions(Perm.pipelines.update)
  @ApiOperation({ summary: 'Add a stage to a pipeline' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async addStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddStageDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new AddStageCommand(id, tenantId, dto.name, dto.probability, dto.type),
    );
  }

  @Patch(':id/stages/order')
  @Permissions(Perm.pipelines.update)
  @ApiOperation({ summary: 'Reorder the stages of a pipeline' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderStages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderStagesDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ReorderStagesCommand(id, tenantId, dto.stageIds),
    );
  }

  @Delete(':id')
  @Permissions(Perm.pipelines.delete)
  @ApiOperation({ summary: 'Soft-delete a pipeline' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeletePipelineCommand(id, tenantId));
  }
}
