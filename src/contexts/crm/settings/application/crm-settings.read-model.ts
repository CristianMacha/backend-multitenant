export interface CrmSettingsReadModel {
  defaultCurrency: string;
  timezone: string;
}

export const DEFAULT_CRM_SETTINGS: CrmSettingsReadModel = {
  defaultCurrency: 'USD',
  timezone: 'UTC',
};
