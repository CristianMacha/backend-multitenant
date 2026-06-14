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
import { DeleteOpportunityCommand } from './delete-opportunity.command';
import { DeleteOpportunityHandler } from './delete-opportunity.handler';

const makeOpportunity = () => {
  const o = Opportunity.create({
    tenantId: TenantId('tenant-1'),
    name: 'Deal A',
    accountId: AccountId('acct-1'),
    pipelineId: PipelineId('pipe-1'),
    stageId: StageId('stage-1'),
    stageType: 'OPEN',
    amount: 5000,
    currency: 'USD',
    ownerId: UserId('owner-1'),
  });
  o.pullDomainEvents();
  return o;
};

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: OpportunityRepository = {
    findById: jest.fn().mockResolvedValue(makeOpportunity()),
    findByContactId: jest.fn(),
    findMany: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('DeleteOpportunityHandler', () => {
  it('soft-deletes opportunity and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new DeleteOpportunityHandler(repo, eventBus);
    await handler.execute(new DeleteOpportunityCommand('opp-1', 'tenant-1'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when opportunity not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new DeleteOpportunityHandler(repo, eventBus);
    await expect(
      handler.execute(new DeleteOpportunityCommand('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
