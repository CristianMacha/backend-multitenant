import { OutboxPublisherProcessor } from './outbox-publisher.processor';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

/**
 * Subclass that exposes the private extractNewValues helper for unit testing
 * without making it public in the production class.
 */
class TestableProcessor extends OutboxPublisherProcessor {
  public extract(payload: unknown): Record<string, unknown> | undefined {
    return this.extractNewValues(payload);
  }
}

describe('OutboxPublisherProcessor', () => {
  let processor: TestableProcessor;

  beforeEach(() => {
    processor = new TestableProcessor(
      null as unknown as PrismaService,
      null as unknown as AuditLogService,
    );
  });

  describe('extractNewValues', () => {
    it('returns undefined for null payload', () => {
      expect(processor.extract(null)).toBeUndefined();
    });

    it('returns undefined for non-object payload', () => {
      expect(processor.extract('string')).toBeUndefined();
      expect(processor.extract(42)).toBeUndefined();
    });

    it('strips base DomainEvent metadata and returns event-specific fields', () => {
      const payload = {
        eventId: 'uuid-1',
        occurredAt: new Date().toISOString(),
        eventName: 'user.created',
        aggregateId: 'uuid-2',
        tenantId: 'uuid-3',
        email: 'alice@example.com',
      };
      expect(processor.extract(payload)).toEqual({
        email: 'alice@example.com',
      });
    });

    it('prefers the `changes` field when present (update events)', () => {
      const payload = {
        eventId: 'uuid-1',
        occurredAt: new Date().toISOString(),
        eventName: 'user.updated',
        aggregateId: 'uuid-2',
        tenantId: 'uuid-3',
        changes: { firstName: 'Bob' },
      };
      expect(processor.extract(payload)).toEqual({ firstName: 'Bob' });
    });

    it('returns undefined when only metadata keys are present (delete events)', () => {
      const payload = {
        eventId: 'uuid-1',
        occurredAt: new Date().toISOString(),
        eventName: 'user.deleted',
        aggregateId: 'uuid-2',
        tenantId: 'uuid-3',
      };
      expect(processor.extract(payload)).toBeUndefined();
    });

    it('returns roleId for role-assigned events', () => {
      const payload = {
        eventId: 'uuid-1',
        occurredAt: new Date().toISOString(),
        eventName: 'user.role-assigned',
        aggregateId: 'uuid-2',
        tenantId: 'uuid-3',
        roleId: 'role-uuid',
      };
      expect(processor.extract(payload)).toEqual({ roleId: 'role-uuid' });
    });
  });
});
