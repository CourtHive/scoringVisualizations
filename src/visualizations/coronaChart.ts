/* eslint-disable */
// @ts-nocheck
/**
 * Corona Chart - Migrated to D3 v7
 * Displays point-by-point score differentials in a radial/circular format
 */

import { scaleLinear, radialArea, curveBasis, select } from "d3";
import { buildSetMap } from "../engine/buildSetMap";

type Selection<A, B, C, D> = import("d3").Selection<A, B, C, D>;

function sum(arr: number[]): number {
  return arr.reduce((sum, val) => sum + Number.parseFloat(val.toString()), 0);
}

/**
 * Helper to create ranges from indices.
 */
function createRanges(indices: number[], someArray: number[]): number[][] {
  const ranges: number[][] = [];
  for (let r = 0; r < indices.length - 1; r++) {
    ranges.push([indices[r], indices[r + 1]]);
  }
  const lastIndex = indices.at(-1) ?? 0;
  ranges.push([lastIndex, someArray.length]);
  return ranges;
}

function sliceData(ranges: number[][], data: number[]): number[][] {
  const slices: number[][] = [];
  for (const range of ranges) {
    const slice = data.slice(range[0], range[1] + 1);
    slices.push(slice);
  }
  return slices;
}

function indicesOf(_something: number, data: number[]): number[] {
  let next = 0;
  let position = -1;
  const indices: number[] = [];
  while (next >= 0) {
    next = data.slice(position + 1).indexOf(0);
    position += next + 1;
    if (next >= 0) indices.push(position);
  }
  return indices;
}
interface SetMap {
  p2sdiff: number[];
  games_score?: [number, number];
  players?: [string, string];
  winner_index?: 0 | 1;
}

interface CoronaPrefs {
  width: number;
  height: number;
  radius: number;
  colors: string[] | { 0: string; 1: string; reverse?: boolean };
  display: {
    info?: boolean;
    badge?: boolean | string;
    home?: boolean;
  };
  context?: {
    playerName?: string;
  };
  muid?: string;
  functions?: {
    mouseover?: (d: any) => void;
    click_name?: (name: string) => void;
    click_score?: (name: string) => void;
  };
}

const FONT_WEIGHT_BOLD = "bold";
const FONT_WEIGHT = "font-weight";
const TEXT_ANCHOR = "text-anchor";

