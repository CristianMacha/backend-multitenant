import { Command } from '@nestjs/cqrs';

export class UpdateTenantCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly changes: { name?: string; isActive?: boolean },
  ) {
    super();
  }
}
