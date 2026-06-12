import { Query } from '@nestjs/cqrs';

export interface PermissionReadModel {
  id: string;
  code: string;
  description: string | null;
  module: string;
}

export class GetPermissionsQuery extends Query<PermissionReadModel[]> {
  constructor(readonly module?: string) {
    super();
  }
}
