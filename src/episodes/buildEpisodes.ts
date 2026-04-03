import type { Episode } from './types';

/**
 * Transforms a ScoringEngine MatchUp into an Episode array
 * suitable for visualization components (GameTree, Momentum, PTS, GameFish, Corona).
 *
 * @param matchUp - A MatchUp object from ScoringEngine.getState()
 * @returns Episode[] - Array of episodes, one per point played
 */
export function buildEpisodes(matchUp: any): Episode[] {
  const points = matchUp?.history?.points;
  if (!Array.isArray(points) || points.length === 0) return [];

  const episodes: Episode[] = [];
  const priorGamesPerSet = buildPriorGamesMap(matchUp);
  const state = initRunningState(points[0], priorGamesPerSet);

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const nextPoint = points[i + 1];
    const isLastPoint = i === points.length - 1;
    const matchComplete = isLastPoint && matchUp?.winningSide !== undefined;

    handleTransitions(point, state, priorGamesPerSet);
    updatePointCounts(point, state);

    const boundaries = detectBoundaries(matchUp, point, nextPoint, isLastPoint, matchComplete, state.gamesScore);

    const { episode, gameWinner, setWinner } = buildEpisode(
      matchUp, point, nextPoint, i, state, boundaries,
    );
    episodes.push(episode);

    advanceRunningState(state, boundaries, gameWinner, setWinner);
  }

  return episodes;
}

interface RunningState {
  setCumulativePoints: [number, number];
  gamePointCounts: [number, number];
  gamesScore: [number, number];
  setsScore: [number, number];
  currentSet: number;
  currentGame: number;
}

interface Boundaries {
  gameComplete: boolean;
  setComplete: boolean;
  isLastPoint: boolean;
  matchComplete: boolean;
  isGameEnd: boolean;
  isSetEnd: boolean;
}

function initRunningState(firstPoint: any, priorGamesPerSet: Map<number, [number, number]>): RunningState {
  const setIndex = firstPoint?.set ?? 0;
  return {
    setCumulativePoints: [0, 0],
    gamePointCounts: [0, 0],
    gamesScore: [...(priorGamesPerSet.get(setIndex) || [0, 0])] as [number, number],
    setsScore: [0, 0],
    currentSet: setIndex,
    currentGame: firstPoint?.game ?? 0,
  };
}

function handleTransitions(point: any, state: RunningState, priorGamesPerSet: Map<number, [number, number]>): void {
  if (point.set !== state.currentSet) {
    state.setCumulativePoints = [0, 0];
    state.gamePointCounts = [0, 0];
    state.gamesScore = [...(priorGamesPerSet.get(point.set) || [0, 0])] as [number, number];
    state.currentSet = point.set;
    state.currentGame = point.game;
  }

  if (point.game !== state.currentGame) {
    state.gamePointCounts = [0, 0];
    state.currentGame = point.game;
  }
}

function updatePointCounts(point: any, state: RunningState): void {
  state.setCumulativePoints[point.winner === 0 ? 0 : 1]++;
  state.gamePointCounts[point.winner === 0 ? 0 : 1]++;
}

function detectBoundaries(
  matchUp: any,
  point: any,
  nextPoint: any,
  isLastPoint: boolean,
  matchComplete: boolean,
  gamesScore: [number, number],
): Boundaries {
  const gameComplete = nextPoint
    ? nextPoint.game !== point.game || nextPoint.set !== point.set
    : isLastPointGameComplete(matchUp, point, gamesScore[0] + gamesScore[1]);
  const setComplete = nextPoint
    ? nextPoint.set !== point.set
    : isLastPointSetComplete(matchUp, point);
  const isGameEnd = gameComplete || (isLastPoint && matchComplete);
  const isSetEnd = setComplete || (isLastPoint && matchComplete);

  return { gameComplete, setComplete, isLastPoint, matchComplete, isGameEnd, isSetEnd };
}

