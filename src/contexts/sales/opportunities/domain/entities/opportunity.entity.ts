import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import {
  AccountId,
  ContactId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { Money } from '@shared/domain/value-objects/money.vo';
import { DomainException } from '@shared/exceptions';
import {
  OpportunityAmountChangedEvent,
  OpportunityCreatedEvent,
  OpportunityLostEvent,
  OpportunityReassignedEvent,
  OpportunityStageChangedEvent,
  OpportunityUpdatedEvent,
  OpportunityWonEvent,
} from '../events/opportunity.events';

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface OpportunityProps extends BaseEntityProps {
  tenantId: TenantId;
  name: string;
  accountId: AccountId;
  contactId?: ContactId;
  pipelineId: PipelineId;
  stageId: StageId;
  amount: Money;
  expectedCloseDate?: Date;
  ownerId: UserId;
  status: OpportunityStatus;
  closedAt?: Date | null;
}

export interface CreateOpportunityProps {
  tenantId: TenantId;
  name: string;
  accountId: AccountId;
  contactId?: ContactId;
  pipelineId: PipelineId;
  stageId: StageId;
  /** Type of the initial stage, resolved from the pipeline by the handler. */
  stageType: OpportunityStatus;
  amount: number;
  currency: string;
  ownerId: UserId;
  expectedCloseDate?: Date;
}

export interface UpdateOpportunityProps {
  name?: string;
  contactId?: ContactId | null;
  expectedCloseDate?: Date | null;
}

export interface RehydrateOpportunityProps extends Omit<
  OpportunityProps,
  'amount'
> {
  amount: number;
  currency: string;
}

export class Opportunity extends AggregateRoot<OpportunityProps> {
  private constructor(props: OpportunityProps) {
    super(props);
  }

  static create(props: CreateOpportunityProps): Opportunity {
    const name = props.name.trim();
    if (!name) {
      throw new DomainException(
        'Opportunity name is required',
        'INVALID_OPPORTUNITY',
      );
    }
    const status = props.stageType;
    const opportunity = new Opportunity({
      tenantId: props.tenantId,
      name,
      accountId: props.accountId,
      contactId: props.contactId,
      pipelineId: props.pipelineId,
      stageId: props.stageId,
      amount: Money.of(props.amount, props.currency),
      expectedCloseDate: props.expectedCloseDate,
      ownerId: props.ownerId,
      status,
      closedAt: status === 'OPEN' ? null : new Date(),
    });
    opportunity.addDomainEvent(
      new OpportunityCreatedEvent(
        opportunity.id,
        opportunity.tenantId,
        opportunity.name,
        opportunity.accountId,
        opportunity.ownerId,
      ),
    );
    return opportunity;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: RehydrateOpportunityProps): Opportunity {
    return new Opportunity({
      ...props,
      amount: Money.of(props.amount, props.currency),
    });
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get accountId(): AccountId {
    return this.props.accountId;
  }

  get contactId(): ContactId | undefined {
    return this.props.contactId;
  }

  get pipelineId(): PipelineId {
    return this.props.pipelineId;
  }

  get stageId(): StageId {
    return this.props.stageId;
  }

  get amount(): number {
    return this.props.amount.amount;
  }

  get currency(): string {
    return this.props.amount.currency;
  }

  get expectedCloseDate(): Date | undefined {
    return this.props.expectedCloseDate;
  }

  get ownerId(): UserId {
    return this.props.ownerId;
  }

  get status(): OpportunityStatus {
    return this.props.status;
  }

  get closedAt(): Date | null {
    return this.props.closedAt ?? null;
  }

  moveToStage(stageId: StageId, stageType: OpportunityStatus): void {
    this.assertNotDeleted();
    if (this.props.stageId === stageId) return;

    this.props.stageId = stageId;
    this.props.status = stageType;
    this.props.closedAt = stageType === 'OPEN' ? null : new Date();
    this.touch();

    this.addDomainEvent(
      new OpportunityStageChangedEvent(
        this.id,
        this.tenantId,
        stageId,
        stageType,
      ),
    );
    if (stageType === 'WON') {
      this.addDomainEvent(
        new OpportunityWonEvent(
          this.id,
          this.tenantId,
          this.amount,
          this.currency,
        ),
      );
    } else if (stageType === 'LOST') {
      this.addDomainEvent(new OpportunityLostEvent(this.id, this.tenantId));
    }
  }

  changeAmount(amount: number, currency: string): void {
    this.assertNotDeleted();
    const money = Money.of(amount, currency);
    if (this.props.amount.equals(money)) return;
    this.props.amount = money;
    this.touch();
    this.addDomainEvent(
      new OpportunityAmountChangedEvent(
        this.id,
        this.tenantId,
        money.amount,
        money.currency,
      ),
    );
  }

  reassign(ownerId: UserId): void {
    this.assertNotDeleted();
    if (this.props.ownerId === ownerId) return;
    this.props.ownerId = ownerId;
    this.touch();
    this.addDomainEvent(
      new OpportunityReassignedEvent(this.id, this.tenantId, ownerId),
    );
  }

  update(changes: UpdateOpportunityProps): void {
    this.assertNotDeleted();
    const applied: Record<string, unknown> = {};

    if (changes.name !== undefined) {
      const name = changes.name.trim();
      if (!name) {
        throw new DomainException(
          'Opportunity name is required',
          'INVALID_OPPORTUNITY',
        );
      }
      this.props.name = name;
      applied.name = name;
    }
    if (changes.contactId !== undefined) {
      this.props.contactId = changes.contactId ?? undefined;
      applied.contactId = this.props.contactId ?? null;
    }
    if (changes.expectedCloseDate !== undefined) {
      this.props.expectedCloseDate = changes.expectedCloseDate ?? undefined;
      applied.expectedCloseDate =
        this.props.expectedCloseDate?.toISOString() ?? null;
    }

    if (Object.keys(applied).length === 0) return;
    this.touch();
    this.addDomainEvent(
      new OpportunityUpdatedEvent(this.id, this.tenantId, applied),
    );
  }

  /** Clears a dangling contact reference (reaction to crm ContactDeleted). */
  clearContact(): void {
    if (this.props.contactId === undefined) return;
    this.props.contactId = undefined;
    this.touch();
    this.addDomainEvent(
      new OpportunityUpdatedEvent(this.id, this.tenantId, { contactId: null }),
    );
  }

  delete(): void {
    this.assertNotDeleted();
    this.softDelete();
    this.addDomainEvent(
      new OpportunityUpdatedEvent(this.id, this.tenantId, { deleted: true }),
    );
  }

  private assertNotDeleted(): void {
    if (this.isDeleted) {
      throw new DomainException(
        'Cannot modify a deleted opportunity',
        'OPPORTUNITY_DELETED',
      );
    }
  }
}
