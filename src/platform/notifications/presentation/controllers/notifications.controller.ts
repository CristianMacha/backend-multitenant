import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from '@shared/presentation/swagger/api-standard-response.decorator';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { Perm } from '@shared/authorization/permissions';
import { NotificationReadModel } from '../../application/notification.read-model';
import { GetNotificationsQuery } from '../../application/get-notifications/get-notifications.query';
import { GetUnreadCountQuery } from '../../application/get-unread-count/get-unread-count.query';
import { MarkNotificationReadCommand } from '../../application/mark-notification-read/mark-notification-read.command';
import { MarkAllNotificationsReadCommand } from '../../application/mark-all-notifications-read/mark-all-notifications-read.command';
import { NotificationsQueryDto } from '../dto/notifications-query.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { UnreadCountResponseDto } from '../dto/unread-count-response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Permissions(Perm.notifications.read)
  @ApiOperation({ summary: 'List own notifications (paginated)' })
  @ApiPaginatedResponse(NotificationResponseDto)
  async findAll(
    @Query() query: NotificationsQueryDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<PaginatedResultDto<NotificationReadModel>> {
    return this.queryBus.execute(
      new GetNotificationsQuery(tenantId, userId, query.page, query.limit),
    );
  }

  // IMPORTANT: literal routes must come BEFORE `:id/read` to avoid route collision
  @Get('unread-count')
  @Permissions(Perm.notifications.read)
  @ApiOperation({ summary: 'Get count of own unread notifications' })
  @ApiStandardResponse({ type: UnreadCountResponseDto })
  async getUnreadCount(
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.queryBus.execute<GetUnreadCountQuery, number>(
      new GetUnreadCountQuery(tenantId, userId),
    );
    return { count };
  }

  @Patch('read-all')
  @Permissions(Perm.notifications.update)
  @ApiOperation({ summary: 'Mark all own notifications as read' })
  @ApiStandardResponse({
    description: 'Number of notifications marked as read',
  })
  async markAllAsRead(
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ updated: number }> {
    return this.commandBus.execute(
      new MarkAllNotificationsReadCommand(tenantId, userId),
    );
  }

  @Patch(':id/read')
  @Permissions(Perm.notifications.update)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new MarkNotificationReadCommand(id, tenantId, userId),
    );
  }
}
