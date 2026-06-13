import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { RoleId, TenantId } from '@shared/domain/types';
import { Email } from '@shared/domain/value-objects/email.vo';
import { DomainException } from '@shared/exceptions';
import {
  RoleAssignedEvent,
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from '../events/user.events';

export interface UserProps extends BaseEntityProps {
  tenantId: TenantId;
  firebaseUid: string;
  email: Email;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleIds: RoleId[];
}

/** Raw props for create — email is a plain string validated and normalized inside. */
export interface CreateUserProps {
  tenantId: TenantId;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RehydrateUserProps extends Omit<UserProps, 'email'> {
  email: string;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  static create(props: CreateUserProps): User {
    const email = Email.from(props.email);
    const user = new User({
      ...props,
      email,
      isActive: true,
      roleIds: [],
    });
    user.addDomainEvent(
      new UserCreatedEvent(user.id, user.tenantId, user.email),
    );
    return user;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: RehydrateUserProps): User {
    return new User({ ...props, email: Email.from(props.email) });
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get firebaseUid(): string {
    return this.props.firebaseUid;
  }

  /** Returns the normalized email string. */
  get email(): string {
    return this.props.email.getValue();
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

  get roleIds(): readonly RoleId[] {
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

  assignRole(roleId: RoleId): void {
    if (this.props.roleIds.includes(roleId)) {
      throw new DomainException(
        'Role is already assigned to this user',
        'ROLE_ALREADY_ASSIGNED',
      );
    }
    this.props.roleIds = [...this.props.roleIds, roleId];
    this.touch();
    this.addDomainEvent(new RoleAssignedEvent(this.id, this.tenantId, roleId));
  }
}
