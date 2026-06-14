import { EventBus } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { CrmSettings } from '../../domain/entities/crm-settings.entity';
import { CrmSettingsRepository } from '../../domain/repositories/crm-settings.repository';
import { UpsertCrmSettingsCommand } from './upsert-crm-settings.command';
import { UpsertCrmSettingsHandler } from './upsert-crm-settings.handler';

const makeMocks = (existing: CrmSettings | null) => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: CrmSettingsRepository = {
    findByTenantId: jest.fn().mockResolvedValue(existing),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('UpsertCrmSettingsHandler', () => {
  it('creates settings when none exist', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks(null);
    const handler = new UpsertCrmSettingsHandler(repo, eventBus);
    await handler.execute(
      new UpsertCrmSettingsCommand('tenant-1', 'EUR', 'Europe/London'),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('updates settings when they already exist', async () => {
    const existing = CrmSettings.create(TenantId('tenant-1'), 'USD', 'UTC');
    existing.pullDomainEvents();
    const { repo, save, publishAll, eventBus } = makeMocks(existing);
    const handler = new UpsertCrmSettingsHandler(repo, eventBus);
    await handler.execute(
      new UpsertCrmSettingsCommand('tenant-1', 'EUR', 'Europe/Paris'),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });
});
