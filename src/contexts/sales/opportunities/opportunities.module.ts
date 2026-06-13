import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CrmLookupModule } from '@contexts/crm/lookup/crm-lookup.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { OPPORTUNITY_REPOSITORY } from './domain/repositories/opportunity.repository';
import { PrismaOpportunityRepository } from './infrastructure/repositories/prisma-opportunity.repository';
import { OpportunitiesController } from './presentation/controllers/opportunities.controller';
import { CreateOpportunityHandler } from './application/create-opportunity/create-opportunity.handler';
import { UpdateOpportunityHandler } from './application/update-opportunity/update-opportunity.handler';
import { MoveOpportunityStageHandler } from './application/move-opportunity-stage/move-opportunity-stage.handler';
import { ReassignOpportunityHandler } from './application/reassign-opportunity/reassign-opportunity.handler';
import { DeleteOpportunityHandler } from './application/delete-opportunity/delete-opportunity.handler';
import { GetOpportunitiesHandler } from './application/get-opportunities/get-opportunities.handler';
import { GetOpportunityByIdHandler } from './application/get-opportunity-by-id/get-opportunity-by-id.handler';
import { GetPipelineBoardHandler } from './application/get-pipeline-board/get-pipeline-board.handler';
import { ClearContactOnContactDeletedHandler } from './application/on-crm-changed/clear-contact-on-contact-deleted.handler';
import { FlagOnAccountArchivedHandler } from './application/on-crm-changed/flag-on-account-archived.handler';

const commandHandlers = [
  CreateOpportunityHandler,
  UpdateOpportunityHandler,
  MoveOpportunityStageHandler,
  ReassignOpportunityHandler,
  DeleteOpportunityHandler,
];
const queryHandlers = [
  GetOpportunitiesHandler,
  GetOpportunityByIdHandler,
  GetPipelineBoardHandler,
];
const eventHandlers = [
  ClearContactOnContactDeletedHandler,
  FlagOnAccountArchivedHandler,
];

@Module({
  imports: [CqrsModule, PipelinesModule, CrmLookupModule],
  controllers: [OpportunitiesController],
  providers: [
    { provide: OPPORTUNITY_REPOSITORY, useClass: PrismaOpportunityRepository },
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
  exports: [OPPORTUNITY_REPOSITORY],
})
export class OpportunitiesModule {}
