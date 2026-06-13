import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { OpportunityId, TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  OPPORTUNITY_REPOSITORY,
  OpportunityRepository,
} from '../../domain/repositories/opportunity.repository';
import { ReassignOpportunityCommand } from './reassign-opportunity.command';

@CommandHandler(ReassignOpportunityCommand)
export class ReassignOpportunityHandler implements ICommandHandler<ReassignOpportunityCommand> {
  constructor(
    @Inject(OPPORTUNITY_REPOSITORY)
    private readonly opportunityRepository: OpportunityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReassignOpportunityCommand): Promise<void> {
    const opportunity = await this.opportunityRepository.findById(
      OpportunityId(command.id),
      TenantId(command.tenantId),
    );
    if (!opportunity) {
      throw new EntityNotFoundException('Opportunity', command.id);
    }

    opportunity.reassign(UserId(command.ownerId));
    const events = opportunity.pullDomainEvents();
    await this.opportunityRepository.save(opportunity, events);
    this.eventBus.publishAll(events);
  }
}
