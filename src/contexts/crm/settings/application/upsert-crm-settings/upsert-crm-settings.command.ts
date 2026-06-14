export class UpsertCrmSettingsCommand {
  constructor(
    readonly tenantId: string,
    readonly defaultCurrency?: string,
    readonly timezone?: string,
  ) {}
}
