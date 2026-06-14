import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  AccountId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { CrmLookup } from '@contexts/crm/lookup/crm-lookup.port';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import { OpportunityRepository } from '../../domain/repositories/opportunity.repository';
import { UpdateOpportunityCommand } from './update-opportunity.command';
import { UpdateOpportunityHandler } from './update-opportunity.handler';

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
  const crm: CrmLookup = {
    contactExists: jest.fn().mockResolvedValue(true),
    accountExists: jest.fn().mockResolvedValue(true),
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, crm, publishAll, eventBus };
};

describe('UpdateOpportunityHandler', () => {
  it('updates opportunity name and publishes event', async () => {
    const { repo, save, crm, publishAll, eventBus } = makeMocks();
    const handler = new UpdateOpportunityHandler(repo, crm, eventBus);
    await handler.execute(
      new UpdateOpportunityCommand('opp-1', 'tenant-1', { name: 'New Deal' }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when opportunity not found', async () => {
    const { repo, crm, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new UpdateOpportunityHandler(repo, crm, eventBus);
    await expect(
      handler.execute(new UpdateOpportunityCommand('missing', 'tenant-1', {})),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('updates amount when provided', async () => {
    const { repo, save, crm, publishAll, eventBus } = makeMocks();
    const handler = new UpdateOpportunityHandler(repo, crm, eventBus);
    await handler.execute(
      new UpdateOpportunityCommand('opp-1', 'tenant-1', {
        amount: 9999,
        currency: 'EUR',
      }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('validates contact when contactId is provided', async () => {
    const { repo, crm, eventBus } = makeMocks();
    (crm.contactExists as jest.Mock).mockResolvedValue(false);
    const handler = new UpdateOpportunityHandler(repo, crm, eventBus);
    await expect(
      handler.execute(
        new UpdateOpportunityCommand('opp-1', 'tenant-1', {
          contactId: 'contact-999',
        }),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
