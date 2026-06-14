import { TenantId } from '@shared/domain/types';
import { Product } from '../../domain/entities/product.entity';
import { ProductMapper } from './product.mapper';

const rawProduct = {
  id: 'prod-1',
  tenantId: 'tenant-1',
  name: 'Widget Pro',
  description: 'A great widget',
  type: 'PRODUCT' as const,
  category: 'Electronics',
  unitPrice: 99.99 as unknown as import('@prisma/client').Prisma.Decimal,
  currency: 'USD',
  unitOfMeasure: 'unit',
  status: 'ACTIVE' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
};

describe('ProductMapper', () => {
  describe('toDomain', () => {
    it('maps a PrismaProduct to a Product aggregate', () => {
      const product = ProductMapper.toDomain(rawProduct);

      expect(product.id).toBe('prod-1');
      expect(product.tenantId).toBe('tenant-1');
      expect(product.name).toBe('Widget Pro');
      expect(product.description).toBe('A great widget');
      expect(product.type).toBe('PRODUCT');
      expect(product.category).toBe('Electronics');
      expect(product.unitOfMeasure).toBe('unit');
      expect(product.status).toBe('ACTIVE');
    });

    it('preserves Money (unitPrice + currency) correctly (R29)', () => {
      const product = ProductMapper.toDomain(rawProduct);

      expect(product.unitPrice.amount).toBe(99.99);
      expect(product.unitPrice.currency).toBe('USD');
    });

    it('handles null description and category', () => {
      const product = ProductMapper.toDomain({
        ...rawProduct,
        description: null,
        category: null,
      });

      expect(product.description).toBeUndefined();
      expect(product.category).toBeUndefined();
    });

    it('does not emit domain events on rehydration', () => {
      const product = ProductMapper.toDomain(rawProduct);
      expect(product.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('toPersistence', () => {
    it('maps a Product aggregate to persistence data', () => {
      const product = Product.create({
        tenantId: TenantId('tenant-1'),
        name: 'Consulting Service',
        type: 'SERVICE',
        unitPriceAmount: 150,
        unitPriceCurrency: 'EUR',
        unitOfMeasure: 'hour',
        description: 'Expert consulting',
        category: 'Services',
      });

      const data = ProductMapper.toPersistence(product);

      expect(data.tenantId).toBe('tenant-1');
      expect(data.name).toBe('Consulting Service');
      expect(data.type).toBe('SERVICE');
      expect(data.unitPrice).toBe(150);
      expect(data.currency).toBe('EUR');
      expect(data.unitOfMeasure).toBe('hour');
      expect(data.description).toBe('Expert consulting');
      expect(data.category).toBe('Services');
      expect(data.status).toBe('ACTIVE');
    });

    it('round-trips domain ↔ persistence for Money (R29)', () => {
      const original = Product.create({
        tenantId: TenantId('tenant-1'),
        name: 'Widget',
        type: 'PRODUCT',
        unitPriceAmount: 49.99,
        unitPriceCurrency: 'GBP',
        unitOfMeasure: 'unit',
      });

      const data = ProductMapper.toPersistence(original);
      const rehydrated = ProductMapper.toDomain({
        ...rawProduct,
        id: original.id,
        tenantId: 'tenant-1',
        name: 'Widget',
        unitPrice:
          data.unitPrice as unknown as import('@prisma/client').Prisma.Decimal,
        currency: data.currency,
        type: 'PRODUCT',
        status: 'ACTIVE',
        description: null,
        category: null,
        unitOfMeasure: 'unit',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      expect(rehydrated.unitPrice.amount).toBe(49.99);
      expect(rehydrated.unitPrice.currency).toBe('GBP');
    });
  });
});
