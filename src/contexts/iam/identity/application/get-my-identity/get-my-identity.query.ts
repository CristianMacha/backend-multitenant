import { Query } from '@nestjs/cqrs';
import { UserContext } from '@shared/context/request-context';

export interface MyIdentityReadModel {
  userId: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
}

export class GetMyIdentityQuery extends Query<MyIdentityReadModel> {
  constructor(readonly user: UserContext) {
    super();
  }
}
