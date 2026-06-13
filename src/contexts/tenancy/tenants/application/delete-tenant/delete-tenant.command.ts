import { Command } from '@nestjs/cqrs';

export class DeleteTenantCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}
