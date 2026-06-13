import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { StageId, TenantId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import { CreateStageProps, Stage, StageProps } from './stage.entity';
import {
  PipelineCreatedEvent,
  PipelineUpdatedEvent,
  StageAddedEvent,
  StageRemovedEvent,
  StagesReorderedEvent,
} from '../events/pipeline.events';

export interface PipelineProps extends BaseEntityProps {
  tenantId: TenantId;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}

export interface CreatePipelineProps {
  tenantId: TenantId;
  name: string;
  isDefault?: boolean;
  stages: CreateStageProps[];
}

export interface RehydratePipelineProps extends Omit<PipelineProps, 'stages'> {
  stages: StageProps[];
}

export class Pipeline extends AggregateRoot<PipelineProps> {
  private constructor(props: PipelineProps) {
    super(props);
  }

  static create(props: CreatePipelineProps): Pipeline {
    const name = props.name.trim();
    if (!name) {
      throw new DomainException(
        'Pipeline name is required',
        'INVALID_PIPELINE',
      );
    }
    const stages = props.stages.map((s) => Stage.create(s));
    Pipeline.assertStageInvariants(stages);

    const pipeline = new Pipeline({
      tenantId: props.tenantId,
      name,
      isDefault: props.isDefault ?? false,
      stages: Pipeline.normalizeOrder(stages),
    });
    pipeline.addDomainEvent(
      new PipelineCreatedEvent(
        pipeline.id,
        pipeline.tenantId,
        pipeline.name,
        pipeline.isDefault,
      ),
    );
    return pipeline;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: RehydratePipelineProps): Pipeline {
    return new Pipeline({
      ...props,
      stages: Pipeline.normalizeOrder(
        props.stages.map((s) => Stage.rehydrate(s)),
      ),
    });
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  /** Stages sorted by order. */
  get stages(): readonly Stage[] {
    return [...this.props.stages].sort((a, b) => a.order - b.order);
  }

  hasStage(stageId: StageId): boolean {
    return this.props.stages.some((s) => s.id === stageId);
  }

  getStage(stageId: StageId): Stage | undefined {
    return this.props.stages.find((s) => s.id === stageId);
  }

  update(changes: { name?: string; isDefault?: boolean }): void {
    this.assertNotDeleted();
    const applied: Record<string, unknown> = {};

    if (changes.name !== undefined) {
      const name = changes.name.trim();
      if (!name) {
        throw new DomainException(
          'Pipeline name is required',
          'INVALID_PIPELINE',
        );
      }
      this.props.name = name;
      applied.name = name;
    }
    if (changes.isDefault !== undefined) {
      this.props.isDefault = changes.isDefault;
      applied.isDefault = changes.isDefault;
    }

    if (Object.keys(applied).length === 0) return;
    this.touch();
    this.addDomainEvent(
      new PipelineUpdatedEvent(this.id, this.tenantId, applied),
    );
  }

  addStage(props: CreateStageProps): Stage {
    this.assertNotDeleted();
    const stage = Stage.create({
      ...props,
      order: this.props.stages.length,
    });
    this.props.stages = Pipeline.normalizeOrder([...this.props.stages, stage]);
    this.touch();
    this.addDomainEvent(new StageAddedEvent(this.id, this.tenantId, stage.id));
    return stage;
  }

  removeStage(stageId: StageId): void {
    this.assertNotDeleted();
    if (!this.hasStage(stageId)) {
      throw new DomainException('Stage not found', 'STAGE_NOT_FOUND');
    }
    const remaining = this.props.stages.filter((s) => s.id !== stageId);
    Pipeline.assertStageInvariants(remaining);
    this.props.stages = Pipeline.normalizeOrder(remaining);
    this.touch();
    this.addDomainEvent(new StageRemovedEvent(this.id, this.tenantId, stageId));
  }

  reorderStages(orderedStageIds: StageId[]): void {
    this.assertNotDeleted();
    const current = this.props.stages.map((s) => s.id);
    const sameSet =
      orderedStageIds.length === current.length &&
      current.every((id) => orderedStageIds.includes(id));
    if (!sameSet) {
      throw new DomainException(
        'Reorder must reference exactly the existing stages',
        'INVALID_STAGE_ORDER',
      );
    }
    orderedStageIds.forEach((id, index) => {
      this.getStage(id)!.setOrder(index);
    });
    this.touch();
    this.addDomainEvent(
      new StagesReorderedEvent(this.id, this.tenantId, orderedStageIds),
    );
  }

  delete(): void {
    this.assertNotDeleted();
    this.softDelete();
    this.addDomainEvent(
      new PipelineUpdatedEvent(this.id, this.tenantId, { deleted: true }),
    );
  }

  private assertNotDeleted(): void {
    if (this.isDeleted) {
      throw new DomainException(
        'Cannot modify a deleted pipeline',
        'PIPELINE_DELETED',
      );
    }
  }

  private static assertStageInvariants(stages: Stage[]): void {
    if (!stages.some((s) => s.type === 'WON')) {
      throw new DomainException(
        'Pipeline must have at least one WON stage',
        'INVALID_PIPELINE_STAGES',
      );
    }
    if (!stages.some((s) => s.type === 'LOST')) {
      throw new DomainException(
        'Pipeline must have at least one LOST stage',
        'INVALID_PIPELINE_STAGES',
      );
    }
  }

  /** Reassigns contiguous 0..n-1 order based on current order, stable. */
  private static normalizeOrder(stages: Stage[]): Stage[] {
    const sorted = [...stages].sort((a, b) => a.order - b.order);
    sorted.forEach((stage, index) => stage.setOrder(index));
    return sorted;
  }
}
