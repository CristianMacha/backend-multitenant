import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PipelineId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '../../domain/repositories/pipeline.repository';
import { AddStageCommand } from './add-stage.command';

@CommandHandler(AddStageCommand)
export class AddStageHandler implements ICommandHandler<AddStageCommand> {
  constructor(
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddStageCommand): Promise<{ id: string }> {
    const pipeline = await this.pipelineRepository.findById(
      PipelineId(command.pipelineId),
      TenantId(command.tenantId),
    );
    if (!pipeline) {
      throw new EntityNotFoundException('Pipeline', command.pipelineId);
    }

    const stage = pipeline.addStage({
      name: command.name,
      probability: command.probability,
      type: command.type,
      order: 0,
    });
    const events = pipeline.pullDomainEvents();
    await this.pipelineRepository.save(pipeline, events);
    this.eventBus.publishAll(events);

    return { id: stage.id };
  }
}
