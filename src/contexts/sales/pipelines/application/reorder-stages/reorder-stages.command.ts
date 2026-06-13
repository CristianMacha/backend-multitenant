import { Command } from '@nestjs/cqrs';

export class ReorderStagesCommand extends Command<void> {
  constructor(
    readonly pipelineId: string,
    readonly tenantId: string,
    readonly stageIds: string[],
  ) {
    super();
  }
}
