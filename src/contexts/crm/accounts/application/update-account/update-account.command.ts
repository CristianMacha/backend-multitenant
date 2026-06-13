import { Command } from '@nestjs/cqrs';
import { AddressProps } from '@shared/domain/value-objects/address.vo';

export interface UpdateAccountChanges {
  name?: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: AddressProps | null;
}

export class UpdateAccountCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: UpdateAccountChanges,
  ) {
    super();
  }
}
