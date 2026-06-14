export class MarkAllNotificationsReadCommand {
  constructor(
    readonly tenantId: string,
    readonly userId: string,
  ) {}
}
