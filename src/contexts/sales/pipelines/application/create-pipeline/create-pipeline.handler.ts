import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { Pipeline } from '../../domain/entities/pipeline.entity';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '../../domain/repositories/pipeline.repository';
import { CreatePipelineCommand } from './create-pipeline.command';

@CommandHandler(CreatePipelineCommand)
export class CreatePipelineHandler implements ICommandHandler<CreatePipelineCommand> {
  constructor(
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreatePipelineCommand): Promise<{ id: string }> {
    const pipeline = Pipeline.create({
      tenantId: TenantId(command.tenantId),
      name: command.name,
      isDefault: command.isDefault,
      stages: command.stages.map((s, index) => ({
        name: s.name,
        probability: s.probability,
        type: s.type,
        order: index,
      })),
    });

    const events = pipeline.pullDomainEvents();
    await this.pipelineRepository.save(pipeline, events);
    this.eventBus.publishAll(events);

    return { id: pipeline.id };
  }
}
