import { Query } from '@nestjs/cqrs';
import { UserContext } from '@shared/context/request-context';

export interface NavigationItemReadModel {
  id: string;
  children?: NavigationItemReadModel[];
}

export class GetNavigationQuery extends Query<NavigationItemReadModel[]> {
  constructor(readonly user: UserContext) {
    super();
  }
}
