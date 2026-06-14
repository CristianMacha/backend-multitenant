import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { OpportunityLostEvent } from '@contexts/sales/opportunities/domain/events/opportunity.events';
import { ActivityRepository } from '../../domain/repositories/activity.repository';
import { CreateSystemActivityOnOpportunityLostHandler } from './create-system-activity-on-opportunity-lost.handler';

const makeMocks = (oppRow: { accountId: string; name: string } | null) => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: ActivityRepository = {
    findById: jest.fn(),
    findMany: jest.fn(),
    findTimeline: jest.fn(),
    save,
  };
  const prisma = {
    opportunity: { findFirst: jest.fn().mockResolvedValue(oppRow) },
  } as unknown as PrismaService;
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, prisma, publishAll, eventBus };
};

describe('CreateSystemActivityOnOpportunityLostHandler', () => {
  it('creates system activity when opportunity is lost', async () => {
    const { repo, save, publishAll, eventBus, prisma } = makeMocks({
      accountId: 'acct-1',
      name: 'Deal A',
    });
    const handler = new CreateSystemActivityOnOpportunityLostHandler(
      repo,
      eventBus,
      prisma,
    );
    await handler.handle(new OpportunityLostEvent('opp-1', 'tenant-1'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('skips when opportunity not found', async () => {
    const { repo, save, eventBus, prisma } = makeMocks(null);
    const handler = new CreateSystemActivityOnOpportunityLostHandler(
      repo,
      eventBus,
      prisma,
    );
    await handler.handle(new OpportunityLostEvent('opp-1', 'tenant-1'));
    expect(save).not.toHaveBeenCalled();
  });

  it('skips when event has no tenantId', async () => {
    const { repo, save, eventBus, prisma } = makeMocks(null);
    const handler = new CreateSystemActivityOnOpportunityLostHandler(
      repo,
      eventBus,
      prisma,
    );
    await handler.handle(new OpportunityLostEvent('', ''));
    expect(save).not.toHaveBeenCalled();
  });
});
