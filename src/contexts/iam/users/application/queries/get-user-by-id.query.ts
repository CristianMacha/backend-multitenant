import { Query } from '@nestjs/cqrs';
import { UserReadModel } from '../read-models/user.read-model';

export class GetUserByIdQuery extends Query<UserReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
