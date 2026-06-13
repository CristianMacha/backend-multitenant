import { Query } from '@nestjs/cqrs';
import { RoleReadModel } from '../role.read-model';

export class GetRoleByIdQuery extends Query<RoleReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
