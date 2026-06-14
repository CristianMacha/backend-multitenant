import { TenantId, UserId } from '@shared/domain/types';
import { Activity } from '../../domain/entities/activity.entity';
import { ActivityMapper } from './activity.mapper';

const makeRaw = () => ({
  id: 'act-1',
  tenantId: 'tenant-1',
  type: 'TASK',
  subject: 'Follow up call',
  body: 'Discuss renewal',
  dueAt: new Date('2024-06-01'),
  completedAt: null,
  status: 'PENDING',
  ownerId: 'owner-1',
  source: 'MANUAL',
  relatedToType: 'ACCOUNT',
  relatedToId: 'acct-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
});

describe('ActivityMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row to Activity aggregate', () => {
      const activity = ActivityMapper.toDomain(makeRaw() as never);
      expect(activity.id).toBe('act-1');
      expect(activity.type).toBe('TASK');
      expect(activity.subject).toBe('Follow up call');
      expect(activity.relatedToType).toBe('ACCOUNT');
    });

    it('handles null optional fields', () => {
      const raw = { ...makeRaw(), body: null, dueAt: null, ownerId: null };
      const activity = ActivityMapper.toDomain(raw as never);
      expect(activity.body).toBeUndefined();
      expect(activity.dueAt).toBeUndefined();
      expect(activity.ownerId).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('maps Activity aggregate to persistence shape', () => {
      const activity = Activity.create({
        tenantId: TenantId('tenant-1'),
        type: 'TASK',
        subject: 'Call',
        relatedToType: 'ACCOUNT',
        relatedToId: 'acct-1',
        ownerId: UserId('owner-1'),
      });
      activity.pullDomainEvents();
      const row = ActivityMapper.toPersistence(activity);
      expect(row.subject).toBe('Call');
      expect(row.type).toBe('TASK');
      expect(row.tenantId).toBe('tenant-1');
    });
  });
});
