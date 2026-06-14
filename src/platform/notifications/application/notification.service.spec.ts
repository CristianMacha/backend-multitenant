import { EventBus } from '@nestjs/cqrs';
import { DomainException } from '@shared/exceptions';
import { NotificationRepository } from '../domain/repositories/notification.repository';
import { NotificationService } from './notification.service';

const makeMocks = () => {
  const save = jest
    .fn<Promise<void>, Parameters<NotificationRepository['save']>>()
    .mockResolvedValue(undefined);
  const repo: NotificationRepository = {
    findById: jest.fn().mockResolvedValue(null),
    save,
    markAllAsRead: jest.fn().mockResolvedValue(0),
  };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;

  return { repo, save, publishAll, eventBus };
};

describe('NotificationService', () => {
  it('creates a notification and returns its id (R4, R5)', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const service = new NotificationService(repo, eventBus);

    const result = await service.create({
      tenantId: 'tenant-id',
      userId: 'user-id',
      type: 'GENERIC',
      title: 'Hello',
      body: 'World',
    });

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('passes domain events to repository.save (R6)', async () => {
    const { repo, save, eventBus } = makeMocks();
    const service = new NotificationService(repo, eventBus);

    await service.create({
      tenantId: 'tenant-id',
      userId: 'user-id',
      type: 'ACTIVITY_REMINDER',
      title: 'Reminder',
      body: 'Activity is due',
    });

    // save is called with the notification and the events array
    const [, events] = save.mock.calls[0];
    expect(events).toBeDefined();
    expect(events!.length).toBe(1);
  });

  it('calls eventBus.publishAll with domain events (R7)', async () => {
    const { repo, publishAll, eventBus } = makeMocks();
    const service = new NotificationService(repo, eventBus);

    await service.create({
      tenantId: 'tenant-id',
      userId: 'user-id',
      type: 'GENERIC',
      title: 'Test',
      body: 'Body',
    });

    expect(publishAll).toHaveBeenCalledTimes(1);
    const [events] = publishAll.mock.calls[0];
    expect(events).toHaveLength(1);
  });

  it('throws DomainException when title is empty (R8)', async () => {
    const { repo, eventBus } = makeMocks();
    const service = new NotificationService(repo, eventBus);

    await expect(
      service.create({
        tenantId: 'tenant-id',
        userId: 'user-id',
        type: 'GENERIC',
        title: '  ',
        body: 'valid body',
      }),
    ).rejects.toThrow(DomainException);
  });

  it('throws DomainException when body is empty (R8)', async () => {
    const { repo, eventBus } = makeMocks();
    const service = new NotificationService(repo, eventBus);

    await expect(
      service.create({
        tenantId: 'tenant-id',
        userId: 'user-id',
        type: 'GENERIC',
        title: 'Valid title',
        body: '',
      }),
    ).rejects.toThrow(DomainException);
  });
});
