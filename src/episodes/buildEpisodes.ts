import type { Episode } from './types';

/**
 * Transforms a TODS MatchUp's point history into an episode array
 * suitable for visualization components (GameTree, Momentum, PTS).
 *
 * @param matchUp - A TODS MatchUp object (from ScoringEngine.getState())
 * @returns Episode[] - Array of episodes, one per point played
 */
export function buildEpisodes(matchUp: any): Episode[] {
  const points = matchUp?.history?.points;
  if (!Array.isArray(points) || points.length === 0) return [];

  const episodes: Episode[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const nextPoint = points[i + 1];

    const gameComplete = nextPoint ? nextPoint.game !== point.game || nextPoint.set !== point.set : false;
    const setComplete = nextPoint ? nextPoint.set !== point.set : false;

    // Derive game winner: when game completes, compare game scores
    let gameWinner: number | undefined;
    if (gameComplete && nextPoint) {
      // The side whose game count increased from this point to the next
      const currentGames = parseGames(point.score, point.set);
      const nextGames = parseGames(nextPoint.score, nextPoint.set !== point.set ? nextPoint.set : point.set);
      if (nextGames && currentGames) {
        if (nextPoint.set !== point.set) {
          // Set ended — winner is determined by set result
          gameWinner = deriveSetWinner(matchUp, point.set);
        } else {
          gameWinner = nextGames[0] > currentGames[0] ? 1 : 2;
        }
      }
    }

    // Derive set winner
    let setWinner: number | undefined;
    if (setComplete) {
      setWinner = deriveSetWinner(matchUp, point.set);
    }

    // Build sets array (cumulative set scores)
    const setsArray = buildSetsArray(matchUp, point.set);

    const isLastPoint = i === points.length - 1;
    const matchComplete = isLastPoint && matchUp?.winningSide !== undefined;

    const episode: Episode = {
      action: 'addPoint',
      point: {
        winner: point.winner,
        server: point.server,
        pointNumber: point.pointNumber,
        index: point.index ?? i,
        breakpoint: point.isBreakpoint ?? false,
        score: point.score,
        set: point.set,
        game: point.game,
      },
      game: {
        complete: gameComplete || (isLastPoint && matchComplete),
        winner: gameWinner ?? (isLastPoint && matchComplete ? deriveSetWinner(matchUp, point.set) : undefined),
        games: parseGames(point.score, point.set) ?? [0, 0],
        index: point.game,
      },
      set: {
        complete: setComplete || (isLastPoint && matchComplete),
        winner: setWinner ?? (isLastPoint && matchComplete ? deriveSetWinner(matchUp, point.set) : undefined),
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
  }

  return episodes;
}

function deriveSetWinner(matchUp: any, setIndex: number): number | undefined {
  const sets = matchUp?.score?.sets;
  if (!Array.isArray(sets) || !sets[setIndex]) return undefined;
  return sets[setIndex].winningSide;
}

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

function parseGames(score: string, setIndex: number): number[] | null {
  if (!score) return null;
  const sets = score.split(/\s+/);
  const current = sets[setIndex];
  if (!current) return null;
  const parts = current.split('-');
  if (parts.length < 2) return null;
  return [parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0];
}
