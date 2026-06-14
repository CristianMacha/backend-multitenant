import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { TenantId } from '@shared/domain/types';
import { Money } from '@shared/domain/value-objects/money.vo';
import { DomainException } from '@shared/exceptions';
import {
  ProductArchivedEvent,
  ProductCreatedEvent,
  ProductUpdatedEvent,
} from '../events/product.events';

export type ProductType = 'PRODUCT' | 'SERVICE';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProductProps extends BaseEntityProps {
  tenantId: TenantId;
  name: string;
  description?: string;
  type: ProductType;
  category?: string;
  unitPrice: Money;
  unitOfMeasure: string;
  status: ProductStatus;
}

/** Raw props for create — Money is validated inside. */
export interface CreateProductProps {
  tenantId: TenantId;
  name: string;
  type: ProductType;
  unitPriceAmount: number;
  unitPriceCurrency: string;
  unitOfMeasure: string;
  description?: string;
  category?: string;
}

/** Mutable fields. `null` clears an optional field; `undefined` leaves it unchanged. */
export interface UpdateProductProps {
  name?: string;
  description?: string | null;
  category?: string | null;
  unitPriceAmount?: number;
  unitPriceCurrency?: string;
  unitOfMeasure?: string;
}

/** Props for rehydrating from persistence — Money fields come as raw numbers/strings. */
export interface RehydrateProductProps extends Omit<ProductProps, 'unitPrice'> {
  unitPriceAmount: number;
  unitPriceCurrency: string;
}

export class Product extends AggregateRoot<ProductProps> {
  private constructor(props: ProductProps) {
    super(props);
  }

  static create(props: CreateProductProps): Product {
    const name = props.name.trim();
    if (!name) {
      throw new DomainException('Product name is required', 'INVALID_PRODUCT');
    }

    const unitPrice = Money.of(props.unitPriceAmount, props.unitPriceCurrency);

    const product = new Product({
      tenantId: props.tenantId,
      name,
      description: props.description?.trim() || undefined,
      type: props.type,
      category: props.category?.trim() || undefined,
      unitPrice,
      unitOfMeasure: props.unitOfMeasure,
      status: 'ACTIVE',
    });

    product.addDomainEvent(
      new ProductCreatedEvent(
        product.id,
        product.tenantId,
        product.name,
        product.type,
      ),
    );

    return product;
  }

  /** Rehydrates the aggregate from persistence without emitting events. */
  static fromPersistence(props: RehydrateProductProps): Product {
    const unitPrice = Money.of(props.unitPriceAmount, props.unitPriceCurrency);
    return new Product({ ...props, unitPrice });
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): ProductType {
    return this.props.type;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get unitOfMeasure(): string {
    return this.props.unitOfMeasure;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get isArchived(): boolean {
    return this.props.status === 'ARCHIVED';
  }

  update(changes: UpdateProductProps): void {
    this.assertActive();

    const applied: Record<string, unknown> = {};

    if (changes.name !== undefined) {
      const name = changes.name.trim();
      if (!name) {
        throw new DomainException(
          'Product name is required',
          'INVALID_PRODUCT',
        );
      }
      this.props.name = name;
      applied.name = name;
    }

    if (changes.description !== undefined) {
      this.props.description = changes.description?.trim() || undefined;
      applied.description = this.props.description ?? null;
    }

    if (changes.category !== undefined) {
      this.props.category = changes.category?.trim() || undefined;
      applied.category = this.props.category ?? null;
    }

    if (
      changes.unitPriceAmount !== undefined ||
      changes.unitPriceCurrency !== undefined
    ) {
      const amount = changes.unitPriceAmount ?? this.props.unitPrice.amount;
      const currency =
        changes.unitPriceCurrency ?? this.props.unitPrice.currency;
      this.props.unitPrice = Money.of(amount, currency);
      applied.unitPrice = {
        amount: this.props.unitPrice.amount,
        currency: this.props.unitPrice.currency,
      };
    }

    if (changes.unitOfMeasure !== undefined) {
      this.props.unitOfMeasure = changes.unitOfMeasure;
      applied.unitOfMeasure = changes.unitOfMeasure;
    }

    if (Object.keys(applied).length === 0) return;

    this.touch();
    this.addDomainEvent(
      new ProductUpdatedEvent(this.id, this.tenantId, applied),
    );
  }

  archive(): void {
    if (this.isArchived) {
      throw new DomainException(
        'Product is already archived',
        'PRODUCT_ALREADY_ARCHIVED',
      );
    }
    this.props.status = 'ARCHIVED';
    this.softDelete();
    this.addDomainEvent(new ProductArchivedEvent(this.id, this.tenantId));
  }

  private assertActive(): void {
    if (this.isArchived || this.isDeleted) {
      throw new DomainException(
        'Cannot modify an archived product',
        'PRODUCT_ARCHIVED',
      );
    }
  }
}
