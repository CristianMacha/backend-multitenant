import { DomainException } from '@shared/exceptions';
import { Stage } from './stage.entity';

describe('Stage', () => {
  it('creates a valid OPEN stage', () => {
    const stage = Stage.create({
      name: 'New',
      order: 0,
      probability: 50,
      type: 'OPEN',
    });
    expect(stage.name).toBe('New');
    expect(stage.order).toBe(0);
    expect(stage.probability).toBe(50);
    expect(stage.type).toBe('OPEN');
    expect(stage.isTerminal).toBe(false);
  });

  it('WON stage is terminal', () => {
    const stage = Stage.create({
      name: 'Won',
      order: 1,
      probability: 100,
      type: 'WON',
    });
    expect(stage.isTerminal).toBe(true);
  });

  it('LOST stage is terminal', () => {
    const stage = Stage.create({
      name: 'Lost',
      order: 2,
      probability: 0,
      type: 'LOST',
    });
    expect(stage.isTerminal).toBe(true);
  });

  it('rejects empty stage name', () => {
    expect(() =>
      Stage.create({ name: '  ', order: 0, probability: 10, type: 'OPEN' }),
    ).toThrow(DomainException);
  });

  it('rejects probability below 0', () => {
    expect(() =>
      Stage.create({ name: 'Stage', order: 0, probability: -1, type: 'OPEN' }),
    ).toThrow(DomainException);
  });

  it('rejects probability above 100', () => {
    expect(() =>
      Stage.create({ name: 'Stage', order: 0, probability: 101, type: 'OPEN' }),
    ).toThrow(DomainException);
  });

  it('setOrder updates the stage order', () => {
    const stage = Stage.create({
      name: 'Stage',
      order: 0,
      probability: 50,
      type: 'OPEN',
    });
    stage.setOrder(5);
    expect(stage.order).toBe(5);
  });
});
