/**
 * Match Statistics Engine
 *
 * Aggregation layer over ScoringEngine point data. The ScoringEngine stores rich
 * per-point data (winner, server, result, serve number, serveLocation, hand, stroke,
 * rally shots, breakpoint, serveSide) but does NOT compute aggregate statistics.
 * This module accumulates raw counters, computes derived percentages, and produces
 * display-ready StatObject arrays.
 *
 * ## ScoringEngine Point Fields Used
 *
 * | ScoringEngine field      | Used for                           |
 * |--------------------------|------------------------------------|
 * | point.winner             | All winner-based counters          |
 * | point.server             | All serve/receive splits           |
 * | point.result (PointResult)| Ace, DF, Winner, UE, FE, Serve Winner |
 * | point.serve (1 | 2)      | 1st/2nd serve breakdown            |
 * | point.isBreakpoint       | Breakpoint tracking                |
 *
 * ## ScoringEngine Capabilities Not Yet Used (extension opportunities)
 *
 * These fields exist on ScoringEngine Point but are not yet aggregated:
 * - point.serveLocation ('Wide' | 'Body' | 'T') — serve direction stats
 * - point.hand ('Forehand' | 'Backhand') — winner/error hand breakdown
 * - point.stroke (StrokeType) — 16 detailed stroke types
 * - point.rally (RallyShot[]) — rally[].position for net point detection
 * - point.serveSide ('deuce' | 'ad') — court side analysis
 * - point.result 'Serve Winner' — currently merged with 'Winner'
 *
 * The legacy statistics.js computed these from MCP notation parsing. The ScoringEngine
 * now provides them as structured data, making future extensions straightforward.
 *
 * Flow: episodes → counters() → baseStats() → statObjects()
 */

import type { Episode } from '../episodes/types';
import { buildEpisodes } from '../episodes/buildEpisodes';

// ── Types ──────────────────────────────────────────────────────

export interface StatObject {
  name: string;
  numerator: [number, number];
  denominator?: [number, number];
  pct?: [number, number];
  default?: 'numerator';
}

interface Counters {
  TotalPoints: number;
  PointsWon: [number, number];
  ServedPoints: [number, number];
  Serves2nd: [number, number];
  ServesAce: [number, number];
  DoubleFaults: [number, number];
  PointsWonServes: [number, number];
  PointsWonServes1st: [number, number];
  PointsWonServes2nd: [number, number];
  ReceivedPoints: [number, number];
  ReceivedPoints1st: [number, number];
  ReceivedPoints2nd: [number, number];
  PointsWonReturn: [number, number];
  PointsWonReturn1st: [number, number];
  PointsWonReturn2nd: [number, number];
  Breakpoints: [number, number];
  BreakpointsConverted: [number, number];
  Gamepoints: [number, number];
  GamepointsConverted: [number, number];
  ServedGames: [number, number];
  Games: [number, number];
  Winners: [number, number];
  UnforcedErrors: [number, number];
  ForcedErrors: [number, number];
  MaxPointsInRow: [number, number];
  MaxGamesInRow: [number, number];
  [key: string]: number | [number, number];
}

interface BaseStats {
  CombinedServiceTotal: number;
  FirstServesIn: number;
  SecondServesIn: number;
  PctServe1stIn: number;
  PctServe2ndIn: number;
  PctPointsWon: number;
  PctPointsWonService: number;
  PctPointsWon1st: number;
  PctPointsWon2nd: number;
  PctPointsWonReturn: number;
  PctPointsWonReturn1st: number;
  PctPointsWonReturn2nd: number;
  Winners: number;
  UnforcedErrors: number;
  BreakpointsSaved: number;
  BreakpointsFaced: number;
  PctBreakpointsSaved: number;
  BreakpointsConverted: number;
  Breakpoints: number;
  PctBreakpointsConverted: number;
  AggressiveMargin: number;
  PctAggressiveMargin: number;
}

// ── Helpers ────────────────────────────────────────────────────

function v(counter: [number, number] | undefined, player: number): number {
  return counter ? counter[player] ?? 0 : 0;
}

