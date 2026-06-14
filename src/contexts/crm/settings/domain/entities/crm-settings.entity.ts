import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { TenantId } from '@shared/domain/types';
import { CrmSettingsUpdatedEvent } from '../events/crm-settings.events';

export interface CrmSettingsProps extends BaseEntityProps {
  tenantId: TenantId;
  defaultCurrency: string;
  timezone: string;
}

export class CrmSettings extends AggregateRoot<CrmSettingsProps> {
  private constructor(props: CrmSettingsProps) {
    super(props);
  }

  static create(
    tenantId: TenantId,
    defaultCurrency = 'USD',
    timezone = 'UTC',
  ): CrmSettings {
    const settings = new CrmSettings({ tenantId, defaultCurrency, timezone });
    settings.addDomainEvent(
      new CrmSettingsUpdatedEvent(
        settings.id,
        tenantId,
        defaultCurrency,
        timezone,
      ),
    );
    return settings;
  }

  static fromPersistence(props: CrmSettingsProps): CrmSettings {
    return new CrmSettings(props);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get defaultCurrency(): string {
    return this.props.defaultCurrency;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  update(changes: { defaultCurrency?: string; timezone?: string }): void {
    if (changes.defaultCurrency !== undefined) {
      this.props.defaultCurrency = changes.defaultCurrency;
    }
    if (changes.timezone !== undefined) {
      this.props.timezone = changes.timezone;
    }
    this.touch();
    this.addDomainEvent(
      new CrmSettingsUpdatedEvent(
        this.id,
        this.tenantId,
        this.defaultCurrency,
        this.timezone,
      ),
    );
  }
}
