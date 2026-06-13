import { Command } from '@nestjs/cqrs';

export class ArchiveAccountCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
