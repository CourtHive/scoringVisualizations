import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';

describe('createPlaybackEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a playback engine with default options', () => {
    const playback = createPlaybackEngine({});
    expect(playback.liveEngine).toBeDefined();
    expect(playback.isPlaying()).toBe(false);
    expect(playback.getProgress().current).toBe(0);
    expect(playback.getProgress().total).toBeGreaterThan(0);
    playback.destroy();
  });

  it('stepForward advances one point at a time', () => {
    const playback = createPlaybackEngine({ matchIndex: 0 });
    expect(playback.getProgress().current).toBe(0);

    playback.stepForward();
    expect(playback.getProgress().current).toBe(1);

    playback.stepForward();
    expect(playback.getProgress().current).toBe(2);

    expect(playback.isPlaying()).toBe(false);
    playback.destroy();
  });

  it('stepBack undoes the last point', () => {
    const playback = createPlaybackEngine({ matchIndex: 0 });

    playback.stepForward();
    playback.stepForward();
    playback.stepForward();
    expect(playback.getProgress().current).toBe(3);

    playback.stepBack();
    expect(playback.getProgress().current).toBe(2);

    playback.stepBack();
    expect(playback.getProgress().current).toBe(1);
    playback.destroy();
  });

  it('stepBack at beginning does nothing', () => {
    const playback = createPlaybackEngine({ matchIndex: 0 });
    playback.stepBack();
    expect(playback.getProgress().current).toBe(0);
    playback.destroy();
  });

  it('reset returns to the beginning', () => {
    const playback = createPlaybackEngine({ matchIndex: 0 });

    playback.stepForward();
    playback.stepForward();
    playback.stepForward();
    expect(playback.getProgress().current).toBe(3);

    playback.reset();
    expect(playback.getProgress().current).toBe(0);
    expect(playback.isPlaying()).toBe(false);
    playback.destroy();
  });

  it('start begins auto-play and pause stops it', () => {
    vi.useFakeTimers();
    const playback = createPlaybackEngine({ matchIndex: 0, delayMs: 100 });

    playback.start();
    expect(playback.isPlaying()).toBe(true);

    vi.advanceTimersByTime(350);
    expect(playback.getProgress().current).toBe(3);

    playback.pause();
    expect(playback.isPlaying()).toBe(false);

    vi.advanceTimersByTime(500);
    expect(playback.getProgress().current).toBe(3);

    playback.destroy();
    vi.useRealTimers();
  });

  it('start is idempotent when already playing', () => {
    vi.useFakeTimers();
    const playback = createPlaybackEngine({ matchIndex: 0, delayMs: 100 });

    playback.start();
    playback.start();
    expect(playback.isPlaying()).toBe(true);

    vi.advanceTimersByTime(150);
    expect(playback.getProgress().current).toBe(1);

    playback.destroy();
    vi.useRealTimers();
  });

  it('onComplete fires when all points are consumed', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const playback = createPlaybackEngine({ matchIndex: 0, delayMs: 10, onComplete });
    const total = playback.getProgress().total;

    playback.start();
    vi.advanceTimersByTime(10 * (total + 5));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(playback.isPlaying()).toBe(false);
    expect(playback.getProgress().current).toBe(total);

    playback.destroy();
    vi.useRealTimers();
  });

  it('getFixture returns the fixture data', () => {
    const playback = createPlaybackEngine({ matchIndex: 0 });
    const fixture = playback.getFixture();
    expect(fixture.players).toHaveLength(2);
    expect(fixture.points.length).toBeGreaterThan(0);
    playback.destroy();
  });

  it('liveEngine notifies subscribers during playback', () => {
    const playback = createPlaybackEngine({ matchIndex: 0 });
    const cb = vi.fn();
    playback.liveEngine.subscribe(cb);

    playback.stepForward();
    expect(cb).toHaveBeenCalledTimes(1);

    playback.stepForward();
    expect(cb).toHaveBeenCalledTimes(2);
    playback.destroy();
  });

  it('uses different fixture via matchIndex', () => {
    const p0 = createPlaybackEngine({ matchIndex: 0 });
    const p1 = createPlaybackEngine({ matchIndex: 1 });

    expect(p0.getFixture().players).not.toEqual(p1.getFixture().players);

    p0.destroy();
    p1.destroy();
  });
});
