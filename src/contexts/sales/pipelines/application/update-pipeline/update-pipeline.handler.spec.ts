import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { Pipeline } from '../../domain/entities/pipeline.entity';
import { PipelineRepository } from '../../domain/repositories/pipeline.repository';
import { UpdatePipelineCommand } from './update-pipeline.command';
import { UpdatePipelineHandler } from './update-pipeline.handler';

const makePipeline = () => {
  const p = Pipeline.create({
    tenantId: TenantId('tenant-1'),
    name: 'Old Name',
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

describe('UpdatePipelineHandler', () => {
  it('updates pipeline name and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new UpdatePipelineHandler(repo, eventBus);
    await handler.execute(
      new UpdatePipelineCommand('pipe-1', 'tenant-1', { name: 'New Name' }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when pipeline not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new UpdatePipelineHandler(repo, eventBus);
    await expect(
      handler.execute(
        new UpdatePipelineCommand('missing', 'tenant-1', { name: 'X' }),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
