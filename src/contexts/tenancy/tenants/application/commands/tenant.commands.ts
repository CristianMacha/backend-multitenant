import { Command } from '@nestjs/cqrs';

export class CreateTenantCommand extends Command<{ id: string }> {
  constructor(
    readonly name: string,
    readonly slug: string,
  ) {
    super();
  }
}

export class UpdateTenantCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly changes: { name?: string; isActive?: boolean },
  ) {
    super();
  }
}

export class DeleteTenantCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}