function buildEpisode(
  matchUp: any,
  point: any,
  nextPoint: any,
  index: number,
  state: RunningState,
  boundaries: Boundaries,
): { episode: Episode; gameWinner: number | undefined; setWinner: number | undefined } {
  const gameWinner = boundaries.isGameEnd ? point.winner : undefined;

  const episodeGamesScore: [number, number] = [...state.gamesScore];
  if (boundaries.isGameEnd && gameWinner !== undefined) {
    episodeGamesScore[gameWinner]++;
  }

  const setWinner = boundaries.isSetEnd ? sideToIndex(deriveSetWinner(matchUp, point.set)) : undefined;

  const displayScore = boundaries.isGameEnd ? 'G' : point.score || '';

  const episode: Episode = {
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
      points: [...state.gamePointCounts] as [number, number],
      setCumulativePoints: [...state.setCumulativePoints] as [number, number],
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
    needed: {
      pointsToGame: point.pointsToGame ?? [0, 0],
      pointsToSet: point.pointsToSet ?? [0, 0],
      gamesToSet: point.gamesToSet ?? [0, 0],
    },
    nextService: nextPoint?.server ?? point.server,
    result: true,
    complete: boundaries.isLastPoint && boundaries.matchComplete,
  };

  return { episode, gameWinner, setWinner };
}

function advanceRunningState(
  state: RunningState,
  boundaries: Boundaries,
  gameWinner: number | undefined,
  setWinner: number | undefined,
): void {
  if (boundaries.gameComplete && gameWinner !== undefined) {
    state.gamesScore[gameWinner]++;
    state.gamePointCounts = [0, 0];
  }

  if (boundaries.setComplete && setWinner !== undefined) {
    state.setsScore[setWinner]++;
    state.gamesScore = [0, 0];
  }
}

/**
 * Build a map of prior game scores per set from the unified entries timeline.
 *
 * Counts 'game' entries (from addGame()) that precede any 'point' entries
 * within each set, so gamesScore can be seeded correctly.
 */
function buildPriorGamesMap(matchUp: any): Map<number, [number, number]> {
  const result = new Map<number, [number, number]>();
  const entries = matchUp?.history?.entries;
  if (!Array.isArray(entries)) return result;

  // Track which set each entry belongs to by replaying the entry sequence
  let currentSetIndex = 0;
  const setsWithPoints = new Set<number>();
  const gameScoresPerSet = new Map<number, [number, number]>();

  for (const entry of entries) {
    if (entry.type === 'set') {
      // A set entry means a completed set was added; next entries are in the next set
      currentSetIndex++;
    } else if (entry.type === 'game') {
      // Track the set this game belongs to
      if (!setsWithPoints.has(currentSetIndex)) {
        if (!gameScoresPerSet.has(currentSetIndex)) {
          gameScoresPerSet.set(currentSetIndex, [0, 0]);
        }
        const scores = gameScoresPerSet.get(currentSetIndex)!;
        if (entry.data?.winner === 0) scores[0]++;
        else scores[1]++;
      }
    } else if (entry.type === 'point') {
      // Once we see a point in a set, stop counting game entries for that set
      // Determine which set this point belongs to from its data
      const pointSet = entry.data?.set ?? currentSetIndex;
      setsWithPoints.add(pointSet);
    }
  }

  // Copy results
  for (const [setIndex, scores] of gameScoresPerSet) {
    result.set(setIndex, scores);
  }

  return result;
}

/**
 * Check if the last point in history completed its game.
 * Used when there's no nextPoint to compare against.
 *
 * Compares the set's total game count against the running games total
 * (prior addGame'd games + point-based games completed so far).
 * This avoids relying on point.game which may or may not include
 * the addGame offset depending on the factory version.
 */
function isLastPointGameComplete(matchUp: any, point: any, currentGamesTotal: number): boolean {
  if (matchUp?.winningSide !== undefined) return true;

  const setObj = matchUp?.score?.sets?.[point.set];
  if (!setObj) return false;

  const totalSetGames = (setObj.side1Score ?? 0) + (setObj.side2Score ?? 0);
  return totalSetGames > currentGamesTotal;
}

/**
 * Check if the last point in history completed its set.
 */
function isLastPointSetComplete(matchUp: any, point: any): boolean {
  if (matchUp?.winningSide !== undefined) return true;

  const setObj = matchUp?.score?.sets?.[point.set];
  return setObj?.winningSide !== undefined;
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
