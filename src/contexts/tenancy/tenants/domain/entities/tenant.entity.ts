import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { DomainException } from '@shared/exceptions';
import {
  TenantCreatedEvent,
  TenantDeletedEvent,
  TenantUpdatedEvent,
} from '../events/tenant.events';

export interface TenantProps extends BaseEntityProps {
  name: string;
  slug: string;
  isActive: boolean;
}

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps) {
    super(props);
  }

  static create(name: string, slug: string): Tenant {
    const tenant = new Tenant({ name, slug, isActive: true });
    tenant.addDomainEvent(new TenantCreatedEvent(tenant.id, name, slug));
    return tenant;
  }

  static fromPersistence(props: TenantProps & { id: string }): Tenant {
    return new Tenant(props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  update(changes: Partial<Pick<TenantProps, 'name' | 'isActive'>>): void {
    if (this.isDeleted) {
      throw new DomainException(
        'Cannot update a deleted tenant',
        'TENANT_DELETED',
      );
    }
    this.props = { ...this.props, ...changes };
    this.touch();
    this.addDomainEvent(new TenantUpdatedEvent(this.id, changes));
  }

  delete(): void {
    if (this.isDeleted) {
      throw new DomainException(
        'Tenant is already deleted',
        'TENANT_ALREADY_DELETED',
      );
    }
    this.softDelete();
    this.addDomainEvent(new TenantDeletedEvent(this.id));
  }
}
