import { Query } from '@nestjs/cqrs';
import { UserReadModel } from '../user.read-model';

export class GetUserByIdQuery extends Query<UserReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
