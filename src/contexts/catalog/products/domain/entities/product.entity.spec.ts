import { DomainException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { Product } from './product.entity';
import {
  ProductArchivedEvent,
  ProductCreatedEvent,
  ProductUpdatedEvent,
} from '../events/product.events';

const baseProps = {
  tenantId: TenantId('tenant-1'),
  name: 'Widget Pro',
  type: 'PRODUCT' as const,
  unitPriceAmount: 99.99,
  unitPriceCurrency: 'USD',
  unitOfMeasure: 'unit',
};

describe('Product aggregate', () => {
  describe('create', () => {
    it('creates an active product and emits ProductCreatedEvent', () => {
      const product = Product.create(baseProps);

      expect(product.id).toBeDefined();
      expect(product.status).toBe('ACTIVE');
      expect(product.name).toBe('Widget Pro');
      expect(product.type).toBe('PRODUCT');

      const events = product.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProductCreatedEvent);
      const evt = events[0] as ProductCreatedEvent;
      expect(evt.tenantId).toBe('tenant-1');
      expect(evt.name).toBe('Widget Pro');
      expect(evt.type).toBe('PRODUCT');
    });

    it('assigns the tenantId from props', () => {
      const product = Product.create(baseProps);
      expect(product.tenantId).toBe('tenant-1');
    });

    it('sets unitPrice amount and currency correctly', () => {
      const product = Product.create(baseProps);
      expect(product.unitPrice.amount).toBe(99.99);
      expect(product.unitPrice.currency).toBe('USD');
    });

    it('trims the name', () => {
      const product = Product.create({ ...baseProps, name: '  Widget  ' });
      expect(product.name).toBe('Widget');
    });
  });

  describe('create — validation (R3, R4, R5)', () => {
    it('rejects empty name', () => {
      expect(() => Product.create({ ...baseProps, name: '   ' })).toThrow(
        DomainException,
      );
    });

    it('rejects negative unitPrice amount', () => {
      expect(() =>
        Product.create({ ...baseProps, unitPriceAmount: -1 }),
      ).toThrow(DomainException);
    });

    it('rejects unitPrice amount with more than 2 decimals', () => {
      expect(() =>
        Product.create({ ...baseProps, unitPriceAmount: 9.999 }),
      ).toThrow(DomainException);
    });

    it('rejects invalid currency code', () => {
      expect(() =>
        Product.create({ ...baseProps, unitPriceCurrency: 'XX' }),
      ).toThrow(DomainException);
    });

    it('normalizes lowercase currency to uppercase (Money VO behavior)', () => {
      // Money.of() normalizes via toUpperCase() before validation, so 'usd' → 'USD' is valid
      const product = Product.create({
        ...baseProps,
        unitPriceCurrency: 'usd',
      });
      expect(product.unitPrice.currency).toBe('USD');
    });
  });

  describe('update (R16, R17, R18)', () => {
    it('applies changes and emits ProductUpdatedEvent', () => {
      const product = Product.create(baseProps);
      product.pullDomainEvents();

      product.update({ name: 'Widget Ultra' });

      expect(product.name).toBe('Widget Ultra');
      const events = product.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProductUpdatedEvent);
      const evt = events[0] as ProductUpdatedEvent;
      expect(evt.changes).toMatchObject({ name: 'Widget Ultra' });
    });

    it('emits no event when no fields change', () => {
      const product = Product.create(baseProps);
      product.pullDomainEvents();

      product.update({});

      const events = product.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('updates unitPrice', () => {
      const product = Product.create(baseProps);
      product.pullDomainEvents();

      product.update({ unitPriceAmount: 50, unitPriceCurrency: 'EUR' });

      expect(product.unitPrice.amount).toBe(50);
      expect(product.unitPrice.currency).toBe('EUR');
    });

    it('clears optional fields with null', () => {
      const product = Product.create({
        ...baseProps,
        description: 'desc',
        category: 'cat',
      });
      product.pullDomainEvents();

      product.update({ description: null, category: null });

      expect(product.description).toBeUndefined();
      expect(product.category).toBeUndefined();
    });

    it('rejects update on archived product (R18)', () => {
      const product = Product.create(baseProps);
      product.archive();

      expect(() => product.update({ name: 'New Name' })).toThrow(
        DomainException,
      );
    });

    it('rejects empty name on update', () => {
      const product = Product.create(baseProps);
      product.pullDomainEvents();

      expect(() => product.update({ name: '  ' })).toThrow(DomainException);
    });
  });

  describe('archive (R21, R22, R23)', () => {
    it('soft-deletes, sets status=ARCHIVED and emits ProductArchivedEvent', () => {
      const product = Product.create(baseProps);
      product.pullDomainEvents();

      product.archive();

      expect(product.isArchived).toBe(true);
      expect(product.status).toBe('ARCHIVED');
      expect(product.isDeleted).toBe(true);
      expect(product.deletedAt).toBeInstanceOf(Date);

      const events = product.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProductArchivedEvent);
    });

    it('rejects double archive (R23)', () => {
      const product = Product.create(baseProps);
      product.archive();

      expect(() => product.archive()).toThrow(DomainException);
    });
  });

  describe('fromPersistence', () => {
    it('rehydrates without emitting events', () => {
      const product = Product.fromPersistence({
        id: 'prod-1',
        tenantId: TenantId('tenant-1'),
        name: 'Widget',
        type: 'SERVICE',
        unitPriceAmount: 10,
        unitPriceCurrency: 'EUR',
        unitOfMeasure: 'hour',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      expect(product.id).toBe('prod-1');
      expect(product.unitPrice.amount).toBe(10);
      expect(product.unitPrice.currency).toBe('EUR');
      const events = product.pullDomainEvents();
      expect(events).toHaveLength(0);
    });
  });
});
