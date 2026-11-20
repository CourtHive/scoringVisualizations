// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { select } from 'd3';
import { scoreGovernor } from 'tods-competition-factory';

import { buildEpisodes } from '../episodes/buildEpisodes';
import { ptsMatch } from '../visualizations/ptsChart';

const { ScoringEngine } = scoreGovernor as any;

// SCORING-102: the factory's v2 kernel omits `needed` tuples for timed, aggregate and outs sets.
// The chart must draw the sets that have tuples, gap the points that lack one, and hide a set with none.

function play(matchUpFormat: string, winners: number[]) {
  const engine = new ScoringEngine({ matchUpFormat });
  for (const winner of winners) engine.addPoint({ winner });
  return buildEpisodes(engine.getState());
}

// happy-dom's SVGTransformList lacks consolidate(), which d3-interpolate calls for `transform`
// tweens; null makes d3 fall back to the identity transform, which these assertions do not read.
const transformList = (globalThis as any).SVGTransformList?.prototype;
if (transformList && !transformList.consolidate) transformList.consolidate = () => null;

/** d3 transitions apply their attrs on a timer, even at duration 0. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

async function render(episodes: any[]) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const chart: any = ptsMatch();
  chart.data(episodes);
  select(container).call(chart);
  chart.update({});
  await settle();
  const setDivs = Array.from(container.querySelectorAll('div.pts')) as HTMLElement[];
  return {
    visible: setDivs.map((div) => div.style.display !== 'none'),
    // one path per player; both must carry a drawn `d` for the per-line assertions to mean anything
    lines: (setIndex: number) => {
      const ds = Array.from(setDivs[setIndex].querySelectorAll('path.ptsChartLine')).map((p) => p.getAttribute('d'));
      expect(ds).toHaveLength(2);
      ds.forEach((d) => expect(d).toMatch(/^M/));
      return ds as string[];
    },
  };
}

/** The x of every vertex of an SVG path, per subpath (`M` starts a new one). */
function subpathXs(d: string): number[][] {
  return d
    .split('M')
    .filter(Boolean)
    .map((segment) => segment.split('L').map((pair) => Number(pair.split(',')[0])));
}

const tiebreakSets = [...Array(7).fill(0), 1, 1];

describe('ptsChart with optional points-to-set tuples (SCORING-102)', () => {
  it('draws every set when all points carry tuples (SET3-S:TB7)', async () => {
    const episodes = play('SET3-S:TB7', tiebreakSets);
    expect(episodes.every((ep: any) => ep.needed?.pointsToSet)).toBe(true);

    const chart = await render(episodes);
    expect(chart.visible.slice(0, 2)).toEqual([true, true]);
    for (const d of chart.lines(0)) {
      const subpaths = subpathXs(d);
      expect(subpaths).toHaveLength(1);
      expect(d).not.toContain('NaN');
    }
  });

  it('does not throw and hides the set when no point carries a tuple (SET1-S:T10)', async () => {
    const episodes = play('SET1-S:T10', [0, 1, 0, 0]);
    expect(episodes.some((ep: any) => ep.needed?.pointsToSet)).toBe(false);

    const chart = await render(episodes);
    expect(chart.visible[0]).toBe(false);
  });

  it('draws the tiebreak sets and hides the timed final set (SET3-S:TB7-F:T10)', async () => {
    const episodes = play('SET3-S:TB7-F:T10', [...Array(7).fill(0), ...Array(7).fill(1), 0, 1, 0]);
    expect(episodes.filter((ep: any) => !ep.needed?.pointsToSet)).toHaveLength(3);

    const chart = await render(episodes);
    expect(chart.visible.slice(0, 3)).toEqual([true, true, false]);
    for (const setIndex of [0, 1]) {
      for (const d of chart.lines(setIndex)) {
        expect(subpathXs(d)).toHaveLength(1);
        expect(d).not.toContain('NaN');
      }
    }
  });

  it('draws a gap, not a zero, for a point without a tuple, keeping point order', async () => {
    const episodes = play('SET3-S:TB7', tiebreakSets).map((ep: any, i: number) =>
      i === 3 ? { ...ep, needed: undefined } : ep,
    );

    const chart = await render(episodes);
    expect(chart.visible[0]).toBe(true);
    for (const d of chart.lines(0)) {
      expect(d).not.toContain('NaN');
      // vertex 0 is the pre-match start, vertex i + 1 is point i: point 3 (vertex 4) is the gap
      const subpaths = subpathXs(d);
      expect(subpaths.map((xs) => xs.length)).toEqual([4, 3]);
      const xs = subpaths.flat();
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
      const step = xs[1] - xs[0];
      expect(subpaths[1][0] - subpaths[0][3]).toBeCloseTo(2 * step);
    }
  });
});
