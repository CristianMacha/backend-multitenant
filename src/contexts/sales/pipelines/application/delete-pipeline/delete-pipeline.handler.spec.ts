import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { Pipeline } from '../../domain/entities/pipeline.entity';
import { PipelineRepository } from '../../domain/repositories/pipeline.repository';
import { DeletePipelineCommand } from './delete-pipeline.command';
import { DeletePipelineHandler } from './delete-pipeline.handler';

const makePipeline = () => {
  const p = Pipeline.create({
    tenantId: TenantId('tenant-1'),
    name: 'Test Pipeline',
    stages: [
      { name: 'Lead', order: 0, probability: 10, type: 'OPEN' },
      { name: 'Won', order: 1, probability: 100, type: 'WON' },
      { name: 'Lost', order: 2, probability: 0, type: 'LOST' },
    ],
  });
  p.pullDomainEvents();
  return p;
};

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: PipelineRepository = {
    findById: jest.fn().mockResolvedValue(makePipeline()),
    findAll: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('DeletePipelineHandler', () => {
  it('deletes pipeline and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new DeletePipelineHandler(repo, eventBus);
    await handler.execute(new DeletePipelineCommand('pipe-1', 'tenant-1'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when pipeline not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new DeletePipelineHandler(repo, eventBus);
    await expect(
      handler.execute(new DeletePipelineCommand('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
