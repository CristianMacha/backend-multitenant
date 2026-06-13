import { EventBus } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import { CrmLookup } from '@contexts/crm/lookup/crm-lookup.port';
import { Pipeline } from '@contexts/sales/pipelines/domain/entities/pipeline.entity';
import { PipelineRepository } from '@contexts/sales/pipelines/domain/repositories/pipeline.repository';
import { OpportunityRepository } from '../../domain/repositories/opportunity.repository';
import { CreateOpportunityCommand } from './create-opportunity.command';
import { CreateOpportunityHandler } from './create-opportunity.handler';

const makePipeline = () =>
  Pipeline.create({
    tenantId: TenantId('tenant-1'),
    name: 'Default',
    isDefault: true,
    stages: [
      { name: 'New', order: 0, probability: 10, type: 'OPEN' },
      { name: 'Won', order: 1, probability: 100, type: 'WON' },
      { name: 'Lost', order: 2, probability: 0, type: 'LOST' },
    ],
  });

const makeMocks = (opts: {
  pipeline?: Pipeline | null;
  accountExists?: boolean;
  contactExists?: boolean;
}) => {
  const save = jest
    .fn<Promise<void>, Parameters<OpportunityRepository['save']>>()
    .mockResolvedValue(undefined);
  const opportunityRepo: OpportunityRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findByContactId: jest.fn().mockResolvedValue([]),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save,
  };
  const pipelineRepo: PipelineRepository = {
    findById: jest.fn().mockResolvedValue(opts.pipeline ?? null),
    findAll: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const accountExists = jest
    .fn<Promise<boolean>, unknown[]>()
    .mockResolvedValue(opts.accountExists ?? true);
  const contactExists = jest
    .fn<Promise<boolean>, unknown[]>()
    .mockResolvedValue(opts.contactExists ?? true);
  const crm: CrmLookup = { accountExists, contactExists };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;
  return {
    opportunityRepo,
    pipelineRepo,
    crm,
    save,
    publishAll,
    eventBus,
    accountExists,
  };
};

const command = (over: Partial<CreateOpportunityCommand> = {}) =>
  new CreateOpportunityCommand(
    'tenant-1',
    'owner-1',
    over.name ?? 'Acme renewal',
    over.accountId ?? '00000000-0000-0000-0000-0000000000a1',
    over.pipelineId ?? '00000000-0000-0000-0000-0000000000p1',
    over.amount ?? 5000,
    over.currency ?? 'USD',
  );

describe('CreateOpportunityHandler', () => {
  it('creates an opportunity in the first stage when none is given', async () => {
    const { opportunityRepo, pipelineRepo, crm, save, publishAll, eventBus } =
      makeMocks({ pipeline: makePipeline() });
    const handler = new CreateOpportunityHandler(
      opportunityRepo,
      pipelineRepo,
      crm,
      eventBus,
    );

    const result = await handler.execute(command());

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when the pipeline does not exist', async () => {
    const { opportunityRepo, pipelineRepo, crm, save, eventBus } = makeMocks({
      pipeline: null,
    });
    const handler = new CreateOpportunityHandler(
      opportunityRepo,
      pipelineRepo,
      crm,
      eventBus,
    );

    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      EntityNotFoundException,
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('throws when the account does not exist in the tenant', async () => {
    const { opportunityRepo, pipelineRepo, crm, save, eventBus } = makeMocks({
      pipeline: makePipeline(),
      accountExists: false,
    });
    const handler = new CreateOpportunityHandler(
      opportunityRepo,
      pipelineRepo,
      crm,
      eventBus,
    );

    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      EntityNotFoundException,
    );
    expect(save).not.toHaveBeenCalled();
  });
});
