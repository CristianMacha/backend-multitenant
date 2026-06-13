import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { OpportunityId, StageId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '@contexts/sales/pipelines/domain/repositories/pipeline.repository';
import {
  OPPORTUNITY_REPOSITORY,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';
import { MoveOpportunityStageCommand } from './move-opportunity-stage.command';

@CommandHandler(MoveOpportunityStageCommand)
export class MoveOpportunityStageHandler implements ICommandHandler<MoveOpportunityStageCommand> {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepository: OpportunityRepository,
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MoveOpportunityStageCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);

    const opportunity = await this.opportunityRepository.findById(
      OpportunityId(command.id),
      tenantId,
    );
    if (!opportunity) {
      throw new EntityNotFoundException('Opportunity', command.id);
    }

    const pipeline = await this.pipelineRepository.findById(
      opportunity.pipelineId,
      tenantId,
    );
    if (!pipeline) {
      throw new EntityNotFoundException('Pipeline', opportunity.pipelineId);
    }

    const stage = pipeline.getStage(StageId(command.stageId));
    if (!stage) {
      throw new EntityNotFoundException('Stage', command.stageId);
    }

    opportunity.moveToStage(stage.id, stage.type);
    const events = opportunity.pullDomainEvents();
    await this.opportunityRepository.save(opportunity, events);
    this.eventBus.publishAll(events);
  }
}
