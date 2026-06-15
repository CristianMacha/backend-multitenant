import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CacheService } from '@platform/cache/application/cache.service';
import { userContextCacheKey } from '@contexts/iam/auth/application/user-context.service';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  RoleDeletedEvent,
  RoleUpdatedEvent,
} from '../../domain/events/role.events';

type RoleMutationEvent = RoleUpdatedEvent | RoleDeletedEvent;

@EventsHandler(RoleUpdatedEvent, RoleDeletedEvent)
export class InvalidateRoleCacheHandler implements IEventHandler<RoleMutationEvent> {
  private readonly logger = new Logger(InvalidateRoleCacheHandler.name);

  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: RoleMutationEvent): Promise<void> {
    const assignments = await this.prisma.userRole.findMany({
      where: { roleId: event.aggregateId },
      include: { user: { select: { firebaseUid: true } } },
    });

    await Promise.all(
      assignments.map(({ user }) =>
        this.cache.del(userContextCacheKey(user.firebaseUid)),
      ),
    );

    this.logger.debug(
      `Cache invalidated for ${assignments.length} users after ${event.eventName} on role ${event.aggregateId}`,
    );
  }
}
