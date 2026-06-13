import { Command } from '@nestjs/cqrs';

export class ReassignOpportunityCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly ownerId: string,
  ) {
    super();
  }
}
