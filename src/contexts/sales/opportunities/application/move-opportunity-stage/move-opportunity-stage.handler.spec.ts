import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  AccountId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import { OpportunityRepository } from '../../domain/repositories/opportunity.repository';
import { Pipeline } from '@contexts/sales/pipelines/domain/entities/pipeline.entity';
import { PipelineRepository } from '@contexts/sales/pipelines/domain/repositories/pipeline.repository';
import { MoveOpportunityStageCommand } from './move-opportunity-stage.command';
import { MoveOpportunityStageHandler } from './move-opportunity-stage.handler';

const makePipeline = () => {
  const p = Pipeline.create({
    tenantId: TenantId('tenant-1'),
    name: 'Sales',
    stages: [
      { name: 'Lead', order: 0, probability: 10, type: 'OPEN' },
      { name: 'Won', order: 1, probability: 100, type: 'WON' },
      { name: 'Lost', order: 2, probability: 0, type: 'LOST' },
    ],
  });
  p.pullDomainEvents();
  return p;
};

const makeOpportunity = (pipelineId: string, stageId: string) => {
  const o = Opportunity.create({
    tenantId: TenantId('tenant-1'),
    name: 'Deal A',
    accountId: AccountId('acct-1'),
    pipelineId: PipelineId(pipelineId),
    stageId: StageId(stageId),
    stageType: 'OPEN',
    amount: 5000,
    currency: 'USD',
    ownerId: UserId('owner-1'),
  });
  o.pullDomainEvents();
  return o;
};

const makeMocks = () => {
  const pipeline = makePipeline();
  const firstStage = pipeline.stages[1];
  const opp = makeOpportunity(pipeline.id, pipeline.stages[0].id);

  const save = jest.fn().mockResolvedValue(undefined);
  const oppRepo: OpportunityRepository = {
    findById: jest.fn().mockResolvedValue(opp),
    findByContactId: jest.fn(),
    findMany: jest.fn(),
    save,
  };
  const pipelineRepo: PipelineRepository = {
    findById: jest.fn().mockResolvedValue(pipeline),
    findAll: jest.fn(),
    save: jest.fn(),
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return {
    pipeline,
    firstStage,
    opp,
    oppRepo,
    pipelineRepo,
    save,
    publishAll,
    eventBus,
  };
};

describe('MoveOpportunityStageHandler', () => {
  it('moves opportunity to new stage and publishes event', async () => {
    const { firstStage, oppRepo, pipelineRepo, save, publishAll, eventBus } =
      makeMocks();
    const handler = new MoveOpportunityStageHandler(
      oppRepo,
      pipelineRepo,
      eventBus,
    );
    await handler.execute(
      new MoveOpportunityStageCommand('opp-1', 'tenant-1', firstStage.id),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when opportunity not found', async () => {
    const { pipelineRepo, oppRepo, eventBus } = makeMocks();
    (oppRepo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new MoveOpportunityStageHandler(
      oppRepo,
      pipelineRepo,
      eventBus,
    );
    await expect(
      handler.execute(
        new MoveOpportunityStageCommand('missing', 'tenant-1', 'stage-1'),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws when pipeline not found', async () => {
    const { oppRepo, pipelineRepo, eventBus } = makeMocks();
    (pipelineRepo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new MoveOpportunityStageHandler(
      oppRepo,
      pipelineRepo,
      eventBus,
    );
    await expect(
      handler.execute(
        new MoveOpportunityStageCommand('opp-1', 'tenant-1', 'stage-x'),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws when stage is not found in pipeline', async () => {
    const { pipeline, oppRepo, pipelineRepo, eventBus } = makeMocks();
    (pipelineRepo.findById as jest.Mock).mockResolvedValue(pipeline);
    const handler = new MoveOpportunityStageHandler(
      oppRepo,
      pipelineRepo,
      eventBus,
    );
    await expect(
      handler.execute(
        new MoveOpportunityStageCommand(
          'opp-1',
          'tenant-1',
          'non-existent-stage',
        ),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
