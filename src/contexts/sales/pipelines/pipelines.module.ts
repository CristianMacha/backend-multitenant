import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PIPELINE_REPOSITORY } from './domain/repositories/pipeline.repository';
import { PrismaPipelineRepository } from './infrastructure/repositories/prisma-pipeline.repository';
import { PipelinesController } from './presentation/controllers/pipelines.controller';
import { CreatePipelineHandler } from './application/create-pipeline/create-pipeline.handler';
import { UpdatePipelineHandler } from './application/update-pipeline/update-pipeline.handler';
import { AddStageHandler } from './application/add-stage/add-stage.handler';
import { ReorderStagesHandler } from './application/reorder-stages/reorder-stages.handler';
import { DeletePipelineHandler } from './application/delete-pipeline/delete-pipeline.handler';
import { GetPipelinesHandler } from './application/get-pipelines/get-pipelines.handler';
import { GetPipelineByIdHandler } from './application/get-pipeline-by-id/get-pipeline-by-id.handler';

const commandHandlers = [
  CreatePipelineHandler,
  UpdatePipelineHandler,
  AddStageHandler,
  ReorderStagesHandler,
  DeletePipelineHandler,
];
const queryHandlers = [GetPipelinesHandler, GetPipelineByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PipelinesController],
  providers: [
    { provide: PIPELINE_REPOSITORY, useClass: PrismaPipelineRepository },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [PIPELINE_REPOSITORY],
})
export class PipelinesModule {}
