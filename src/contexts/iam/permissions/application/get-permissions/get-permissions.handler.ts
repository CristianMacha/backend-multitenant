import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CacheService } from '@platform/cache/application/cache.service';
import {
  GetPermissionsQuery,
  PermissionReadModel,
} from './get-permissions.query';

const PERMISSIONS_CACHE_TTL_SECONDS = 3600;

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async execute(query: GetPermissionsQuery): Promise<PermissionReadModel[]> {
    const cacheKey = `permissions:catalog:${query.module ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const permissions = await this.prisma.permission.findMany({
          where: {
            deletedAt: null,
            ...(query.module ? { module: query.module } : {}),
          },
          orderBy: [{ module: 'asc' }, { code: 'asc' }],
        });
        return permissions.map((permission) => ({
          id: permission.id,
          code: permission.code,
          description: permission.description,
          module: permission.module,
        }));
      },
      PERMISSIONS_CACHE_TTL_SECONDS,
    );
  }
}
