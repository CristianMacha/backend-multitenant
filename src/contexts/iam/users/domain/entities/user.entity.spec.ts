import { User } from './user.entity';
import { DomainException } from '@shared/exceptions';
import {
  RoleAssignedEvent,
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from '../events/user.events';

const baseProps = {
  tenantId: 'tenant-1',
  firebaseUid: 'firebase-1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

describe('User aggregate', () => {
  describe('create', () => {
    it('creates an active user and emits UserCreatedEvent', () => {
      const user = User.create(baseProps);

      expect(user.id).toBeDefined();
      expect(user.isActive).toBe(true);
      expect(user.fullName).toBe('John Doe');

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
      expect(events[0].tenantId).toBe('tenant-1');
    });

    it('rejects invalid emails', () => {
      expect(() =>
        User.create({ ...baseProps, email: 'not-an-email' }),
      ).toThrow(DomainException);
    });
  });

  describe('update', () => {
    it('applies changes and emits UserUpdatedEvent', () => {
      const user = User.create(baseProps);
      user.pullDomainEvents();

      user.update({ firstName: 'Jane' });

      expect(user.firstName).toBe('Jane');
      const events = user.pullDomainEvents();
      expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
    });

    it('rejects updates on deleted users', () => {
      const user = User.create(baseProps);
      user.delete();

      expect(() => user.update({ firstName: 'Jane' })).toThrow(DomainException);
    });
  });

  describe('delete', () => {
    it('soft-deletes and emits UserDeletedEvent', () => {
      const user = User.create(baseProps);
      user.pullDomainEvents();

      user.delete();

      expect(user.isDeleted).toBe(true);
      expect(user.deletedAt).toBeInstanceOf(Date);
      expect(user.pullDomainEvents()[0]).toBeInstanceOf(UserDeletedEvent);
    });

    it('cannot be deleted twice', () => {
      const user = User.create(baseProps);
      user.delete();

      expect(() => user.delete()).toThrow(DomainException);
    });
  });

  describe('assignRole', () => {
    it('adds the role and emits RoleAssignedEvent', () => {
      const user = User.create(baseProps);
      user.pullDomainEvents();

      user.assignRole('role-1');

      expect(user.roleIds).toContain('role-1');
      const event = user.pullDomainEvents()[0] as RoleAssignedEvent;
      expect(event).toBeInstanceOf(RoleAssignedEvent);
      expect(event.roleId).toBe('role-1');
    });

    it('rejects duplicate role assignment', () => {
      const user = User.create(baseProps);
      user.assignRole('role-1');

      expect(() => user.assignRole('role-1')).toThrow(DomainException);
    });
  });
});
