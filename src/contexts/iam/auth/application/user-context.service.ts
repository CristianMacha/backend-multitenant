import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserContext } from '@shared/context/request-context';
import { CacheService } from '@platform/cache/application/cache.service';

const USER_CONTEXT_TTL_SECONDS = 120;

export const userContextCacheKey = (firebaseUid: string): string =>
  `auth:user-context:${firebaseUid}`;

/**
 * Builds the authenticated UserContext (user + roles + permissions)
 * from the verified Firebase UID. Cached briefly in Redis to avoid
 * hitting PostgreSQL on every request.
 */
@Injectable()
export class UserContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async buildContext(firebaseUid: string): Promise<UserContext> {
    return this.cache.getOrSet(
      userContextCacheKey(firebaseUid),
      () => this.loadFromDatabase(firebaseUid),
      USER_CONTEXT_TTL_SECONDS,
    );
  }

  async invalidate(firebaseUid: string): Promise<void> {
    await this.cache.del(userContextCacheKey(firebaseUid));
  }

  private async loadFromDatabase(firebaseUid: string): Promise<UserContext> {
    const user = await this.prisma.user.findFirst({
      where: { firebaseUid, deletedAt: null, isActive: true },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User is not registered or inactive');
    }

    const roles = user.userRoles
      .filter((userRole) => userRole.role.deletedAt === null)
      .map((userRole) => userRole.role);

    const permissions = new Set<string>();
    for (const role of roles) {
      for (const rolePermission of role.rolePermissions) {
        if (rolePermission.permission.deletedAt === null) {
          permissions.add(rolePermission.permission.code);
        }
      }
    }

    return {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      tenantId: user.tenantId,
      roles: roles.map((role) => role.name),
      permissions: [...permissions],
    };
  }
}
