import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  AccountId,
  ContactId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import { CRM_LOOKUP, CrmLookup } from '@contexts/crm/lookup/crm-lookup.port';
import {
  PIPELINE_REPOSITORY,
  PipelineRepository,
} from '@contexts/sales/pipelines/domain/repositories/pipeline.repository';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import {
  OPPORTUNITY_REPOSITORY,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';
import { CreateOpportunityCommand } from './create-opportunity.command';

@CommandHandler(CreateOpportunityCommand)
export class CreateOpportunityHandler implements ICommandHandler<CreateOpportunityCommand> {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepository: OpportunityRepository,
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    @Inject(CRM_LOOKUP) private readonly crm: CrmLookup,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateOpportunityCommand): Promise<{ id: string }> {
    const tenantId = TenantId(command.tenantId);

    const pipeline = await this.pipelineRepository.findById(
      PipelineId(command.pipelineId),
      tenantId,
    );
    if (!pipeline) {
      throw new EntityNotFoundException('Pipeline', command.pipelineId);
    }

    const stage = command.stageId
      ? pipeline.getStage(StageId(command.stageId))
      : pipeline.stages[0];
    if (!stage) {
      throw new EntityNotFoundException(
        'Stage',
        command.stageId ?? '(default)',
      );
    }

    const accountId = AccountId(command.accountId);
    if (!(await this.crm.accountExists(accountId, tenantId))) {
      throw new EntityNotFoundException('Account', command.accountId);
    }

    let contactId: ContactId | undefined;
    if (command.contactId) {
      contactId = ContactId(command.contactId);
      if (!(await this.crm.contactExists(contactId, tenantId))) {
        throw new EntityNotFoundException('Contact', command.contactId);
      }
    }

    const opportunity = Opportunity.create({
      tenantId,
      ownerId: UserId(command.ownerId),
      name: command.name,
      accountId,
      contactId,
      pipelineId: PipelineId(command.pipelineId),
      stageId: stage.id,
      stageType: stage.type,
      amount: command.amount,
      currency: command.currency,
      expectedCloseDate: command.expectedCloseDate,
    });

    const events = opportunity.pullDomainEvents();
    await this.opportunityRepository.save(opportunity, events);
    this.eventBus.publishAll(events);

    return { id: opportunity.id };
  }
}
