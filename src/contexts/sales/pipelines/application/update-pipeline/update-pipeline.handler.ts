import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PipelineId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '../../domain/repositories/pipeline.repository';
import { UpdatePipelineCommand } from './update-pipeline.command';

@CommandHandler(UpdatePipelineCommand)
export class UpdatePipelineHandler implements ICommandHandler<UpdatePipelineCommand> {
  constructor(
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdatePipelineCommand): Promise<void> {
    const pipeline = await this.pipelineRepository.findById(
      PipelineId(command.id),
      TenantId(command.tenantId),
    );
    if (!pipeline) throw new EntityNotFoundException('Pipeline', command.id);

    pipeline.update(command.changes);
    const events = pipeline.pullDomainEvents();
    await this.pipelineRepository.save(pipeline, events);
    this.eventBus.publishAll(events);
  }
}
