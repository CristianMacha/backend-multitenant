import { Command } from '@nestjs/cqrs';

export class UpdateRoleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: { name?: string; description?: string | null },
  ) {
    super();
  }
}