function cpct(count: number, total: number): number {
  if (!total || !count) return 0;
  return parseFloat((count / total * 100).toFixed(2));
}

// ── Core accumulator ───────────────────────────────────────────

function counters(episodes: Episode[]): Counters {
  const c: Counters = {
    TotalPoints: episodes.length,
    PointsWon: [0, 0],
    ServedPoints: [0, 0],
    Serves2nd: [0, 0],
    ServesAce: [0, 0],
    DoubleFaults: [0, 0],
    PointsWonServes: [0, 0],
    PointsWonServes1st: [0, 0],
    PointsWonServes2nd: [0, 0],
    ReceivedPoints: [0, 0],
    ReceivedPoints1st: [0, 0],
    ReceivedPoints2nd: [0, 0],
    PointsWonReturn: [0, 0],
    PointsWonReturn1st: [0, 0],
    PointsWonReturn2nd: [0, 0],
    Breakpoints: [0, 0],
    BreakpointsConverted: [0, 0],
    Gamepoints: [0, 0],
    GamepointsConverted: [0, 0],
    ServedGames: [0, 0],
    Games: [0, 0],
    Winners: [0, 0],
    UnforcedErrors: [0, 0],
    ForcedErrors: [0, 0],
    MaxPointsInRow: [0, 0],
    MaxGamesInRow: [0, 0],
  };

  let lastPointWinner: number | undefined;
  let pir = 0; // points in a row
  let lastGameWinner: number | undefined;
  let gir = 0; // games in a row

  for (const ep of episodes) {
    const pt = ep.point;
    const server = pt.server;
    const winner = pt.winner;
    const result = pt.result;

    // Second serve detection: prefer ScoringEngine's serve field,
    // fall back to notation prefix for legacy MCP data
    const isSecondServe = pt.serve === 2 || (!pt.serve && pt.notation ? pt.notation.startsWith('2') : false);

    // Service / receive tracking
    c.ServedPoints[server]++;
    c.ReceivedPoints[1 - server]++;
    if (isSecondServe) {
      c.Serves2nd[server]++;
      c.ReceivedPoints2nd[1 - server]++;
    } else {
      c.ReceivedPoints1st[1 - server]++;
    }

    // Points won
    c.PointsWon[winner]++;

    // Service points won
    if (server === winner) {
      c.PointsWonServes[server]++;
      if (!isSecondServe) c.PointsWonServes1st[server]++;
      if (isSecondServe) c.PointsWonServes2nd[server]++;
    }

    // Return points won
    if (server !== winner) {
      c.PointsWonReturn[1 - server]++;
      if (!isSecondServe) c.PointsWonReturn1st[1 - server]++;
      if (isSecondServe) c.PointsWonReturn2nd[1 - server]++;
    }

    // Result-based counters (ScoringEngine PointResult values)
    if (result === 'Ace') c.ServesAce[server]++;
    if (result === 'Double Fault') c.DoubleFaults[server]++;
    if (result === 'Winner' || result === 'Serve Winner') c.Winners[winner]++;
    if (result === 'Unforced Error') c.UnforcedErrors[1 - winner]++;
    if (result === 'Forced Error') c.ForcedErrors[1 - winner]++;

    // Breakpoints: the breakpoint flag indicates receiver has breakpoint opportunity
    if (pt.breakpoint) {
      c.Breakpoints[1 - server]++;
    }

    // Game-ending point detection
    const isGameEnd = ep.game.complete;
    if (isGameEnd) {
      // Break point converted: game won by receiver
      if (pt.breakpoint && winner !== server) {
        c.BreakpointsConverted[1 - server]++;
      }

      c.Games[winner]++;
      c.ServedGames[server]++;
      c.GamepointsConverted[winner]++;

      // Consecutive games tracking
      if (winner === lastGameWinner || lastGameWinner === undefined) {
        gir++;
      } else {
        gir = 1;
      }
      if (gir > c.MaxGamesInRow[winner]) c.MaxGamesInRow[winner] = gir;
      lastGameWinner = winner;
    }

    // Consecutive points tracking
    if (winner === lastPointWinner || lastPointWinner === undefined) {
      pir++;
    } else {
      pir = 1;
    }
    if (pir > c.MaxPointsInRow[winner]) c.MaxPointsInRow[winner] = pir;
    lastPointWinner = winner;
  }

  return c;
}

