import { EventBus } from '@nestjs/cqrs';
import { PipelineRepository } from '../../domain/repositories/pipeline.repository';
import { CreatePipelineCommand } from './create-pipeline.command';
import { CreatePipelineHandler } from './create-pipeline.handler';

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: PipelineRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('CreatePipelineHandler', () => {
  it('creates pipeline and returns id', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreatePipelineHandler(repo, eventBus);
    const result = await handler.execute(
      new CreatePipelineCommand('tenant-1', 'Sales Pipeline', false, [
        { name: 'Prospecting', probability: 10, type: 'OPEN' },
        { name: 'Closed Won', probability: 100, type: 'WON' },
        { name: 'Lost', probability: 0, type: 'LOST' },
      ]),
    );
    expect(typeof result.id).toBe('string');
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('creates default pipeline', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreatePipelineHandler(repo, eventBus);
    const result = await handler.execute(
      new CreatePipelineCommand('tenant-1', 'Default', true, [
        { name: 'Lead', probability: 5, type: 'OPEN' },
        { name: 'Won', probability: 100, type: 'WON' },
        { name: 'Lost', probability: 0, type: 'LOST' },
      ]),
    );
    expect(result.id).toBeTruthy();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
