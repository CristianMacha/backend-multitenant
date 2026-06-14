import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { OpportunityWonEvent } from '@contexts/sales/opportunities/domain/events/opportunity.events';
import { ActivityRepository } from '../../domain/repositories/activity.repository';
import { CreateSystemActivityOnOpportunityWonHandler } from './create-system-activity-on-opportunity-won.handler';

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

describe('CreateSystemActivityOnOpportunityWonHandler', () => {
  it('creates system activity when opportunity is won', async () => {
    const { repo, save, publishAll, eventBus, prisma } = makeMocks({
      accountId: 'acct-1',
      name: 'Deal A',
    });
    const handler = new CreateSystemActivityOnOpportunityWonHandler(
      repo,
      eventBus,
      prisma,
    );
    await handler.handle(
      new OpportunityWonEvent('opp-1', 'tenant-1', 5000, 'USD'),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('skips when opportunity not found', async () => {
    const { repo, save, eventBus, prisma } = makeMocks(null);
    const handler = new CreateSystemActivityOnOpportunityWonHandler(
      repo,
      eventBus,
      prisma,
    );
    await handler.handle(
      new OpportunityWonEvent('opp-1', 'tenant-1', 0, 'USD'),
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('skips when event has no tenantId', async () => {
    const { repo, save, eventBus, prisma } = makeMocks(null);
    const handler = new CreateSystemActivityOnOpportunityWonHandler(
      repo,
      eventBus,
      prisma,
    );
    await handler.handle(new OpportunityWonEvent('', '', 0, 'USD'));
    expect(save).not.toHaveBeenCalled();
  });
});
