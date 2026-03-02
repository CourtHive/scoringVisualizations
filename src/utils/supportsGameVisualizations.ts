/**
 * Determines whether a matchUpFormat supports gameTree and gameFish visualizations.
 *
 * These visualizations assume tennis-style game scoring (0→15→30→40→G with
 * deuce/advantage) and are inappropriate when:
 *   - Sets are timed (no discrete game structure)
 *   - The game format (`-G:`) is not TRADITIONAL (e.g., consecutive or aggregate)
 *   - The format uses a non-SET root (team sports like soccer, basketball, etc.)
 *
 * When `-G:` is absent, standard tennis scoring is implied (appropriate).
 * TRADITIONAL with deuceAfter (e.g., padel star point) is still appropriate.
 */
export function supportsGameVisualizations(matchUpFormat: string | undefined): boolean {
  if (!matchUpFormat) return false;

  // Standalone timed formats start with 'T' (e.g., 'T20', 'T10P')
  if (/^T\d/.test(matchUpFormat)) return false;

  // Non-SET roots (HAL, QTR, PER, INN, RND, FRM, MAP, MAT) are team/combat sports
  if (/^(HAL|QTR|PER|INN|RND|FRM|MAP|MAT)\d/.test(matchUpFormat)) return false;

  // Timed sets: -S:T{minutes}
  if (/-S:T\d/.test(matchUpFormat)) return false;

  // If -G: section is present, it must be TN (with optional deuceAfter)
  const gameMatch = /-G:([^-]+)/.exec(matchUpFormat);
  if (gameMatch) {
    const gameValue = gameMatch[1];
    // TN with optional deuceAfter (e.g., TN, TN1D, TN3D)
    if (!/^TN(\d+D)?$/.test(gameValue)) return false;
  }

  return true;
}
