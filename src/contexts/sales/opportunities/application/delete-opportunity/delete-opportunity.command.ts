import { Command } from '@nestjs/cqrs';

export class DeleteOpportunityCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
