/**
 * Feed MCP fixture data into the factory ScoringEngine
 *
 * Thin wrapper: iterates points, calls addPoint(), returns getState().
 * No scoring logic lives here — the ScoringEngine is the single source of truth.
 */

import { scoreGovernor } from 'tods-competition-factory';
import mcpFixtures from '../visualizations/data/mcpFixtures.json';

const { ScoringEngine } = scoreGovernor;

interface McpPoint {
  index: number;
  set: number;
  game: number;
  score: string;
  server: number;
  winner: number;
  result: string;
  error: string | null;
  serves: string[];
  rally: string[];
  rallyLength: number;
  totalShots: number;
  breakpoint: number | null;
  gamepoint: number | null;
  tiebreak: boolean;
  code: string;
}

interface McpFixture {
  matchId: number;
  players: [string, string];
  tournament: {
    name: string;
    division: string;
    date: string | null;
    tour: string;
  };
  score: {
    sets?: Array<{ games: [number, number]; complete: boolean }>;
    match_score?: string;
    winner?: string;
    loser?: string;
  };
  sets: Array<{
    games: Array<{
      range: [number, number];
      winner: string;
      score: [number, number];
      tiebreak: boolean;
    }>;
    winner?: number;
  }>;
  points: McpPoint[];
  totalPoints: number;
}

const fixtures = mcpFixtures as unknown as McpFixture[];

const UNFORCED_ERROR = 'Unforced Error';

export const RESULT_MAP: Record<string, string> = {
  'Ace': 'Ace',
  'Winner': 'Winner',
  'Serve Winner': 'Serve Winner',
  'Unforced Error': UNFORCED_ERROR,
  'Forced Error': 'Forced Error',
  'Double Fault': 'Double Fault',
  'Net': UNFORCED_ERROR,
  'Out': UNFORCED_ERROR,
  'Return Winner': 'Winner',
};

/**
 * Feed a single MCP fixture match through the ScoringEngine.
 *
 * @param matchIndex - Index into mcpFixtures array (wraps around)
 * @returns The ScoringEngine MatchUp state (with enriched history points)
 */
export function feedMatchUp(matchIndex = 0): any {
  const fixture = fixtures[matchIndex % fixtures.length];
  const engine = new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });

  for (const pt of fixture.points) {
    engine.addPoint({
      winner: pt.winner as 0 | 1,
      server: pt.server as 0 | 1,
      result: (RESULT_MAP[pt.result] || 'Winner') as any,
      rallyLength: pt.rallyLength,
    });
  }

  const matchUp = engine.getState();

  // Enrich engine points with MCP-specific fields the ScoringEngine doesn't track
  if (matchUp?.history?.points) {
    for (let i = 0; i < matchUp.history.points.length; i++) {
      const enginePt = matchUp.history.points[i] as any;
      const mcpPt = fixture.points[i];
      if (enginePt && mcpPt) {
        enginePt.mcpCode = mcpPt.code;
        enginePt.tiebreak = mcpPt.tiebreak;
      }
    }
  }

  return matchUp;
}

/**
 * Feed all MCP fixtures through the ScoringEngine.
 */
export function feedAllMatchUps(): any[] {
  return fixtures.map((_, i) => feedMatchUp(i));
}

/**
 * Get the raw MCP fixture data (for metadata like player names, tournament).
 */
export function getMcpFixture(matchIndex = 0): McpFixture {
  return fixtures[matchIndex % fixtures.length];
}

/**
 * Extract rally lengths from a ScoringEngine MatchUp, grouped by winner.
 * Returns [player0Rallies, player1Rallies] for simpleChart.
 */
export function extractRallyLengths(matchUp: any): number[][] {
  const points = matchUp?.history?.points;
  if (!Array.isArray(points)) return [[], []];

  const p0: number[] = [];
  const p1: number[] = [];
  for (const pt of points) {
    if (pt.winner === 0) p0.push(pt.rallyLength ?? 0);
    else p1.push(pt.rallyLength ?? 0);
  }
  return [p0, p1];
}

/**
 * Extract points for a single game from a ScoringEngine MatchUp.
 * Used by gameFish stories. Returns legacy Point[] shape.
 */
export function extractGamePoints(matchUp: any, setIdx = 0, gameIdx = 0): any[] {
  const points = matchUp?.history?.points;
  if (!Array.isArray(points)) return [];

  const gamePoints = points.filter(
    (pt: any) => pt.set === setIdx && pt.game === gameIdx,
  );

  let p0 = 0;
  let p1 = 0;
  return gamePoints.map((pt: any, i: number) => {
    if (pt.winner === 0) p0++;
    else p1++;
    return {
      index: i,
      game: gameIdx,
      set: setIdx,
      server: pt.server as 0 | 1,
      winner: pt.winner as 0 | 1,
      notation: pt.mcpCode,
      rallyLength: pt.rallyLength,
      result: pt.result,
      score: pt.score,
      points: [p0, p1] as [number, number],
      tiebreak: pt.tiebreak ?? false,
      breakpoint: pt.isBreakpoint ?? false,
    };
  });
}
