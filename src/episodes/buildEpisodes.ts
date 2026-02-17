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
  let gamesScore: [number, number] = [0, 0];
  let setsScore: [number, number] = [0, 0];
  let currentSet = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const nextPoint = points[i + 1];

    // Detect boundaries
    const gameComplete = nextPoint
      ? nextPoint.game !== point.game || nextPoint.set !== point.set
      : false;
    const setComplete = nextPoint ? nextPoint.set !== point.set : false;
    const isLastPoint = i === points.length - 1;
    const matchComplete = isLastPoint && matchUp?.winningSide !== undefined;

    // Handle set transition: reset per-set accumulators
    if (point.set !== currentSet) {
      setCumulativePoints = [0, 0];
      gamesScore = [0, 0];
      currentSet = point.set;
    }

    // Update cumulative set points
    if (point.winner === 0) setCumulativePoints[0]++;
    else setCumulativePoints[1]++;

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
        breakpoint: point.isBreakpoint ?? false,
        score: displayScore,
        set: point.set,
        game: point.game,
        rallyLength: point.rallyLength,
        result: point.result,
        notation: point.mcpCode,
        tiebreak: point.tiebreak ?? false,
        points: [...setCumulativePoints] as [number, number],
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
        points_to_game: point.pointsToGame ?? [0, 0],
        points_to_set: point.pointsToSet ?? [0, 0],
        games_to_set: point.gamesToSet ?? [0, 0],
      },
      next_service: nextPoint?.server ?? point.server,
      result: true,
      complete: isLastPoint && matchComplete,
    };

    episodes.push(episode);

    // Update running gamesScore after game completion
    if (gameComplete && gameWinner !== undefined) {
      gamesScore[gameWinner]++;
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
