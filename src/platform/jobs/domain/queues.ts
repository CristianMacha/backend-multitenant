export const QUEUES = {
  EMAILS: 'emails',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  INTEGRATIONS: 'integrations',
} as const;

export const JOB_NAMES = {
  SEND_EMAIL: 'send-email',
  SEND_NOTIFICATION: 'send-notification',
  GENERATE_REPORT: 'generate-report',
  SYNC_INTEGRATION: 'sync-integration',
} as const;

export interface SendEmailJobData {
  to: string;
  subject: string;
  template: string;
  variables?: Record<string, unknown>;
  tenantId?: string;
}

export interface SendNotificationJobData {
  userId: string;
  title: string;
  body: string;
  tenantId?: string;
}

export interface GenerateReportJobData {
  reportType: string;
  requestedBy: string;
  filters?: Record<string, unknown>;
  tenantId?: string;
}

export interface SyncIntegrationJobData {
  integration: string;
  payload: Record<string, unknown>;
  tenantId?: string;
}
