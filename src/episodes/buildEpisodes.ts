import type { EpisodeNeeded } from 'tods-competition-factory';

import type { Episode } from './types';

/**
 * The `needed` block, read from the point the ScoringEngine already decorated.
 *
 * Nothing is computed here — `calculatePointsTo` did that, and the values arrive on the point. This
 * is the same mapping the factory performs in `getEpisodes`, kept in step with it deliberately:
 * `pointsToMatch` used to be dropped on the floor here, so no chart could render it.
 */
function buildNeeded(point: any): EpisodeNeeded {
  const needed: EpisodeNeeded = {};
  if (point.pointsToGame) needed.pointsToGame = point.pointsToGame;
  if (point.pointsToSet) needed.pointsToSet = point.pointsToSet;
  if (point.pointsToMatch) needed.pointsToMatch = point.pointsToMatch;
  if (point.gamesToSet) needed.gamesToSet = point.gamesToSet;
  if (point.isBreakpoint !== undefined) needed.isBreakpoint = point.isBreakpoint;
  return needed;
}

/**
 * Transforms a ScoringEngine MatchUp into an Episode array
 * suitable for visualization components (GameTree, Momentum, PTS, GameFish, Corona).
 *
 * Games and sets are read from the engine's unified timeline (`history.entries`),
 * so games awarded with addGame/addSet count, and a game they interrupted is not
 * credited to its last tracked point.
 *
 * @param matchUp - A MatchUp object from ScoringEngine.getState()
 * @returns Episode[] - Array of episodes, one per point played
 */
export function buildEpisodes(matchUp: any): Episode[] {
  const points = matchUp?.history?.points;
  if (!Array.isArray(points) || points.length === 0) return [];

  const resolved = resolveGames(matchUp, points, readGaps(matchUp, points.length));
  const episodes: Episode[] = [];
  const counts: PointCounts = { setCumulativePoints: [0, 0], gamePointCounts: [0, 0] };

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const previous = points[i - 1];
    const isLastPoint = i === points.length - 1;
    const matchComplete = isLastPoint && matchUp?.winningSide !== undefined;

    if (previous && previous.set !== point.set) counts.setCumulativePoints = [0, 0];
    if (previous && (previous.set !== point.set || previous.game !== point.game)) counts.gamePointCounts = [0, 0];
    counts.setCumulativePoints[point.winner === 0 ? 0 : 1]++;
    counts.gamePointCounts[point.winner === 0 ? 0 : 1]++;

    const boundaries: Boundaries = {
      isLastPoint,
      matchComplete,
      isGameEnd: resolved[i].completesGame || matchComplete,
      isSetEnd: resolved[i].completesSet || matchComplete,
    };
    episodes.push(buildEpisode(matchUp, point, points[i + 1], i, resolved[i].gamesBefore, counts, boundaries));
  }

  return episodes;
}

interface PointCounts {
  setCumulativePoints: [number, number];
  gamePointCounts: [number, number];
}

interface Boundaries {
  isLastPoint: boolean;
  matchComplete: boolean;
  isGameEnd: boolean;
  isSetEnd: boolean;
}

/** A non-point entry of the history timeline: an addGame award or an addSet. */
type Marker = { kind: 'game'; winner: 0 | 1 } | { kind: 'set' };

/** What the timeline says about one point. */
interface ResolvedPoint {
  /** Games in the point's set before its own game was decided, by side. */
  gamesBefore: [number, number];
  /** The point won its game. False for the last point of a game an addGame or addSet interrupted. */
  completesGame: boolean;
  /** The point won its game and, with it, the set. */
  completesSet: boolean;
}

/**
 * The game and set entries around each point, from the engine's unified timeline
 * (`history.entries`): `gaps[k]` holds those between point k-1 and point k, and
 * `gaps[points.length]` those after the last point. Without a timeline (a
 * points-only producer) every gap is empty.
 */
function readGaps(matchUp: any, pointCount: number): Marker[][] {
  const gaps: Marker[][] = Array.from({ length: pointCount + 1 }, () => []);
  const entries = matchUp?.history?.entries;
  if (!Array.isArray(entries)) return gaps;

  let nextPoint = 0;
  for (const entry of entries) {
    if (entry?.type === 'point') {
      nextPoint = (typeof entry.pointIndex === 'number' ? entry.pointIndex : nextPoint) + 1;
    } else if (entry?.type === 'game') {
      gaps[Math.min(nextPoint, pointCount)].push({ kind: 'game', winner: entry.data?.winner === 0 ? 0 : 1 });
    } else if (entry?.type === 'set') {
      gaps[Math.min(nextPoint, pointCount)].push({ kind: 'set' });
    }
  }
  return gaps;
}

/**
 * Decide, for every point, whether it won its game, from the engine's own
 * accounting rather than from where the game index changes.
 *
 * Within a set the engine numbers a point's game as the games won on points
 * before it plus the addGame entries before it, and an addGame that interrupts a
 * game abandons the partial game and awards it. So between two points of one set
 * with `m` addGame entries between them, the earlier point won its game exactly
 * when the game index advanced by `m + 1`, not `m`. The last point of a set has
 * no successor in it; the set's own score (`score.sets`) settles it: its games
 * are the games before that point, plus the point's game if it won it, plus the
 * addGame entries that follow in the same set.
 */
