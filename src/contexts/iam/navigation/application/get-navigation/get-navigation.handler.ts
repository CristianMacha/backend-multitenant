import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MENU_DEFINITION, MenuNode } from '../menu-definition';
import {
  GetNavigationQuery,
  NavigationItemReadModel,
} from './get-navigation.query';

@QueryHandler(GetNavigationQuery)
export class GetNavigationHandler implements IQueryHandler<GetNavigationQuery> {
  execute(query: GetNavigationQuery): Promise<NavigationItemReadModel[]> {
    const { permissions, isPlatformAdmin } = query.user;
    const permSet = new Set(permissions);
    return Promise.resolve(
      this.filterItems(MENU_DEFINITION, permSet, isPlatformAdmin),
    );
  }

  private filterItems(
    items: MenuNode[],
    permSet: Set<string>,
    isPlatformAdmin: boolean,
  ): NavigationItemReadModel[] {
    return items.reduce<NavigationItemReadModel[]>((acc, item) => {
      if (item.platformAdminOnly && !isPlatformAdmin) return acc;
      if (item.permission && !permSet.has(item.permission)) return acc;

      if (item.children) {
        const visibleChildren = this.filterItems(
          item.children,
          permSet,
          isPlatformAdmin,
        );
        if (visibleChildren.length === 0) return acc;
        acc.push({ id: item.id, children: visibleChildren });
      } else {
        acc.push({ id: item.id });
      }

      return acc;
    }, []);
  }
}
