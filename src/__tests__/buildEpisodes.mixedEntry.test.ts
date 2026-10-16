import { describe, expect, it } from 'vitest';
import { scoreGovernor } from 'tods-competition-factory';

import { buildEpisodes } from '../episodes/buildEpisodes';

const { ScoringEngine } = scoreGovernor;

// Mixed entry: a scorer catches up with addGame/addSet, or awards a game they
// missed mid-game. The factory abandons the partial game an addGame interrupts,
// so the last tracked point of that game did NOT win it. The episodes must say
// what the factory's score says, point by point.

type Step = ['point' | 'game', 0 | 1] | ['set', 1 | 2, number, number];

/**
 * Play the steps through the real engine. For each point, record the factory's
 * games in that point's set just after it was added: the score its episode must
 * show, whatever entries come later.
 */
function play(format: string, steps: Step[]) {
  const engine = new ScoringEngine({ matchUpFormat: format });
  const expected: number[][] = [];
  const wonGame: boolean[] = [];
  const games = (state: any, setIndex: number) => {
    const set = state.score?.sets?.[setIndex];
    return [set?.side1Score ?? 0, set?.side2Score ?? 0];
  };
  for (const step of steps) {
    if (step[0] === 'point') {
      const prior = engine.getState();
      engine.addPoint({ winner: step[1] });
      const state: any = engine.getState();
      const point = state.history.points[state.history.points.length - 1];
      const after = games(state, point.set);
      const before = games(prior, point.set);
      expected.push(after);
      wonGame.push(after[0] + after[1] > before[0] + before[1]);
    } else if (step[0] === 'game') {
      engine.addGame({ winner: step[1] });
    } else {
      const [, winningSide, side1Score, side2Score] = step as ['set', 1 | 2, number, number];
      engine.addSet({ winningSide, side1Score, side2Score });
    }
  }
  const state = engine.getState();
  return { state, expected, wonGame, episodes: buildEpisodes(state) };
}

const points = (winner: 0 | 1, count: number): Step[] => Array.from({ length: count }, () => ['point', winner]);

describe('buildEpisodes on interleaved points, games and sets', () => {
  // The assessment's probe: the factory scores this 0-1.
  it('credits an interrupted game to the addGame winner, not to the last point', () => {
    const { episodes, expected } = play('SET3-S:6/TB7', [
      ['point', 0],
      ['game', 1],
      ['point', 0]
    ]);
    expect(episodes[0].game.complete).toBe(false);
    expect(episodes[0].game.winner).toBeUndefined();
    expect(episodes.map((episode) => episode.game.games)).toEqual(expected);
    expect(expected).toEqual([
      [0, 0],
      [0, 1]
    ]);
  });

  const cases: Array<[string, string, Step[]]> = [
    ['a game won on points, then an addGame', 'SET3-S:6/TB7', [...points(0, 4), ['game', 1], ['point', 1]]],
    [
      'games first, then a partial game interrupted',
      'SET3-S:6/TB7',
      [['game', 0], ['game', 1], ...points(1, 2), ['game', 0], ['point', 0]]
    ],
    ['addSet first, then points', 'SET3-S:6/TB7', [['set', 1, 6, 3], ...points(1, 5)]],
    ['a partial set closed by addSet', 'SET3-S:6/TB7', [...points(1, 2), ['set', 1, 6, 4], ['point', 0]]],
    [
      'a set finished by addGame, then points in the next set',
      'SET3-S:6/TB7',
      [...points(0, 4), ...points(0, 4), ['game', 0], ['game', 0], ['game', 0], ['game', 0], ...points(1, 5)]
    ],
    [
      'a set won on points through a tiebreak',
      'SET3-S:6/TB7',
      [...Array.from({ length: 12 }, (_, g) => points((g % 2) as 0 | 1, 4)).flat(), ...points(1, 7), ...points(0, 3)]
    ],
    [
      'a final-set match tiebreak',
      'SET3-S:6/TB7-F:TB10',
      [['set', 1, 6, 2], ['set', 2, 3, 6], ...points(0, 9), ['point', 1], ...points(0, 1)]
    ],
    [
      'repeated interruptions in one set',
      'SET3-S:6/TB7',
      [['point', 1], ['game', 0], ['point', 1], ['point', 0], ['game', 1], ...points(0, 4), ['game', 1], ['point', 1]]
    ]
  ];

  it.each(cases)('matches the factory games score at every point: %s', (_label, format, steps) => {
    const { episodes, expected } = play(format, steps);
    expect(episodes.map((episode) => episode.game.games)).toEqual(expected);
  });

  it.each(cases)('marks a game complete only where a point won it: %s', (_label, format, steps) => {
    const { episodes, wonGame } = play(format, steps);
    expect(episodes.map((episode) => episode.game.complete)).toEqual(wonGame);
    for (const episode of episodes) {
      if (episode.game.complete) expect(episode.game.winner).toBe(episode.point.winner);
    }
  });

  it('marks the set complete on the point that won it on points, and not on an abandoned one', () => {
    const won = play('SET3-S:6/TB7', [...points(0, 24), ['point', 1]]);
    expect(won.episodes[23].set.complete).toBe(true);
    expect(won.episodes[23].set.winner).toBe(0);

    const abandoned = play('SET3-S:6/TB7', [...points(1, 2), ['set', 1, 6, 4], ['point', 0]]);
    expect(abandoned.episodes[1].set.complete).toBe(false);
    expect(abandoned.episodes[1].game.complete).toBe(false);
  });
});
