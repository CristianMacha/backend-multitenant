import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PipelineId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '../../domain/repositories/pipeline.repository';
import { DeletePipelineCommand } from './delete-pipeline.command';

@CommandHandler(DeletePipelineCommand)
export class DeletePipelineHandler implements ICommandHandler<DeletePipelineCommand> {
  constructor(
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeletePipelineCommand): Promise<void> {
    const pipeline = await this.pipelineRepository.findById(
      PipelineId(command.id),
      TenantId(command.tenantId),
    );
    if (!pipeline) throw new EntityNotFoundException('Pipeline', command.id);

    pipeline.delete();
    const events = pipeline.pullDomainEvents();
    await this.pipelineRepository.save(pipeline, events);
    this.eventBus.publishAll(events);
  }
}
