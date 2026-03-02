/**
 * Determines whether a matchUpFormat supports the Points-to-Set (PTS) visualization.
 *
 * PTS counts down "minimum points needed to win the current set" for each player.
 * It requires a SET-based format with a discrete point endpoint — timed sets have
 * no known point endpoint, making PTS meaningless.
 *
 * Unlike `supportsGameVisualizations`, PTS does NOT require traditional game scoring.
 * Non-traditional games (aggregate `-G:AG`, consecutive `-G:3C`) still have countable
 * points toward a set endpoint, so they are supported.
 */
export function supportsPointsToVisualization(matchUpFormat: string | undefined): boolean {
  if (!matchUpFormat) return false;

  // Standalone timed formats start with 'T' (e.g., 'T20', 'T10P')
  if (/^T\d/.test(matchUpFormat)) return false;

  // Non-SET roots (HAL, QTR, PER, INN, RND, FRM, MAP, MAT) are team/combat sports
  if (/^(HAL|QTR|PER|INN|RND|FRM|MAP|MAT)\d/.test(matchUpFormat)) return false;

  // Timed sets: -S:T{minutes}
  if (/-S:T\d/.test(matchUpFormat)) return false;

  return true;
}
