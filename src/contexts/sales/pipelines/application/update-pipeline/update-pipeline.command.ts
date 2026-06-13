import { Command } from '@nestjs/cqrs';

export class UpdatePipelineCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: { name?: string; isDefault?: boolean },
  ) {
    super();
  }
}
