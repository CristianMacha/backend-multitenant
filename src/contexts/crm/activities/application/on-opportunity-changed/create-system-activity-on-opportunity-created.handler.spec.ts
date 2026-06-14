import { EventBus } from '@nestjs/cqrs';
import { OpportunityCreatedEvent } from '@contexts/sales/opportunities/domain/events/opportunity.events';
import { ActivityRepository } from '../../domain/repositories/activity.repository';
import { CreateSystemActivityOnOpportunityCreatedHandler } from './create-system-activity-on-opportunity-created.handler';

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: ActivityRepository = {
    findById: jest.fn(),
    findMany: jest.fn(),
    findTimeline: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('CreateSystemActivityOnOpportunityCreatedHandler', () => {
  it('creates system activity when opportunity is created', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreateSystemActivityOnOpportunityCreatedHandler(
      repo,
      eventBus,
    );
    const event = new OpportunityCreatedEvent(
      'opp-1',
      'tenant-1',
      'Deal A',
      'acct-1',
      'owner-1',
    );
    await handler.handle(event);
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('skips when event has no tenantId', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreateSystemActivityOnOpportunityCreatedHandler(
      repo,
      eventBus,
    );
    const event = new OpportunityCreatedEvent(
      '',
      '',
      'Deal A',
      'acct-1',
      'owner-1',
    );
    await handler.handle(event);
    expect(save).not.toHaveBeenCalled();
  });
});
