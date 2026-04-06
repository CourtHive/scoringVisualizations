import { describe, it, expect, vi } from 'vitest';
import { LiveEngine } from '../engine/LiveEngine';

import { scoreGovernor } from 'tods-competition-factory';

const { ScoringEngine } = scoreGovernor;

describe('LiveEngine', () => {
  function makeLive() {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    return new LiveEngine(engine);
  }

  it('notifies subscribers after addPoint', () => {
    const live = makeLive();
    const cb = vi.fn();
    live.subscribe(cb);

    live.addPoint({ winner: 0 });
    expect(cb).toHaveBeenCalledTimes(1);

    const state = cb.mock.calls[0][0];
    expect(state.history.points).toHaveLength(1);
  });

  it('notifies after undo', () => {
    const live = makeLive();
    live.addPoint({ winner: 0 });
    live.addPoint({ winner: 1 });

    const cb = vi.fn();
    live.subscribe(cb);

    const result = live.undo();
    expect(result).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);

    const state = cb.mock.calls[0][0];
    expect(state.history.points).toHaveLength(1);
  });

  it('notifies after redo', () => {
    const live = makeLive();
    live.addPoint({ winner: 0 });
    live.addPoint({ winner: 1 });
    live.undo();

    const cb = vi.fn();
    live.subscribe(cb);

    const result = live.redo();
    expect(result).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);

    const state = cb.mock.calls[0][0];
    expect(state.history.points).toHaveLength(2);
  });

  it('notifies after editPoint', () => {
    const live = makeLive();
    live.addPoint({ winner: 0, server: 0 });

    const cb = vi.fn();
    live.subscribe(cb);

    live.editPoint(0, { winner: 1 });
    expect(cb).toHaveBeenCalledTimes(1);

    const state = cb.mock.calls[0][0];
    expect(state.history.points[0].winner).toBe(1);
  });

  it('notifies after reset', () => {
    const live = makeLive();
    live.addPoint({ winner: 0 });

    const cb = vi.fn();
    live.subscribe(cb);

    live.reset();
    expect(cb).toHaveBeenCalledTimes(1);

    const state = cb.mock.calls[0][0];
    const points = state.history?.points ?? [];
    expect(points).toHaveLength(0);
  });

  it('unsubscribe stops notifications', () => {
    const live = makeLive();
    const cb = vi.fn();
    const unsub = live.subscribe(cb);

    live.addPoint({ winner: 0 });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    live.addPoint({ winner: 1 });
    expect(cb).toHaveBeenCalledTimes(1); // no additional call
  });

  it('does not notify when undo has nothing to undo', () => {
    const live = makeLive();
    const cb = vi.fn();
    live.subscribe(cb);

    const result = live.undo();
    expect(result).toBe(false);
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not notify when redo has nothing to redo', () => {
    const live = makeLive();
    const cb = vi.fn();
    live.subscribe(cb);

    const result = live.redo();
    expect(result).toBe(false);
    expect(cb).not.toHaveBeenCalled();
  });

  it('state is consistent after undo+redo cycle', () => {
    const live = makeLive();

    // Add 5 points
    for (let i = 0; i < 5; i++) {
      live.addPoint({ winner: (i % 2) as 0 | 1 });
    }
    const stateAfter5 = live.getPointCount();
    expect(stateAfter5).toBe(5);

    // Undo 3
    live.undo();
    live.undo();
    live.undo();
    expect(live.getPointCount()).toBe(2);

    // Redo 2
    live.redo();
    live.redo();
    expect(live.getPointCount()).toBe(4);

    // Verify canUndo/canRedo
    expect(live.canUndo()).toBe(true);
    expect(live.canRedo()).toBe(true);
  });

  it('query methods work correctly', () => {
    const live = makeLive();

    expect(live.getPointCount()).toBe(0);
    expect(live.isComplete()).toBe(false);
    expect(live.canUndo()).toBe(false);
    expect(live.canRedo()).toBe(false);

    live.addPoint({ winner: 0 });
    expect(live.getPointCount()).toBe(1);
    expect(live.canUndo()).toBe(true);
  });

  it('multiple subscribers all receive notifications', () => {
    const live = makeLive();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cb3 = vi.fn();

    live.subscribe(cb1);
    live.subscribe(cb2);
    live.subscribe(cb3);

    live.addPoint({ winner: 0 });

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(1);
  });

  it('constructs with default engine when none provided', () => {
    const live = new LiveEngine();
    expect(live.getPointCount()).toBe(0);
    live.addPoint({ winner: 0 });
    expect(live.getPointCount()).toBe(1);
  });

  it('getState returns full matchUp state', () => {
    const live = makeLive();
    live.addPoint({ winner: 0, server: 0 });

    const state = live.getState();
    expect(state).toHaveProperty('history');
    expect(state).toHaveProperty('score');
    expect(state.history.points).toHaveLength(1);
  });

  it('getScoreboard returns a score string', () => {
    const live = makeLive();
    live.addPoint({ winner: 0, server: 0 });

    const scoreboard = live.getScoreboard();
    expect(typeof scoreboard).toBe('string');
    expect(scoreboard.length).toBeGreaterThan(0);
  });
});
