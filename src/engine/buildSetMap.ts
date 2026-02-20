/**
 * Build a SetMap from ScoringEngine MatchUp state for coronaChart.
 *
 * For each set, computes cumulative point differential (p2sdiff)
 * and extracts gamesScore and winnerIndex.
 */

export interface SetMap {
  p2sdiff: number[];
  gamesScore: [number, number];
  players: [string, string];
  winnerIndex: 0 | 1;
}

export function buildSetMap(matchUp: any, players: [string, string] = ['Player 1', 'Player 2']): SetMap[] {
  const points = matchUp?.history?.points;
  const sets = matchUp?.score?.sets;
  if (!Array.isArray(points) || points.length === 0) return [];

  // Group points by set index
  const setPoints = new Map<number, any[]>();
  for (const pt of points) {
    const setIdx = pt.set ?? 0;
    if (!setPoints.has(setIdx)) setPoints.set(setIdx, []);
    setPoints.get(setIdx)!.push(pt);
  }

  const result: SetMap[] = [];

  for (const [setIdx, pts] of setPoints) {
    let diff = 0;
    const diffs: number[] = [];
    for (const pt of pts) {
      diff += pt.winner === 0 ? 1 : -1;
      diffs.push(diff);
    }

    const setData = Array.isArray(sets) ? sets[setIdx] : undefined;
    const gamesScore: [number, number] = setData
      ? [setData.side1Score ?? 0, setData.side2Score ?? 0]
      : [0, 0];

    const winnerIdx: 0 | 1 = setData?.winningSide === 2 ? 1 : 0;

    result.push({
      p2sdiff: diffs,
      gamesScore: gamesScore,
      players,
      winnerIndex: winnerIdx,
    });
  }

  return result;
}
