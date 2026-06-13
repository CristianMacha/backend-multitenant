import { randomUUID } from 'crypto';
import { StageId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';

export type StageType = 'OPEN' | 'WON' | 'LOST';

export interface StageProps {
  id: StageId;
  name: string;
  order: number;
  probability: number;
  type: StageType;
}

export interface CreateStageProps {
  name: string;
  order: number;
  probability: number;
  type: StageType;
}

/**
 * Aggregate-internal entity owned by Pipeline. Not an AggregateRoot: it never
 * emits events on its own and is persisted as part of the pipeline save.
 */
export class Stage {
  private constructor(private props: StageProps) {}

  static create(props: CreateStageProps): Stage {
    return Stage.rehydrate({ ...props, id: StageId(randomUUID()) });
  }

  static rehydrate(props: StageProps): Stage {
    const name = props.name.trim();
    if (!name) {
      throw new DomainException('Stage name is required', 'INVALID_STAGE');
    }
    if (props.probability < 0 || props.probability > 100) {
      throw new DomainException(
        'Stage probability must be between 0 and 100',
        'INVALID_STAGE',
      );
    }
    return new Stage({ ...props, name });
  }

  get id(): StageId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get order(): number {
    return this.props.order;
  }

  get probability(): number {
    return this.props.probability;
  }

  get type(): StageType {
    return this.props.type;
  }

  get isTerminal(): boolean {
    return this.props.type === 'WON' || this.props.type === 'LOST';
  }

  setOrder(order: number): void {
    this.props.order = order;
  }
}
