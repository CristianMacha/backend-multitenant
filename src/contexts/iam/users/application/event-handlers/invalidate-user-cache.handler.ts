import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CacheService } from '@platform/cache/application/cache.service';
import { userContextCacheKey } from '@contexts/iam/auth/application/user-context.service';
import {
  RoleAssignedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from '../../domain/events/user.events';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';

type UserMutationEvent =
  | UserUpdatedEvent
  | UserDeletedEvent
  | RoleAssignedEvent;

/**
 * Keeps the cached auth context consistent: whenever a user or its
 * roles change, the Redis-cached UserContext is dropped so the next
 * request rebuilds it from PostgreSQL.
 */
@EventsHandler(UserUpdatedEvent, UserDeletedEvent, RoleAssignedEvent)
export class InvalidateUserCacheHandler implements IEventHandler<UserMutationEvent> {
  private readonly logger = new Logger(InvalidateUserCacheHandler.name);

  constructor(
    private readonly cache: CacheService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async handle(event: UserMutationEvent): Promise<void> {
    const user = await this.userRepository.findById(
      event.aggregateId,
      event.tenantId!,
    );
    const firebaseUid = user?.firebaseUid;
    if (firebaseUid) {
      await this.cache.del(userContextCacheKey(firebaseUid));
    }
    this.logger.debug(
      `Cache invalidated for user ${event.aggregateId} after ${event.eventName}`,
    );
  }
}
