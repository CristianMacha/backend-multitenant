import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { DEFAULT_CRM_SETTINGS } from '../crm-settings.read-model';
import { GetCrmSettingsQuery } from './get-crm-settings.query';
import { GetCrmSettingsHandler } from './get-crm-settings.handler';

const makePrisma = (
  row: { defaultCurrency: string; timezone: string } | null,
) =>
  ({
    crmSettings: { findUnique: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetCrmSettingsHandler', () => {
  it('returns default settings when no row exists', async () => {
    const handler = new GetCrmSettingsHandler(makePrisma(null));
    const result = await handler.execute(new GetCrmSettingsQuery('tenant-1'));
    expect(result).toEqual(DEFAULT_CRM_SETTINGS);
  });

  it('returns stored settings when row exists', async () => {
    const stored = { defaultCurrency: 'EUR', timezone: 'Europe/Paris' };
    const handler = new GetCrmSettingsHandler(makePrisma(stored));
    const result = await handler.execute(new GetCrmSettingsQuery('tenant-1'));
    expect(result.defaultCurrency).toBe('EUR');
    expect(result.timezone).toBe('Europe/Paris');
  });
});
