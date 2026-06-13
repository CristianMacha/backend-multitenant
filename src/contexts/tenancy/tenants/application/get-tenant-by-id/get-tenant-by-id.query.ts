import { Query } from '@nestjs/cqrs';
import { TenantReadModel } from '../tenant.read-model';

export class GetTenantByIdQuery extends Query<TenantReadModel> {
  constructor(readonly id: string) {
    super();
  }
}
