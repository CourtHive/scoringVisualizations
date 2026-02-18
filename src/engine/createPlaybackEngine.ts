/**
 * Playback Engine — Incrementally feeds MCP fixture points into a LiveEngine
 *
 * Shared utility for Storybook stories. Provides auto-play with configurable
 * delay, step forward/back (via undo), pause, and reset.
 *
 * Usage:
 *   const playback = createPlaybackEngine({ matchIndex: 0, delayMs: 200 });
 *   playback.liveEngine.subscribe(matchUp => chart.data(buildEpisodes(matchUp)));
 *   playback.start();
 */

import { LiveEngine } from './LiveEngine';
import { getMcpFixture, RESULT_MAP } from './feedMatchUp';

import { scoreGovernor } from 'tods-competition-factory';

const { ScoringEngine } = scoreGovernor;

export interface PlaybackControls {
  liveEngine: LiveEngine;
  start(): void;
  pause(): void;
  stepForward(): void;
  stepBack(): void;
  reset(): void;
  isPlaying(): boolean;
  getProgress(): { current: number; total: number };
  getFixture(): ReturnType<typeof getMcpFixture>;
  destroy(): void;
}

export function createPlaybackEngine(options: {
  matchIndex?: number;
  delayMs?: number;
  onComplete?: () => void;
}): PlaybackControls {
  const { matchIndex = 0, delayMs = 200, onComplete } = options;

  const fixture = getMcpFixture(matchIndex);
  const points = fixture.points;

  const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
  const liveEngine = new LiveEngine(engine);

  let cursor = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let playing = false;

  function feedNextPoint(): boolean {
    if (cursor >= points.length) {
      pause();
      onComplete?.();
      return false;
    }
    const pt = points[cursor];
    liveEngine.addPoint({
      winner: pt.winner as 0 | 1,
      server: pt.server as 0 | 1,
      result: RESULT_MAP[pt.result] || 'Winner',
      rallyLength: pt.rallyLength,
    });
    cursor++;
    return true;
  }

  function start(): void {
    if (playing) return;
    playing = true;
    timer = setInterval(() => {
      if (!feedNextPoint()) {
        pause();
      }
    }, delayMs);
  }

  function pause(): void {
    playing = false;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function stepForward(): void {
    pause();
    feedNextPoint();
  }

  function stepBack(): void {
    pause();
    if (cursor > 0) {
      liveEngine.undo();
      cursor--;
    }
  }

  function reset(): void {
    pause();
    liveEngine.reset();
    cursor = 0;
  }

  function destroy(): void {
    pause();
  }

  return {
    liveEngine,
    start,
    pause,
    stepForward,
    stepBack,
    reset,
    isPlaying: () => playing,
    getProgress: () => ({ current: cursor, total: points.length }),
    getFixture: () => fixture,
    destroy,
  };
}
