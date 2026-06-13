import { Command } from '@nestjs/cqrs';

export class CreateOpportunityCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly ownerId: string,
    readonly name: string,
    readonly accountId: string,
    readonly pipelineId: string,
    readonly amount: number,
    readonly currency: string,
    readonly stageId?: string,
    readonly contactId?: string,
    readonly expectedCloseDate?: Date,
  ) {
    super();
  }
}
