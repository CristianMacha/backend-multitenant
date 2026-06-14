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
import { ReassignOpportunityCommand } from './reassign-opportunity.command';
import { ReassignOpportunityHandler } from './reassign-opportunity.handler';

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

describe('ReassignOpportunityHandler', () => {
  it('reassigns opportunity owner and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new ReassignOpportunityHandler(repo, eventBus);
    await handler.execute(
      new ReassignOpportunityCommand('opp-1', 'tenant-1', 'new-owner'),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when opportunity not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new ReassignOpportunityHandler(repo, eventBus);
    await expect(
      handler.execute(
        new ReassignOpportunityCommand('missing', 'tenant-1', 'owner'),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
