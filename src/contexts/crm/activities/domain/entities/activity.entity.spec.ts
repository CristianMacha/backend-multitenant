import { TenantId, UserId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import { Activity } from './activity.entity';
import {
  ActivityCreatedEvent,
  ActivityCompletedEvent,
  ActivityRescheduledEvent,
  ActivityDeletedEvent,
} from '../events/activity.events';

const TENANT = TenantId('tenant-uuid');
const OWNER = UserId('owner-uuid');

function makeActivity(
  overrides: Partial<Parameters<typeof Activity.create>[0]> = {},
) {
  return Activity.create({
    tenantId: TENANT,
    type: 'CALL',
    subject: 'Follow-up call',
    relatedToType: 'ACCOUNT',
    relatedToId: 'account-uuid',
    ownerId: OWNER,
    ...overrides,
  });
}

describe('Activity aggregate', () => {
  describe('create()', () => {
    it('creates with OPEN status and emits ActivityCreatedEvent', () => {
      const activity = makeActivity();

      expect(activity.status).toBe('OPEN');
      expect(activity.source).toBe('USER');
      expect(activity.subject).toBe('Follow-up call');

      const events = activity.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActivityCreatedEvent);
      const e = events[0] as ActivityCreatedEvent;
      expect(e.type).toBe('CALL');
      expect(e.relatedToType).toBe('ACCOUNT');
    });

    it('throws when subject is empty', () => {
      expect(() => makeActivity({ subject: '   ' })).toThrow(DomainException);
    });

    it('trims subject', () => {
      const a = makeActivity({ subject: '  call  ' });
      expect(a.subject).toBe('call');
    });

    it('defaults source to USER', () => {
      const a = makeActivity();
      expect(a.source).toBe('USER');
    });

    it('accepts SYSTEM source', () => {
      const a = makeActivity({ source: 'SYSTEM' });
      expect(a.source).toBe('SYSTEM');
    });
  });

  describe('complete()', () => {
    it('sets status DONE and emits ActivityCompletedEvent', () => {
      const activity = makeActivity();
      activity.pullDomainEvents();

      activity.complete();

      expect(activity.status).toBe('DONE');
      expect(activity.completedAt).toBeDefined();

      const events = activity.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActivityCompletedEvent);
    });

    it('throws if already completed', () => {
      const activity = makeActivity();
      activity.pullDomainEvents();
      activity.complete();

      expect(() => activity.complete()).toThrow(DomainException);
    });
  });

  describe('reschedule()', () => {
    it('updates dueAt and emits ActivityRescheduledEvent', () => {
      const activity = makeActivity();
      activity.pullDomainEvents();
      const newDate = new Date('2030-01-01T10:00:00Z');

      activity.reschedule(newDate);

      expect(activity.dueAt).toEqual(newDate);
      const events = activity.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActivityRescheduledEvent);
    });

    it('throws when rescheduling a completed activity', () => {
      const activity = makeActivity();
      activity.pullDomainEvents();
      activity.complete();
      activity.pullDomainEvents();

      expect(() => activity.reschedule(new Date())).toThrow(DomainException);
    });
  });

  describe('delete()', () => {
    it('soft-deletes and emits ActivityDeletedEvent', () => {
      const activity = makeActivity();
      activity.pullDomainEvents();

      activity.delete();

      expect(activity.isDeleted).toBe(true);
      const events = activity.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ActivityDeletedEvent);
    });
  });
});
