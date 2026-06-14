export class MarkNotificationReadCommand {
  constructor(
    readonly notificationId: string,
    readonly tenantId: string,
    readonly userId: string,
  ) {}
}
