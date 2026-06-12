import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { DomainException } from '@shared/exceptions';
import {
  RoleAssignedEvent,
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from '../events/user.events';

export interface UserProps extends BaseEntityProps {
  tenantId: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleIds: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  static create(
    props: Omit<UserProps, keyof BaseEntityProps | 'isActive' | 'roleIds'>,
  ): User {
    User.ensureValidEmail(props.email);
    const user = new User({ ...props, isActive: true, roleIds: [] });
    user.addDomainEvent(
      new UserCreatedEvent(user.id, user.tenantId, user.email),
    );
    return user;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get firebaseUid(): string {
    return this.props.firebaseUid;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get roleIds(): readonly string[] {
    return this.props.roleIds;
  }

  update(
    changes: Partial<Pick<UserProps, 'firstName' | 'lastName' | 'isActive'>>,
  ): void {
    if (this.isDeleted) {
      throw new DomainException('Cannot update a deleted user', 'USER_DELETED');
    }
    this.props = { ...this.props, ...changes };
    this.touch();
    this.addDomainEvent(new UserUpdatedEvent(this.id, this.tenantId, changes));
  }

  delete(): void {
    if (this.isDeleted) {
      throw new DomainException(
        'User is already deleted',
        'USER_ALREADY_DELETED',
      );
    }
    this.softDelete();
    this.addDomainEvent(new UserDeletedEvent(this.id, this.tenantId));
  }

  assignRole(roleId: string): void {
    if (this.props.roleIds.includes(roleId)) {
      throw new DomainException(
        'Role is already assigned to this user',
        'ROLE_ALREADY_ASSIGNED',
      );
    }
    this.props.roleIds.push(roleId);
    this.touch();
    this.addDomainEvent(new RoleAssignedEvent(this.id, this.tenantId, roleId));
  }

  private static ensureValidEmail(email: string): void {
    if (!EMAIL_REGEX.test(email)) {
      throw new DomainException(`Invalid email: ${email}`, 'INVALID_EMAIL');
    }
  }
}
