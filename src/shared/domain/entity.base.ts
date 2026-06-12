import { randomUUID } from 'crypto';

export interface BaseEntityProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export abstract class Entity<TProps extends BaseEntityProps> {
  protected readonly _id: string;
  protected props: TProps;

  protected constructor(props: TProps) {
    this._id = props.id ?? randomUUID();
    this.props = {
      ...props,
      id: this._id,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      deletedAt: props.deletedAt ?? null,
    };
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt != null;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  protected touch(): void {
    this.props.updatedAt = new Date();
  }

  equals(other?: Entity<TProps>): boolean {
    if (other == null) return false;
    return this._id === other._id;
  }
}
