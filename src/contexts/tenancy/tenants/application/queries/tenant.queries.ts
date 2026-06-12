import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';

export interface TenantReadModel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetTenantByIdQuery extends Query<TenantReadModel> {
  constructor(readonly id: string) {
    super();
  }
}

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