// ── Derived percentages ────────────────────────────────────────

function baseStats(c: Counters): { 0: BaseStats; 1: BaseStats } {
  const ps = { 0: {} as BaseStats, 1: {} as BaseStats };

  for (let p = 0; p < 2; p++) {
    const totalService = v(c.ServedPoints, p);
    const secondServes = v(c.Serves2nd, p);
    const firstServesIn = totalService - secondServes;
    const oppTotalService = v(c.ServedPoints, 1 - p);
    const combinedTotalService = totalService + oppTotalService;

    ps[p as 0 | 1].CombinedServiceTotal = combinedTotalService;
    ps[p as 0 | 1].PctPointsWon = cpct(v(c.PointsWon, p), combinedTotalService);
    ps[p as 0 | 1].PctPointsWonService = cpct(v(c.PointsWonServes, p), totalService);
    ps[p as 0 | 1].PctPointsWonReturn = cpct(v(c.PointsWonReturn, p), v(c.ReceivedPoints, p));

    ps[p as 0 | 1].FirstServesIn = firstServesIn;
    ps[p as 0 | 1].PctServe1stIn = cpct(firstServesIn, totalService);
    ps[p as 0 | 1].PctPointsWon1st = cpct(v(c.PointsWonServes1st, p), firstServesIn);

    ps[p as 0 | 1].PctPointsWon2nd = cpct(v(c.PointsWonServes2nd, p), secondServes);
    ps[p as 0 | 1].PctPointsWonReturn1st = cpct(v(c.PointsWonReturn1st, p), v(c.ReceivedPoints1st, p));
    ps[p as 0 | 1].PctPointsWonReturn2nd = cpct(v(c.PointsWonReturn2nd, p), v(c.ReceivedPoints2nd, p));

    const doubleFaults = v(c.DoubleFaults, p);
    const secondServesIn = secondServes - doubleFaults;
    ps[p as 0 | 1].SecondServesIn = secondServesIn;
    ps[p as 0 | 1].PctServe2ndIn = cpct(secondServesIn, secondServes);

    // Breakpoints saved: opponent's breakpoints minus the ones they converted
    const oppBreakpoints = v(c.Breakpoints, 1 - p);
    const oppBptConv = v(c.BreakpointsConverted, 1 - p);
    ps[p as 0 | 1].BreakpointsSaved = oppBreakpoints - oppBptConv;
    ps[p as 0 | 1].BreakpointsFaced = oppBreakpoints;
    ps[p as 0 | 1].PctBreakpointsSaved = cpct(oppBreakpoints - oppBptConv, oppBreakpoints);

    const breakpoints = v(c.Breakpoints, p);
    const breakpointsConverted = v(c.BreakpointsConverted, p);
    ps[p as 0 | 1].Breakpoints = breakpoints;
    ps[p as 0 | 1].BreakpointsConverted = breakpointsConverted;
    ps[p as 0 | 1].PctBreakpointsConverted = cpct(breakpointsConverted, breakpoints);

    // Winners (MCP excludes aces and serve winners)
    ps[p as 0 | 1].Winners = v(c.Winners, p);

    // Unforced errors include double faults
    ps[p as 0 | 1].UnforcedErrors = v(c.UnforcedErrors, p) + doubleFaults;

    // Aggressive margin
    const aces = v(c.ServesAce, p);
    const winners = v(c.Winners, p);
    const forcingErrors = v(c.ForcedErrors, 1 - p);
    const unforcedErrors = v(c.UnforcedErrors, p);
    const aggressiveMargin = (aces + winners + forcingErrors) - (doubleFaults + unforcedErrors);
    ps[p as 0 | 1].AggressiveMargin = aggressiveMargin;
    ps[p as 0 | 1].PctAggressiveMargin = cpct(aggressiveMargin, c.TotalPoints);
  }

  return ps;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Compute match statistics from an Episode array.
 * Returns display-ready StatObject[] suitable for statView.
 */
export function computeMatchStats(episodes: Episode[]): StatObject[] {
  if (!episodes.length) return [];

  const c = counters(episodes);
  const st = baseStats(c);
  const so: StatObject[] = [];

  so.push({
    name: 'Aces',
    numerator: c.ServesAce,
    default: 'numerator',
  });

  so.push({
    name: 'Double Faults',
    numerator: c.DoubleFaults,
    default: 'numerator',
  });

  // Only show 1st/2nd serve breakdown if there's variation
  const hasServeBreakdown = c.PointsWonServes1st[0] + c.PointsWonServes1st[1] > 0 &&
    (c.PointsWonServes[0] !== c.PointsWonServes1st[0] || c.PointsWonServes[1] !== c.PointsWonServes1st[1]);

  if (hasServeBreakdown) {
    so.push({
      name: '1st Serve In',
      numerator: [st[0].FirstServesIn, st[1].FirstServesIn],
      denominator: c.ServedPoints,
      pct: [st[0].PctServe1stIn, st[1].PctServe1stIn],
    });

    so.push({
      name: '1st Serve Points Won',
      numerator: c.PointsWonServes1st,
      denominator: [c.ServedPoints[0] - c.Serves2nd[0], c.ServedPoints[1] - c.Serves2nd[1]],
      pct: [st[0].PctPointsWon1st, st[1].PctPointsWon1st],
    });

    so.push({
      name: '2nd Serve Points Won',
      numerator: c.PointsWonServes2nd,
      denominator: c.Serves2nd,
      pct: [st[0].PctPointsWon2nd, st[1].PctPointsWon2nd],
    });
  }

  so.push({
    name: 'Total Points Won',
    numerator: c.PointsWon,
    default: 'numerator',
  });

  so.push({
    name: 'Receiving Points Won',
    numerator: c.PointsWonReturn,
    denominator: [c.ServedPoints[1], c.ServedPoints[0]],
    pct: [st[0].PctPointsWonReturn, st[1].PctPointsWonReturn],
  });

  so.push({
    name: 'Break Points Won',
    numerator: c.BreakpointsConverted,
    denominator: c.Breakpoints,
    pct: [st[0].PctBreakpointsConverted, st[1].PctBreakpointsConverted],
  });

  so.push({
    name: 'Break Points Saved',
    numerator: [st[0].BreakpointsSaved, st[1].BreakpointsSaved],
    denominator: [st[0].BreakpointsFaced, st[1].BreakpointsFaced],
    pct: [st[0].PctBreakpointsSaved, st[1].PctBreakpointsSaved],
  });

  so.push({
    name: 'Winners',
    numerator: [st[0].Winners, st[1].Winners],
    default: 'numerator',
  });

  so.push({
    name: 'Unforced Errors',
    numerator: c.UnforcedErrors,
    default: 'numerator',
  });

  so.push({
    name: 'Forced Errors',
    numerator: c.ForcedErrors,
    default: 'numerator',
  });

  so.push({
    name: 'Service Points Won',
    numerator: c.PointsWonServes,
    denominator: c.ServedPoints,
    pct: [st[0].PctPointsWonService, st[1].PctPointsWonService],
  });

  so.push({
    name: 'Games Won',
    numerator: c.Games,
  });

  so.push({
    name: 'Most Consecutive Points Won',
    numerator: c.MaxPointsInRow,
  });

  so.push({
    name: 'Most Consecutive Games Won',
    numerator: c.MaxGamesInRow,
  });

  return so;
}

/**
 * Compute match statistics directly from a ScoringEngine MatchUp state.
 * Convenience wrapper: buildEpisodes(matchUp) → computeMatchStats(episodes).
 */
export function computeMatchStatsFromMatchUp(matchUp: any): StatObject[] {
  const episodes = buildEpisodes(matchUp);
  return computeMatchStats(episodes);
}