function resolveGames(matchUp: any, points: any[], gaps: Marker[][]): ResolvedPoint[] {
  const sets = matchUp?.score?.sets;
  const resolved: ResolvedPoint[] = [];
  let games: [number, number] = [0, 0];
  applyAwards(games, leadingAwards(gaps[0], points[0]?.game));

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const next = points[i + 1];
    const between = gaps[i + 1];
    const entry: ResolvedPoint = { gamesBefore: [...games], completesGame: false, completesSet: false };
    resolved.push(entry);

    if (next && next.set === point.set) {
      if (next.game === point.game) continue;
      const awards = between.filter(isGameMarker);
      entry.completesGame = clampToOne(next.game - point.game - awards.length);
      if (entry.completesGame) games[point.winner === 0 ? 0 : 1]++;
      applyAwards(games, awards);
      continue;
    }

    // The point's set ends here (or the history does). Of the entries in between,
    // the addGame entries before any addSet belong to this set, except those the
    // next point's game index says opened its own set.
    const nextSetAwards = next ? leadingAwards(between, next.game) : [];
    const firstSet = between.findIndex((marker) => marker.kind === 'set');
    const upToSet = firstSet === -1 ? between : between.slice(0, firstSet);
    const trailing = upToSet
      .filter(isGameMarker)
      .slice(0, firstSet === -1 ? upToSet.length - nextSetAwards.length : undefined);

    const set = Array.isArray(sets) ? sets[point.set] : undefined;
    const total = set ? (set.side1Score ?? 0) + (set.side2Score ?? 0) : undefined;
    entry.completesGame =
      total === undefined
        ? !!next || matchUp?.winningSide !== undefined
        : clampToOne(total - games[0] - games[1] - trailing.length);
    entry.completesSet = entry.completesGame && trailing.length === 0 && set?.winningSide !== undefined;

    games = [0, 0];
    applyAwards(games, nextSetAwards);
  }
  return resolved;
}

function isGameMarker(marker: Marker): marker is { kind: 'game'; winner: 0 | 1 } {
  return marker.kind === 'game';
}

/** The addGame entries that opened a point's set: the last `game` of them, after any addSet. */
function leadingAwards(markers: Marker[], game: unknown): Array<{ kind: 'game'; winner: 0 | 1 }> {
  if (typeof game !== 'number' || game <= 0) return [];
  const lastSet = markers.map((marker) => marker.kind).lastIndexOf('set');
  return markers
    .slice(lastSet + 1)
    .filter(isGameMarker)
    .slice(-game);
}

function applyAwards(games: [number, number], awards: Array<{ winner: 0 | 1 }>): void {
  for (const award of awards) games[award.winner]++;
}

function clampToOne(advance: number): boolean {
  return advance >= 1;
}

function buildEpisode(
  matchUp: any,
  point: any,
  nextPoint: any,
  index: number,
  gamesBefore: [number, number],
  counts: PointCounts,
  boundaries: Boundaries,
): Episode {
  const gameWinner = boundaries.isGameEnd ? point.winner : undefined;

  const episodeGamesScore: [number, number] = [...gamesBefore];
  if (boundaries.isGameEnd && gameWinner !== undefined) {
    episodeGamesScore[gameWinner]++;
  }

  const setWinner = boundaries.isSetEnd ? sideToIndex(deriveSetWinner(matchUp, point.set)) : undefined;

  const displayScore = boundaries.isGameEnd ? 'G' : point.score || '';

  return {
    action: 'addPoint',
    point: {
      winner: point.winner,
      server: point.server,
      pointNumber: point.pointNumber,
      index: point.index ?? index,
      isBreakpoint: point.isBreakpoint ?? false,
      score: displayScore,
      set: point.set,
      game: point.game,
      rallyLength: point.rallyLength,
      result: point.result,
      notation: point.mcpCode,
      tiebreak: point.tiebreak ?? false,
      serve: point.serve,
      points: [...counts.gamePointCounts] as [number, number],
      setCumulativePoints: [...counts.setCumulativePoints] as [number, number],
    },
    game: {
      complete: boundaries.isGameEnd,
      winner: gameWinner,
      games: episodeGamesScore,
      index: point.game,
    },
    set: {
      complete: boundaries.isSetEnd,
      winner: setWinner,
      sets: buildSetsArray(matchUp, point.set),
      index: point.set,
    },
    // Absent stays absent. These were `?? [0, 0]`, and `[0, 0]` is not "unknown" — it reads as
    // "this side needs no more points", i.e. already won. A renderer given that for a point the
    // engine never decorated draws a finished game. Mirrors the factory's own `buildNeeded`, which
    // omits a field rather than inventing a value for it.
    needed: buildNeeded(point),
    nextService: nextPoint?.server ?? point.server,
    result: true,
    complete: boundaries.isLastPoint && boundaries.matchComplete,
  };
}

/**
 * Convert ScoringEngine's winningSide (1 or 2) to 0-based index (0 or 1).
 */
function sideToIndex(winningSide: number | undefined): number | undefined {
  if (winningSide === 1) return 0;
  if (winningSide === 2) return 1;
  return undefined;
}

/**
 * Get winningSide for a completed set.
 */
function deriveSetWinner(matchUp: any, setIndex: number): number | undefined {
  const sets = matchUp?.score?.sets;
  if (!Array.isArray(sets) || !sets[setIndex]) return undefined;
  return sets[setIndex].winningSide;
}

/**
 * Build cumulative sets score array up to the given set index.
 */
function buildSetsArray(matchUp: any, currentSetIndex: number): number[][] {
  const sets = matchUp?.score?.sets;
  if (!Array.isArray(sets)) return [];
  const result: number[][] = [];
  for (let i = 0; i <= currentSetIndex && i < sets.length; i++) {
    const s = sets[i];
    result.push([s.side1Score ?? 0, s.side2Score ?? 0]);
  }
  return result;
}
