import { Prisma } from '@prisma/client';
import {
  AccountId,
  PipelineId,
  StageId,
  TenantId,
  UserId,
} from '@shared/domain/types';
import { Opportunity } from '../../domain/entities/opportunity.entity';
import { OpportunityMapper } from './opportunity.mapper';

const makeRaw = () => ({
  id: 'opp-1',
  tenantId: 'tenant-1',
  name: 'Deal A',
  accountId: 'acct-1',
  contactId: null,
  pipelineId: 'pipe-1',
  stageId: 'stage-1',
  amount: { toNumber: () => 5000 },
  currency: 'USD',
  expectedCloseDate: null,
  ownerId: 'owner-1',
  status: 'OPEN',
  closedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
});

describe('OpportunityMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row to Opportunity aggregate', () => {
      const opp = OpportunityMapper.toDomain(makeRaw() as never);
      expect(opp.id).toBe('opp-1');
      expect(opp.name).toBe('Deal A');
      expect(opp.amount).toBe(5000);
      expect(opp.contactId).toBeUndefined();
    });

    it('handles optional contactId', () => {
      const raw = { ...makeRaw(), contactId: 'contact-1' };
      const opp = OpportunityMapper.toDomain(raw as never);
      expect(opp.contactId).toBe('contact-1');
    });
  });

  describe('toPersistence', () => {
    it('maps Opportunity aggregate to persistence shape', () => {
      const opp = Opportunity.create({
        tenantId: TenantId('tenant-1'),
        name: 'Deal A',
        accountId: AccountId('acct-1'),
        pipelineId: PipelineId('pipe-1'),
        stageId: StageId('stage-1'),
        stageType: 'OPEN',
        amount: 5000,
        currency: 'USD',
        ownerId: UserId('owner-1'),
      });
      opp.pullDomainEvents();
      const row = OpportunityMapper.toPersistence(opp);
      expect(row.name).toBe('Deal A');
      expect(row.tenantId).toBe('tenant-1');
      expect(row.amount).toBeInstanceOf(Prisma.Decimal);
    });
  });
});
