import {
  AccountId,
  ContactId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import { Opportunity } from './opportunity.entity';
import {
  OpportunityAmountChangedEvent,
  OpportunityCreatedEvent,
  OpportunityLostEvent,
  OpportunityReassignedEvent,
  OpportunityStageChangedEvent,
  OpportunityWonEvent,
} from '../events/opportunity.events';

const makeOpportunity = () =>
  Opportunity.create({
    tenantId: TenantId('tenant-1'),
    ownerId: UserId('owner-1'),
    name: 'Acme renewal',
    accountId: AccountId('acc-1'),
    pipelineId: PipelineId('pipe-1'),
    stageId: StageId('stage-open'),
    stageType: 'OPEN',
    amount: 1000,
    currency: 'USD',
  });

describe('Opportunity', () => {
  it('creates OPEN with no closedAt and emits OpportunityCreated', () => {
    const opp = makeOpportunity();
    expect(opp.status).toBe('OPEN');
    expect(opp.closedAt).toBeNull();
    expect(opp.domainEvents[0]).toBeInstanceOf(OpportunityCreatedEvent);
  });

  it('moves to a WON stage, setting status/closedAt and emitting won events', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.moveToStage(StageId('stage-won'), 'WON');
    expect(opp.status).toBe('WON');
    expect(opp.closedAt).toBeInstanceOf(Date);
    const events = opp.pullDomainEvents();
    expect(events[0]).toBeInstanceOf(OpportunityStageChangedEvent);
    expect(events[1]).toBeInstanceOf(OpportunityWonEvent);
  });

  it('moves to a LOST stage', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.moveToStage(StageId('stage-lost'), 'LOST');
    expect(opp.status).toBe('LOST');
    expect(opp.pullDomainEvents()[1]).toBeInstanceOf(OpportunityLostEvent);
  });

  it('reopens (clears closedAt) when moved back to an OPEN stage', () => {
    const opp = makeOpportunity();
    opp.moveToStage(StageId('stage-won'), 'WON');
    opp.pullDomainEvents();
    opp.moveToStage(StageId('stage-open-2'), 'OPEN');
    expect(opp.status).toBe('OPEN');
    expect(opp.closedAt).toBeNull();
  });

  it('changes amount and emits OpportunityAmountChanged', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.changeAmount(2000, 'USD');
    expect(opp.amount).toBe(2000);
    expect(opp.pullDomainEvents()[0]).toBeInstanceOf(
      OpportunityAmountChangedEvent,
    );
  });

  it('is a no-op when the amount does not change', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.changeAmount(1000, 'USD');
    expect(opp.pullDomainEvents()).toHaveLength(0);
  });

  it('reassigns the owner', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.reassign(UserId('owner-2'));
    expect(opp.ownerId).toBe('owner-2');
    expect(opp.pullDomainEvents()[0]).toBeInstanceOf(
      OpportunityReassignedEvent,
    );
  });

  it('clears a dangling contact reference', () => {
    const opp = Opportunity.create({
      tenantId: TenantId('tenant-1'),
      ownerId: UserId('owner-1'),
      name: 'Acme renewal',
      accountId: AccountId('acc-1'),
      contactId: ContactId('contact-1'),
      pipelineId: PipelineId('pipe-1'),
      stageId: StageId('stage-open'),
      stageType: 'OPEN',
      amount: 1000,
      currency: 'USD',
    });
    opp.pullDomainEvents();
    opp.clearContact();
    expect(opp.contactId).toBeUndefined();
    expect(opp.pullDomainEvents()).toHaveLength(1);
  });

  it('rejects a blank name', () => {
    expect(() =>
      Opportunity.create({
        tenantId: TenantId('tenant-1'),
        ownerId: UserId('owner-1'),
        name: '  ',
        accountId: AccountId('acc-1'),
        pipelineId: PipelineId('pipe-1'),
        stageId: StageId('stage-open'),
        stageType: 'OPEN',
        amount: 1000,
        currency: 'USD',
      }),
    ).toThrow(DomainException);
  });

  it('update() with name, contactId, expectedCloseDate', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.update({
      name: 'Renamed',
      contactId: ContactId('contact-1'),
      expectedCloseDate: new Date('2025-12-31'),
    });
    expect(opp.contactId).toBe('contact-1');
    const events = opp.pullDomainEvents();
    expect(events).toHaveLength(1);
  });

  it('update() is no-op when nothing changes', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.update({});
    expect(opp.pullDomainEvents()).toHaveLength(0);
  });

  it('update() rejects empty name', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    expect(() => opp.update({ name: '' })).toThrow(DomainException);
  });

  it('reassign() is no-op when owner is the same', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.reassign(UserId('owner-1'));
    expect(opp.pullDomainEvents()).toHaveLength(0);
  });

  it('moveToStage() is no-op when stage does not change', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.moveToStage(StageId('stage-open'), 'OPEN');
    expect(opp.pullDomainEvents()).toHaveLength(0);
  });

  it('clearContact() is no-op when there is no contact', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.clearContact();
    expect(opp.pullDomainEvents()).toHaveLength(0);
  });

  it('delete() soft-deletes and blocks further mutations', () => {
    const opp = makeOpportunity();
    opp.pullDomainEvents();
    opp.delete();
    expect(opp.isDeleted).toBe(true);
    expect(() => opp.update({ name: 'x' })).toThrow(DomainException);
  });
});
