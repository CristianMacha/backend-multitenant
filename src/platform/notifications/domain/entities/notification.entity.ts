import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { TenantId, UserId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import {
  NotificationCreatedEvent,
  NotificationDeletedEvent,
} from '../events/notification.events';

export type NotificationType = 'ACTIVITY_REMINDER' | 'SYSTEM' | 'GENERIC';

export interface NotificationProps extends BaseEntityProps {
  tenantId: TenantId;
  userId: UserId;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  readAt?: Date;
}

export interface CreateNotificationProps {
  tenantId: TenantId;
  userId: UserId;
  type: NotificationType;
  title: string;
  body: string;
}

export class Notification extends AggregateRoot<NotificationProps> {
  private constructor(props: NotificationProps) {
    super(props);
  }

  static create(props: CreateNotificationProps): Notification {
    const title = props.title.trim();
    const body = props.body.trim();

    if (!title) {
      throw new DomainException(
        'Notification title is required',
        'INVALID_NOTIFICATION',
      );
    }
    if (!body) {
      throw new DomainException(
        'Notification body is required',
        'INVALID_NOTIFICATION',
      );
    }

    const notification = new Notification({
      tenantId: props.tenantId,
      userId: props.userId,
      type: props.type,
      title,
      body,
      read: false,
      readAt: undefined,
    });

    notification.addDomainEvent(
      new NotificationCreatedEvent(
        notification.id,
        notification.tenantId,
        notification.userId,
        notification.type,
        notification.title,
      ),
    );

    return notification;
  }

  static fromPersistence(props: NotificationProps): Notification {
    return new Notification(props);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get body(): string {
    return this.props.body;
  }

  get read(): boolean {
    return this.props.read;
  }

  get readAt(): Date | undefined {
    return this.props.readAt;
  }

  /**
   * Marks the notification as read. Idempotent: if already read,
   * no state change and no event is emitted (R18).
   */
  markAsRead(): void {
    if (this.props.read) {
      return; // idempotent — no-op
    }
    this.props.read = true;
    this.props.readAt = new Date();
    this.touch();
  }

  delete(): void {
    this.softDelete();
    this.addDomainEvent(
      new NotificationDeletedEvent(this.id, this.tenantId, this.userId),
    );
  }
}
