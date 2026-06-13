import { Query } from '@nestjs/cqrs';
import { AccountReadModel } from '../account.read-model';

export class GetAccountByIdQuery extends Query<AccountReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
