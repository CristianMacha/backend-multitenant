import { Command } from '@nestjs/cqrs';

export class MoveOpportunityStageCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly stageId: string,
  ) {
    super();
  }
}
