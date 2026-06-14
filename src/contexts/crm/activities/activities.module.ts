import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmLookupModule } from '../lookup/crm-lookup.module';
import { SalesLookupModule } from '@contexts/sales/lookup/sales-lookup.module';
import { JobsModule } from '@platform/jobs/jobs.module';
import { ACTIVITY_REPOSITORY } from './domain/repositories/activity.repository';
import { PrismaActivityRepository } from './infrastructure/repositories/prisma-activity.repository';
import { ActivitiesController } from './presentation/controllers/activities.controller';
import { CreateActivityHandler } from './application/create-activity/create-activity.handler';
import { CompleteActivityHandler } from './application/complete-activity/complete-activity.handler';
import { RescheduleActivityHandler } from './application/reschedule-activity/reschedule-activity.handler';
import { DeleteActivityHandler } from './application/delete-activity/delete-activity.handler';
import { GetActivitiesHandler } from './application/get-activities/get-activities.handler';
import { GetRecordTimelineHandler } from './application/get-record-timeline/get-record-timeline.handler';
import { CreateSystemActivityOnOpportunityCreatedHandler } from './application/on-opportunity-changed/create-system-activity-on-opportunity-created.handler';
import { CreateSystemActivityOnOpportunityWonHandler } from './application/on-opportunity-changed/create-system-activity-on-opportunity-won.handler';
import { CreateSystemActivityOnOpportunityLostHandler } from './application/on-opportunity-changed/create-system-activity-on-opportunity-lost.handler';

const commandHandlers = [
  CreateActivityHandler,
  CompleteActivityHandler,
  RescheduleActivityHandler,
  DeleteActivityHandler,
];

const queryHandlers = [GetActivitiesHandler, GetRecordTimelineHandler];

const eventHandlers = [
  CreateSystemActivityOnOpportunityCreatedHandler,
  CreateSystemActivityOnOpportunityWonHandler,
  CreateSystemActivityOnOpportunityLostHandler,
];

@Module({
  imports: [CqrsModule, CrmLookupModule, SalesLookupModule, JobsModule],
  controllers: [ActivitiesController],
  providers: [
    { provide: ACTIVITY_REPOSITORY, useClass: PrismaActivityRepository },
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
})
export class ActivitiesModule {}
