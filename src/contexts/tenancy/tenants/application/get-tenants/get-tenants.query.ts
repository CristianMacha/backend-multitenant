import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { TenantReadModel } from '../tenant.read-model';

export class GetTenantsQuery extends Query<
  PaginatedResultDto<TenantReadModel>
> {
  constructor(
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
  ) {
    super();
  }
}