export function coronaChart(
  target: Selection<any, any, any, any>,
  set_map: SetMap[],
  prefs: CoronaPrefs,
  x: number = 0,
  y: number = 0,
): void {
  // Handle color configuration
  let colors: { 0: string; 1: string };
  if (Array.isArray(prefs.colors)) {
    colors = { 0: prefs.colors[0], 1: prefs.colors[1] };
  } else if ((prefs.colors as any).reverse) {
    colors = { 0: (prefs.colors as any)[1], 1: (prefs.colors as any)[0] };
  } else {
    colors = prefs.colors as { 0: string; 1: string };
  }

  // Combine all score differentials
  let data: number[] = [];
  for (const set of set_map) {
    data = data.concat(set.p2sdiff);
  }
  const max = 24; // Fixed maximum for consistent scaling

  const pts_corona = target
    .append("svg:g")
    .attr("class", "pts_corona")
    .attr("width", prefs.width)
    .attr("height", prefs.height)
    .attr("transform", `translate(${x},${y})`);

  // Display options
  if (prefs.display.info) {
    scoreDisplay();
  } else if (prefs.display.badge) {
    badgeDisplay();
  }
  // homeDisplay removed - was just promotional overlay

  // D3 v7: scaleLinear remains the same
  const radius = scaleLinear()
    .domain([0, max])
    .range([prefs.radius / 4, prefs.radius / 2]);

  const angle = scaleLinear()
    .domain([0, data.length - 1])
    .range([0, 2 * Math.PI]);

  // Create clip path
  pts_corona
    .append("clipPath")
    .attr("id", "clip")
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", radius((max / 24) * 8));

  const indices = indicesOf(0, data);
  const ranges = createRanges(indices, data);
  const slices = sliceData(ranges, data);

  // Create segments for each slice with different opacity layers
  for (let s = 0; s < slices.length; s++) {
    const total = sum(slices[s]);
    const player_color = total < 0 ? colors[0] : colors[1];
    const slice = total < 0 ? slices[s].map(Math.abs) : slices[s];

    // Three layers with different opacities
    segment(slice, ranges[s][0], player_color, 0.4);

    const lmt1 = (max / 24) * 8;
    const slice2nds = slices[s].map((val) => {
      if (val > lmt1) return val - lmt1;
      if (val < -lmt1) return Math.abs(val) - lmt1;
      return 0;
    });
    segment(slice2nds, ranges[s][0], player_color, 0.6);

    const lmt2 = (max / 24) * 8 * 2;
    const slice3rds = slices[s].map((val) => {
      if (val > lmt2) return val - lmt2;
      if (val < -lmt2) return Math.abs(val) - lmt2;
      return 0;
    });
    segment(slice3rds, ranges[s][0], player_color, 1);
  }

  function segment(
    subset: number[],
    offset: number,
    player_color: string,
    opacity: number,
  ): void {
    // D3 v7: radialArea remains the same
    const area = radialArea<number>()
      .curve(curveBasis)
      .innerRadius(radius(0))
      .outerRadius((d: number) => radius(d))
      .angle((d: number, i: number) => angle(offset + i));

    // D3 v7: Event handler signature changed - event is first parameter
    const svg = pts_corona
      .append("g")
      .datum(subset)
      .attr("width", prefs.width)
      .attr("height", prefs.height)
      .append("g")
      .attr("transform", `translate(${prefs.width / 2},${prefs.height / 2})`)
      .on("mouseover", function (event: any, d: any) {
        if (prefs.functions?.mouseover) {
          prefs.functions.mouseover(d);
        }
      });

    svg
      .append("path")
      .attr("class", "area")
      .attr("clip-path", "url(#clip)")
      .attr("fill", player_color)
      .attr("opacity", opacity)
      .attr("d", area);
  }

  function badgeDisplay(): void {
    const lastSet = set_map.at(-1);
    pts_corona
      .append("a")
      .attr("target", "_blank")
      .attr("xlink:href", () => {
        if (prefs.muid) {
          if (prefs.context?.playerName) {
            return `/viewpro/browse.html?playerName=${prefs.context.playerName}&&muid=${prefs.muid}`;
          } else {
            return `/viewpro/?muid=${prefs.muid}`;
          }
        }
        return "#";
      })
      .append("text")
      .attr("font-size", "14px")
      .attr("fill", colors[lastSet?.winner_index || 0])
      .attr(FONT_WEIGHT, FONT_WEIGHT_BOLD)
      .attr(TEXT_ANCHOR, "middle")
      .attr("x", 0)
      .attr("y", 0)
      .text(prefs.display.badge)
      .attr(
        "transform",
        `translate(${prefs.width / 2},${prefs.height / 2 + 5})`,
      );
  }

  function scoreDisplay(): void {
    // Build game score strings for each player
    const score_string: { 0: string; 1: string } = { 0: "", 1: "" };
    for (const set of set_map) {
      if (set.games_score) {
        score_string[0] += set.games_score[0] + " ";
        score_string[1] += set.games_score[1] + " ";
      }
    }
    score_string[0] = score_string[0].trim();
    score_string[1] = score_string[1].trim();

    const players = set_map[0].players || ["Player 1", "Player 2"];
    const lastName = (name: string) => name.split(" ").pop() || name;

    // D3 v7: Event handler signature changed - event is first parameter
    pts_corona
      .append("text")
      .attr("font-size", "18px")
      .attr("fill", colors[0])
      .attr(FONT_WEIGHT, FONT_WEIGHT_BOLD)
      .attr(TEXT_ANCHOR, "middle")
      .attr("x", 0)
      .attr("y", 0)
      .text(lastName(players[0]))
      .attr(
        "transform",
        `translate(${prefs.width / 2},${prefs.height / 2 - 35})`,
      )
      .on("click", function (_event: any) {
        if (prefs.functions?.click_name) {
          prefs.functions.click_name(players[0]);
        }
      });

    pts_corona
      .append("text")
      .attr("font-size", "16px")
      .attr("fill", colors[0])
      .attr(FONT_WEIGHT, "bold")
      .attr(TEXT_ANCHOR, "middle")
      .attr("x", 0)
      .attr("y", 0)
      .text(score_string[0])
      .attr(
        "transform",
        `translate(${prefs.width / 2},${prefs.height / 2 - 8})`,
      )
      .on("click", function (_event: any) {
        if (prefs.functions?.click_score) {
          prefs.functions.click_score(players[0]);
        }
      });

    pts_corona
      .append("text")
      .attr("font-size", "18px")
      .attr("fill", colors[1])
      .attr(FONT_WEIGHT, "bold")
      .attr(TEXT_ANCHOR, "middle")
      .attr("x", 0)
      .attr("y", 0)
      .text(lastName(players[1]))
      .attr(
        "transform",
        `translate(${prefs.width / 2},${prefs.height / 2 + 45})`,
      )
      .on("click", function (_event: any) {
        if (prefs.functions?.click_name) {
          prefs.functions.click_name(players[1]);
        }
      });

    pts_corona
      .append("text")
      .attr("font-size", "16px")
      .attr("fill", colors[1])
      .attr(FONT_WEIGHT, "bold")
      .attr(TEXT_ANCHOR, "middle")
      .attr("x", 0)
      .attr("y", 0)
      .text(score_string[1])
      .attr(
        "transform",
        `translate(${prefs.width / 2},${prefs.height / 2 + 13})`,
      )
      .on("click", function (_event: any) {
        if (prefs.functions?.click_score) {
          prefs.functions.click_score(players[1]);
        }
      });
  }
}

/**
 * Companion function: render coronaChart directly from a ScoringEngine MatchUp.
 * Clears target container, creates SVG, builds setMap from MatchUp, and renders.
 */
export function coronaChartFromMatchUp(
  container: HTMLElement,
  matchUp: any,
  options?: {
    width?: number;
    height?: number;
    radius?: number;
    colors?: string[];
    players?: [string, string];
    display?: { info?: boolean; badge?: boolean | string; home?: boolean };
  },
): void {
  // Auto-size to container if no explicit dimensions given
  const rect = container.getBoundingClientRect();
  const width = options?.width ?? Math.max(rect.width, 400);
  const height = options?.height ?? Math.max(rect.height, 400);
  const size = Math.min(width, height);
  const players: [string, string] = options?.players ?? [
    "Player 1",
    "Player 2",
  ];

  // Clear previous SVG
  select(container).selectAll("svg").remove();

  const setMap = buildSetMap(matchUp, players);
  if (setMap.length === 0) return;

  const svg = select(container)
    .append("svg")
    .attr("width", size)
    .attr("height", size);

  const prefs: CoronaPrefs = {
    width: size,
    height: size,
    radius: options?.radius ?? size * 1.35,
    colors: options?.colors ?? ["#a55194", "#6b6ecf"],
    display: options?.display ?? { info: false, badge: false, home: false },
    functions: {},
  };

  coronaChart(svg as any, setMap, prefs, 0, 0);
}
