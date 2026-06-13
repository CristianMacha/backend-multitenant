import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { DomainException } from '@shared/exceptions';
import {
  RoleCreatedEvent,
  RoleDeletedEvent,
  RoleUpdatedEvent,
} from '../events/role.events';

export interface RoleProps extends BaseEntityProps {
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionIds: string[];
}

export class Role extends AggregateRoot<RoleProps> {
  private constructor(props: RoleProps) {
    super(props);
  }

  static create(
    tenantId: string,
    name: string,
    description: string | null = null,
  ): Role {
    if (!name.trim()) {
      throw new DomainException(
        'Role name cannot be empty',
        'INVALID_ROLE_NAME',
      );
    }
    const role = new Role({
      tenantId,
      name: name.trim().toUpperCase(),
      description,
      isSystem: false,
      permissionIds: [],
    });
    role.addDomainEvent(new RoleCreatedEvent(role.id, tenantId, role.name));
    return role;
  }

  static fromPersistence(props: RoleProps): Role {
    return new Role(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get permissionIds(): readonly string[] {
    return this.props.permissionIds;
  }

  update(changes: { name?: string; description?: string | null }): void {
    this.ensureNotSystem('updated');
    if (changes.name !== undefined) {
      if (!changes.name.trim()) {
        throw new DomainException(
          'Role name cannot be empty',
          'INVALID_ROLE_NAME',
        );
      }
      this.props.name = changes.name.trim().toUpperCase();
    }
    if (changes.description !== undefined) {
      this.props.description = changes.description;
    }
    this.touch();
    this.addDomainEvent(new RoleUpdatedEvent(this.id, this.tenantId, changes));
  }

  setPermissions(permissionIds: string[]): void {
    this.ensureNotSystem('modified');
    this.props.permissionIds = [...new Set(permissionIds)];
    this.touch();
    this.addDomainEvent(
      new RoleUpdatedEvent(this.id, this.tenantId, { permissionIds }),
    );
  }

  delete(): void {
    this.ensureNotSystem('deleted');
    if (this.isDeleted) {
      throw new DomainException(
        'Role is already deleted',
        'ROLE_ALREADY_DELETED',
      );
    }
    this.softDelete();
    this.addDomainEvent(new RoleDeletedEvent(this.id, this.tenantId));
  }

  private ensureNotSystem(action: string): void {
    if (this.props.isSystem) {
      throw new DomainException(
        `System roles cannot be ${action}`,
        'SYSTEM_ROLE_IMMUTABLE',
      );
    }
  }
}
