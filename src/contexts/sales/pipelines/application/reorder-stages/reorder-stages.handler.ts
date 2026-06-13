import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PipelineId, StageId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '../../domain/repositories/pipeline.repository';
import { ReorderStagesCommand } from './reorder-stages.command';

@CommandHandler(ReorderStagesCommand)
export class ReorderStagesHandler implements ICommandHandler<ReorderStagesCommand> {
  constructor(
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReorderStagesCommand): Promise<void> {
    const pipeline = await this.pipelineRepository.findById(
      PipelineId(command.pipelineId),
      TenantId(command.tenantId),
    );
    if (!pipeline) {
      throw new EntityNotFoundException('Pipeline', command.pipelineId);
    }

    pipeline.reorderStages(command.stageIds.map((id) => StageId(id)));
    const events = pipeline.pullDomainEvents();
    await this.pipelineRepository.save(pipeline, events);
    this.eventBus.publishAll(events);
  }
}
