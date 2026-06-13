import { Command } from '@nestjs/cqrs';

export class SetRolePermissionsCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly permissionIds: string[],
  ) {
    super();
  }
}
