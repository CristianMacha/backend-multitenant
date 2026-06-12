import { Command } from '@nestjs/cqrs';

export class CreateRoleCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly name: string,
    readonly description?: string,
  ) {
    super();
  }
}

export class UpdateRoleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: { name?: string; description?: string | null },
  ) {
    super();
  }
}

export class DeleteRoleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}

export class SetRolePermissionsCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly permissionIds: string[],
  ) {
    super();
  }
}
