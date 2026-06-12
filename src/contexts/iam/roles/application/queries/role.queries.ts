import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';

export interface RoleReadModel {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class GetRoleByIdQuery extends Query<RoleReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}

export class GetRolesQuery extends Query<PaginatedResultDto<RoleReadModel>> {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
  ) {
    super();
  }
}
