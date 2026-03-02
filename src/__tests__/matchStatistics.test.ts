import { buildEpisodes } from "../episodes/buildEpisodes";
import { scoreGovernor } from "tods-competition-factory";
import { feedMatchUp } from "../engine/feedMatchUp";
import { describe, it, expect } from "vitest";
import {
  computeMatchStats,
  computeMatchStatsFromMatchUp,
} from "../statistics/matchStatistics";

const { ScoringEngine } = scoreGovernor;

/** Helper: build a two-set ScoringEngine state where player 0 wins set 1 (6-0) and set 2 starts. */
function buildTwoSetMatchUp() {
  const engine = new ScoringEngine({ matchUpFormat: "SET3-S:6/TB7" });

  // Set 1: player 0 wins 6 games to 0 (24 points)
  for (let game = 0; game < 6; game++) {
    const server = game % 2 === 0 ? 0 : 1;
    for (let pt = 0; pt < 4; pt++) {
      engine.addPoint({ winner: 0 as 0 | 1, server: server });
    }
  }

  // Set 2: add a few points so set 2 has data
  engine.addPoint({ winner: 1, server: 0 });
  engine.addPoint({ winner: 1, server: 0 });
  engine.addPoint({ winner: 0, server: 0 });

  return engine.getState();
}

describe("computeMatchStats", () => {
  it("returns stats for the full match when no setFilter", () => {
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    const stats = computeMatchStats(episodes);

    expect(stats.length).toBeGreaterThan(0);
  });

  it("returns empty array for empty episodes", () => {
    expect(computeMatchStats([])).toEqual([]);
  });

  it("filters episodes by set when setFilter is provided", () => {
    const matchUp = buildTwoSetMatchUp();
    const episodes = buildEpisodes(matchUp);

    const set0Episodes = episodes.filter((ep) => ep.point.set === 0);
    const set1Episodes = episodes.filter((ep) => ep.point.set === 1);

    // Sanity: both sets have episodes
    expect(set0Episodes.length).toBeGreaterThan(0);
    expect(set1Episodes.length).toBeGreaterThan(0);

    const allStats = computeMatchStats(episodes);
    const set0Stats = computeMatchStats(episodes, 0);
    const set1Stats = computeMatchStats(episodes, 1);

    // Filtered stats should exist
    expect(set0Stats.length).toBeGreaterThan(0);
    expect(set1Stats.length).toBeGreaterThan(0);

    // Set-filtered stats should differ from match stats (different point counts)
    const totalPoints = (stats: any[]) => {
      const tp = stats.find((s: any) => s.label === "Total Points Won");
      return tp ? [tp.valueA, tp.valueB] : undefined;
    };

    const matchTotal = totalPoints(allStats);
    const set0Total = totalPoints(set0Stats);
    const set1Total = totalPoints(set1Stats);

    if (matchTotal && set0Total && set1Total) {
      // Set totals should sum to match total
      expect(set0Total[0] + set1Total[0]).toBe(matchTotal[0]);
      expect(set0Total[1] + set1Total[1]).toBe(matchTotal[1]);
    }
  });

  it("returns empty array when setFilter matches no episodes", () => {
    const matchUp = buildTwoSetMatchUp();
    const episodes = buildEpisodes(matchUp);

    const stats = computeMatchStats(episodes, 99);
    expect(stats).toEqual([]);
  });
});

describe("computeMatchStatsFromMatchUp", () => {
  it("returns stats for the full match when no setFilter", () => {
    const matchUp = feedMatchUp(0);
    const stats = computeMatchStatsFromMatchUp(matchUp);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("filters by set when setFilter is provided", () => {
    const matchUp = buildTwoSetMatchUp();

    const allStats = computeMatchStatsFromMatchUp(matchUp);
    const set0Stats = computeMatchStatsFromMatchUp(matchUp, 0);

    expect(allStats.length).toBeGreaterThan(0);
    expect(set0Stats.length).toBeGreaterThan(0);
  });

  it("returns empty array for non-existent set", () => {
    const matchUp = buildTwoSetMatchUp();
    const stats = computeMatchStatsFromMatchUp(matchUp, 99);
    expect(stats).toEqual([]);
  });
});
