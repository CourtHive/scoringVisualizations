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

  // Track running state
  let setCumulativePoints: [number, number] = [0, 0];
  let gamePointCounts: [number, number] = [0, 0];
  let gamesScore: [number, number] = [0, 0];
  let setsScore: [number, number] = [0, 0];
  let currentSet = 0;
  let currentGame = 0;

  // Build a map of prior game scores per set from the entries timeline.
  // This accounts for games added via addGame() that have no point data.
  const priorGamesPerSet = buildPriorGamesMap(matchUp);

  // Seed gamesScore for the first point's set
  const firstPoint = points[0];
  if (firstPoint) {
    const setIndex = firstPoint.set ?? 0;
    gamesScore = [...(priorGamesPerSet.get(setIndex) || [0, 0])] as [number, number];
    currentSet = setIndex;
    currentGame = firstPoint.game ?? 0;
  }

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const nextPoint = points[i + 1];

    // Detect boundaries
    const gameComplete = nextPoint
      ? nextPoint.game !== point.game || nextPoint.set !== point.set
      : isLastPointGameComplete(matchUp, point, gamesScore[0] + gamesScore[1]);
    const setComplete = nextPoint
      ? nextPoint.set !== point.set
      : isLastPointSetComplete(matchUp, point);
    const isLastPoint = i === points.length - 1;
    const matchComplete = isLastPoint && matchUp?.winningSide !== undefined;

    // Handle set transition: reset per-set accumulators
    if (point.set !== currentSet) {
      setCumulativePoints = [0, 0];
      gamePointCounts = [0, 0];
      // Seed gamesScore from prior games in the new set
      gamesScore = [...(priorGamesPerSet.get(point.set) || [0, 0])] as [number, number];
      currentSet = point.set;
      currentGame = point.game;
    }

    // Handle game transition: reset within-game point counts
    if (point.game !== currentGame) {
      gamePointCounts = [0, 0];
      currentGame = point.game;
    }

    // Update cumulative set points
    if (point.winner === 0) setCumulativePoints[0]++;
    else setCumulativePoints[1]++;

    // Update within-game point counts
    if (point.winner === 0) gamePointCounts[0]++;
    else gamePointCounts[1]++;

    // Determine game winner when game completes
    const isGameEnd = gameComplete || (isLastPoint && matchComplete);
    let gameWinner: number | undefined;
    if (isGameEnd) {
      gameWinner = point.winner;
    }

    // Update games score AFTER determining game winner
    const episodeGamesScore: [number, number] = [...gamesScore];
    if (isGameEnd && gameWinner !== undefined) {
      episodeGamesScore[gameWinner]++;
    }

    // Determine set winner
    const isSetEnd = setComplete || (isLastPoint && matchComplete);
    let setWinner: number | undefined;
    if (isSetEnd) {
      setWinner = sideToIndex(deriveSetWinner(matchUp, point.set));
    }

    // Build cumulative sets array with current scores
    const episodeSetsScore: [number, number] = [...setsScore];
    if (isSetEnd && setWinner !== undefined) {
      episodeSetsScore[setWinner]++;
    }
    const setsArray = buildSetsArray(matchUp, point.set);

    // Score display: show "G" for game-completing points
    const displayScore = isGameEnd ? 'G' : point.score || '';

    const episode: Episode = {
      action: 'addPoint',
      point: {
        winner: point.winner,
        server: point.server,
        pointNumber: point.pointNumber,
        index: point.index ?? i,
        isBreakpoint: point.isBreakpoint ?? false,
        score: displayScore,
        set: point.set,
        game: point.game,
        rallyLength: point.rallyLength,
        result: point.result,
        notation: point.mcpCode,
        tiebreak: point.tiebreak ?? false,
        serve: point.serve, // 1 = first serve, 2 = second serve
        points: [...gamePointCounts] as [number, number],
        setCumulativePoints: [...setCumulativePoints] as [number, number],
      },
      game: {
        complete: isGameEnd,
        winner: gameWinner,
        games: episodeGamesScore,
        index: point.game,
      },
      set: {
        complete: isSetEnd,
        winner: setWinner,
        sets: setsArray,
        index: point.set,
      },
      needed: {
        pointsToGame: point.pointsToGame ?? [0, 0],
        pointsToSet: point.pointsToSet ?? [0, 0],
        gamesToSet: point.gamesToSet ?? [0, 0],
      },
      nextService: nextPoint?.server ?? point.server,
      result: true,
      complete: isLastPoint && matchComplete,
    };

    episodes.push(episode);

    // Update running gamesScore after game completion
    if (gameComplete && gameWinner !== undefined) {
      gamesScore[gameWinner]++;
      gamePointCounts = [0, 0];
    }

    // Update running setsScore after set completion
    if (setComplete && setWinner !== undefined) {
      setsScore[setWinner]++;
      // Reset gamesScore for new set
      gamesScore = [0, 0];
    }
  }

  return episodes;
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
