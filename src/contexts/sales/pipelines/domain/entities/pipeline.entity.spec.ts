import { TenantId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import { Pipeline } from './pipeline.entity';
import {
  PipelineCreatedEvent,
  StageAddedEvent,
  StageRemovedEvent,
  StagesReorderedEvent,
} from '../events/pipeline.events';

const baseStages = () => [
  { name: 'New', order: 0, probability: 10, type: 'OPEN' as const },
  { name: 'Won', order: 1, probability: 100, type: 'WON' as const },
  { name: 'Lost', order: 2, probability: 0, type: 'LOST' as const },
];

const makePipeline = () =>
  Pipeline.create({
    tenantId: TenantId('tenant-1'),
    name: 'Default',
    isDefault: true,
    stages: baseStages(),
  });

describe('Pipeline', () => {
  it('creates with contiguous order and emits PipelineCreated', () => {
    const pipeline = makePipeline();
    expect(pipeline.stages.map((s) => s.order)).toEqual([0, 1, 2]);
    expect(pipeline.domainEvents[0]).toBeInstanceOf(PipelineCreatedEvent);
  });

  it('requires at least one WON and one LOST stage', () => {
    expect(() =>
      Pipeline.create({
        tenantId: TenantId('tenant-1'),
        name: 'Bad',
        stages: [{ name: 'New', order: 0, probability: 10, type: 'OPEN' }],
      }),
    ).toThrow(DomainException);
  });

  it('adds a stage at the end', () => {
    const pipeline = makePipeline();
    pipeline.pullDomainEvents();
    const stage = pipeline.addStage({
      name: 'Negotiation',
      order: 0,
      probability: 60,
      type: 'OPEN',
    });
    expect(pipeline.stages).toHaveLength(4);
    expect(pipeline.getStage(stage.id)!.order).toBe(3);
    expect(pipeline.pullDomainEvents()[0]).toBeInstanceOf(StageAddedEvent);
  });

  it('blocks removing the last WON stage', () => {
    const pipeline = makePipeline();
    const won = pipeline.stages.find((s) => s.type === 'WON')!;
    expect(() => pipeline.removeStage(won.id)).toThrow(DomainException);
  });

  it('removes a non-terminal stage and renumbers', () => {
    const pipeline = makePipeline();
    pipeline.addStage({
      name: 'Negotiation',
      order: 0,
      probability: 60,
      type: 'OPEN',
    });
    pipeline.pullDomainEvents();
    const open = pipeline.stages.find((s) => s.name === 'New')!;
    pipeline.removeStage(open.id);
    expect(pipeline.stages.map((s) => s.order)).toEqual([0, 1, 2]);
    expect(pipeline.pullDomainEvents()[0]).toBeInstanceOf(StageRemovedEvent);
  });

  it('reorders stages by the given id sequence', () => {
    const pipeline = makePipeline();
    pipeline.pullDomainEvents();
    const ids = pipeline.stages.map((s) => s.id);
    const reversed = [...ids].reverse();
    pipeline.reorderStages(reversed);
    expect(pipeline.stages.map((s) => s.id)).toEqual(reversed);
    expect(pipeline.pullDomainEvents()[0]).toBeInstanceOf(StagesReorderedEvent);
  });

  it('rejects a reorder that is not the full stage set', () => {
    const pipeline = makePipeline();
    const ids = pipeline.stages.map((s) => s.id);
    expect(() => pipeline.reorderStages([ids[0]])).toThrow(DomainException);
  });
});
