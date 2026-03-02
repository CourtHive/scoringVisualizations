import { describe, it, expect } from 'vitest';
import { buildEpisodes } from '../episodes/buildEpisodes';
import { feedMatchUp } from '../engine/feedMatchUp';

import { scoreGovernor } from 'tods-competition-factory';

const { ScoringEngine } = scoreGovernor;

describe('buildEpisodes', () => {
  it('returns empty array for null/undefined input', () => {
    expect(buildEpisodes(null)).toEqual([]);
    expect(buildEpisodes(undefined)).toEqual([]);
    expect(buildEpisodes({})).toEqual([]);
  });

  it('returns empty array for matchUp with no points', () => {
    expect(buildEpisodes({ history: { points: [] } })).toEqual([]);
  });

  it('produces one episode per point with real ScoringEngine', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 1, server: 0 });

    const episodes = buildEpisodes(engine.getState());
    expect(episodes).toHaveLength(2);
    expect(episodes[0].action).toBe('addPoint');
    expect(episodes[0].point.winner).toBe(0);
    expect(episodes[1].point.winner).toBe(1);
  });

  it('detects game completion from real ScoringEngine', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

    // Win 4 points in a row → game complete
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });
    // Next point starts a new game
    engine.addPoint({ winner: 1, server: 1 });

    const episodes = buildEpisodes(engine.getState());
    expect(episodes).toHaveLength(5);

    // 4th point (index 3) should complete the game
    expect(episodes[3].game.complete).toBe(true);
    expect(episodes[3].game.winner).toBe(0);
    expect(episodes[3].point.score).toBe('G');

    // 5th point should start new game
    expect(episodes[4].game.complete).toBe(false);
    expect(episodes[4].point.game).toBe(1);
  });

  it('tracks within-game point counts', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 1, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });

    const episodes = buildEpisodes(engine.getState());
    expect(episodes[0].point.points).toEqual([1, 0]);
    expect(episodes[1].point.points).toEqual([1, 1]);
    expect(episodes[2].point.points).toEqual([2, 1]);
  });

  it('tracks setCumulativePoints alongside within-game points', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    // Win game 0 for player 0 (4 points)
    for (let i = 0; i < 4; i++) engine.addPoint({ winner: 0, server: 0 });
    // Start game 1: player 1 wins 2, player 0 wins 1
    engine.addPoint({ winner: 1, server: 1 });
    engine.addPoint({ winner: 0, server: 1 });
    engine.addPoint({ winner: 1, server: 1 });

    const episodes = buildEpisodes(engine.getState());
    // Within-game points reset after game 0
    expect(episodes[4].point.points).toEqual([0, 1]); // first point of game 1
    expect(episodes[5].point.points).toEqual([1, 1]);
    expect(episodes[6].point.points).toEqual([1, 2]);

    // Cumulative set points keep counting
    expect(episodes[4].point.setCumulativePoints).toEqual([4, 1]);
    expect(episodes[5].point.setCumulativePoints).toEqual([5, 1]);
    expect(episodes[6].point.setCumulativePoints).toEqual([5, 2]);
  });

  it('populates needed fields from ScoringEngine point data', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    engine.addPoint({ winner: 0, server: 0 });

    const episodes = buildEpisodes(engine.getState());
    const needed = episodes[0].needed;
    expect(needed).toHaveProperty('pointsToGame');
    expect(needed).toHaveProperty('pointsToSet');
    expect(needed).toHaveProperty('gamesToSet');
  });

  it('sets nextService from the next point server', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    // Win a game with player 0 serving
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });
    engine.addPoint({ winner: 0, server: 0 });
    // Next game, player 1 serves
    engine.addPoint({ winner: 1, server: 1 });

    const episodes = buildEpisodes(engine.getState());
    // Last point of game 0 should show nextService = 1
    expect(episodes[3].nextService).toBe(1);
  });

  it('preserves optional fields (result, rallyLength)', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
    engine.addPoint({ winner: 0, server: 0, result: 'Ace', rallyLength: 1 });

    const episodes = buildEpisodes(engine.getState());
    expect(episodes[0].point.result).toBe('Ace');
    expect(episodes[0].point.rallyLength).toBe(1);
  });

  it('updates games score when games complete', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

    // Win game 0 for player 0
    for (let i = 0; i < 4; i++) engine.addPoint({ winner: 0, server: 0 });
    // Win game 1 for player 1
    for (let i = 0; i < 4; i++) engine.addPoint({ winner: 1, server: 1 });
    // Start game 2
    engine.addPoint({ winner: 0, server: 0 });

    const episodes = buildEpisodes(engine.getState());

    // After game 0 completes: games [1, 0]
    expect(episodes[3].game.games).toEqual([1, 0]);
    // During game 1: games stay [1, 0]
    expect(episodes[4].game.games).toEqual([1, 0]);
    // After game 1 completes: games [1, 1]
    expect(episodes[7].game.games).toEqual([1, 1]);
    // Game 2 starts: games [1, 1]
    expect(episodes[8].game.games).toEqual([1, 1]);
  });

  it('works with real MCP fixture data (feedMatchUp)', () => {
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);

    expect(episodes.length).toBe(matchUp.history.points.length);
    expect(episodes.length).toBeGreaterThan(50); // Real match should have many points

    // First episode checks
    expect(episodes[0].point.set).toBe(0);
    expect(episodes[0].point.game).toBe(0);

    // Check game completions exist
    const completedGames = episodes.filter((ep) => ep.game.complete);
    expect(completedGames.length).toBeGreaterThan(10);
  });

  it('addGame p1 + addGame p2 + points p1: game.games shows [2,1]', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

    // Two games added directly
    engine.addGame({ winner: 0 });
    engine.addGame({ winner: 1 });

    // Play a game via points for player 0
    for (let i = 0; i < 4; i++) engine.addPoint({ winner: 0, server: 0 });

    const state = engine.getState();
    const episodes = buildEpisodes(state);

    expect(episodes).toHaveLength(4);

    // Last episode (game complete): game.games should be [2, 1]
    const lastEpisode = episodes[episodes.length - 1];
    expect(lastEpisode.game.complete).toBe(true);
    expect(lastEpisode.game.games).toEqual([2, 1]);
    expect(lastEpisode.game.winner).toBe(0);

    // Non-completing episodes should show [1, 1] (prior games from addGame)
    expect(episodes[0].game.games).toEqual([1, 1]);
    expect(episodes[0].game.complete).toBe(false);
  });

  it('addGame p1 + addGame p2 + points p1 + first point of game 4: game.games correct for both games', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

    engine.addGame({ winner: 0 });
    engine.addGame({ winner: 1 });

    // Complete game 3 via points for player 0
    for (let i = 0; i < 4; i++) engine.addPoint({ winner: 0, server: 0 });
    // First point of game 4
    engine.addPoint({ winner: 1, server: 1 });

    const episodes = buildEpisodes(engine.getState());
    expect(episodes).toHaveLength(5);

    // Game 3 (points 0-3): last point should be game-complete with [2, 1]
    expect(episodes[3].game.complete).toBe(true);
    expect(episodes[3].game.games).toEqual([2, 1]);

    // Game 4 (point 4): not complete, score [2, 1]
    expect(episodes[4].game.complete).toBe(false);
    expect(episodes[4].game.games).toEqual([2, 1]);
  });

  it('handles undo scenario: feed 10 points then undo 3', () => {
    const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

    // Feed 10 points
    for (let i = 0; i < 10; i++) {
      engine.addPoint({ winner: (i % 2) as 0 | 1, server: 0 });
    }
    expect(engine.getPointCount()).toBe(10);

    // Undo 3
    engine.undo();
    engine.undo();
    engine.undo();
    expect(engine.getPointCount()).toBe(7);

    const episodes = buildEpisodes(engine.getState());
    expect(episodes).toHaveLength(7);
  });
});
