import { PipelineMapper } from './pipeline.mapper';

const makeRaw = () => ({
  id: 'pipe-1',
  tenantId: 'tenant-1',
  name: 'Sales Pipeline',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
  stages: [
    { id: 'stage-1', name: 'Lead', order: 0, probability: 10, type: 'OPEN' },
    { id: 'stage-2', name: 'Won', order: 1, probability: 100, type: 'WON' },
    { id: 'stage-3', name: 'Lost', order: 2, probability: 0, type: 'LOST' },
  ],
});

describe('PipelineMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row (with stages) to Pipeline aggregate', () => {
      const pipeline = PipelineMapper.toDomain(makeRaw() as never);
      expect(pipeline.id).toBe('pipe-1');
      expect(pipeline.name).toBe('Sales Pipeline');
      expect(pipeline.isDefault).toBe(true);
      expect(pipeline.stages).toHaveLength(3);
    });

    it('preserves stage order', () => {
      const pipeline = PipelineMapper.toDomain(makeRaw() as never);
      const sorted = pipeline.stages.map((s) => s.name);
      expect(sorted[0]).toBe('Lead');
    });
  });
});
