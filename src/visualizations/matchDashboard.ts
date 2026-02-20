/**
 * Match Dashboard — Cross-visualization coordination layer (D3 v7)
 *
 * Creates a CSS-grid layout with ptsHorizon, coronaChart, statView,
 * gameTree, and rallyTree. Wires ptsHorizon brush events to filter
 * all sub-charts simultaneously.
 *
 * Inspired by legacy matchView.js displayPoints() coordination.
 */

import { select } from "d3";
import { ptsHorizon } from "./ptsHorizon";
import { coronaChart, coronaChartFromMatchUp } from "./coronaChart";
import { statView } from "./statView";
import { gameTree } from "./gameTree";
import { rallyTree } from "./rallyTree";
import { buildEpisodes } from "../episodes/buildEpisodes";
import { computeMatchStats } from "../statistics/matchStatistics";
import type { Episode } from "../episodes/types";

interface DashboardOptions {
  colors: [string, string];
  players: [string, string];
  display: {
    ptsHorizon: boolean;
    coronaChart: boolean;
    statView: boolean;
    gameTree: boolean;
    rallyTree: boolean;
  };
}

interface DashboardCharts {
  ptsHorizonChart: ReturnType<typeof ptsHorizon>;
  statViewChart: ReturnType<typeof statView>;
  gameTreeChart: ReturnType<typeof gameTree>;
  rallyTreeChart: ReturnType<typeof rallyTree>;
}

export function matchDashboard() {
  let container: HTMLElement;
  let allEpisodes: Episode[] = [];
  let matchUpState: any;
  let mounted = false;

  const options: DashboardOptions = {
    colors: ["#a55194", "#6b6ecf"],
    players: ["Player 1", "Player 2"],
    display: {
      ptsHorizon: true,
      coronaChart: true,
      statView: true,
      gameTree: true,
      rallyTree: true,
    },
  };

  // ── Sub-chart instances ────────────────────────────────────────

  const charts: DashboardCharts = {
    ptsHorizonChart: ptsHorizon(),
    statViewChart: statView(),
    gameTreeChart: gameTree(),
    rallyTreeChart: rallyTree(),
  };

  // ── DOM containers ─────────────────────────────────────────────

  let horizonDiv: HTMLDivElement;
  let coronaDiv: HTMLDivElement;
  let statsDiv: HTMLDivElement;
  let gameTreeDiv: HTMLDivElement;
  let rallyTreeDiv: HTMLDivElement;

  // ── Create layout ──────────────────────────────────────────────

  function dashboard(el: HTMLElement) {
    container = el;
    container.innerHTML = "";

    // CSS grid: ptsHorizon full width top; 3-column body below
    container.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto minmax(500px, 1fr);
      gap: 8px;
      width: 100%;
    `;

    // Row 1: Horizon (full width)
    horizonDiv = document.createElement("div");
    horizonDiv.style.cssText = "grid-column: 1 / -1; min-height: 80px;";
    container.appendChild(horizonDiv);

    // Row 2, Col 1: Corona chart
    coronaDiv = document.createElement("div");
    coronaDiv.style.cssText =
      "min-height: 300px; display: flex; align-items: center; justify-content: center;";
    container.appendChild(coronaDiv);

    // Row 2, Col 2: Stat view
    statsDiv = document.createElement("div");
    statsDiv.style.cssText = "min-height: 200px; overflow: hidden;";
    container.appendChild(statsDiv);

    // Row 2, Col 3: GameTree + RallyTree stacked
    const rightCol = document.createElement("div");
    rightCol.style.cssText =
      "display: flex; flex-direction: column; align-items: center; gap: 12px; min-height: 500px;";
    container.appendChild(rightCol);

    gameTreeDiv = document.createElement("div");
    gameTreeDiv.style.cssText = "flex: 1; width: 100%; min-height: 280px;";
    rightCol.appendChild(gameTreeDiv);

    rallyTreeDiv = document.createElement("div");
    rallyTreeDiv.style.cssText = "flex: 1; width: 100%; min-height: 250px; display: flex; justify-content: center;";
    rightCol.appendChild(rallyTreeDiv);

    // ── Initialize sub-charts ─────────────────────────────────

    // ptsHorizon
    charts.ptsHorizonChart.options({
      display: {
        sizeToFit: true,
        bands: 3,
        mode: "mirror",
        transitionTime: 0,
      },
      elements: { brush: true },
    });
    charts.ptsHorizonChart.colors(options.colors);
    charts.ptsHorizonChart.events({
      brush: { start: null, brushing: null, end: filterAll },
    });
    select(horizonDiv).call(charts.ptsHorizonChart as any);

    // statView
    charts.statViewChart.colors(options.colors);
    select(statsDiv).call(charts.statViewChart as any);

    // gameTree
    charts.gameTreeChart.options({
      display: { sizeToFit: true, showEmpty: false, noAd: false, showImages: false },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: { colors: { 0: options.colors[0], 1: options.colors[1], neutral: '#ecf0f1' } },
      labels: { Player: options.players[0], Opponent: options.players[1] },
    });
    select(gameTreeDiv).call(charts.gameTreeChart as any);

    // rallyTree
    charts.rallyTreeChart.options({
      display: { sizeToFit: true },
      areas: { colors: { 0: options.colors[0], 1: options.colors[1] } },
    });
    select(rallyTreeDiv).call(charts.rallyTreeChart as any);

    mounted = true;
  }

  // ── Brush filter handler ───────────────────────────────────────

  function filterAll(extent: [number, number]) {
    const start = Math.floor(extent[0]);
    const end = Math.ceil(extent[1]);

    // Slice episodes to selected range
    const filtered =
      end - start > 1 ? allEpisodes.slice(start, end) : allEpisodes;

    // Update gameTree
    if (options.display.gameTree) {
      charts.gameTreeChart.data(filtered);
      charts.gameTreeChart.update();
    }

    // Update rallyTree
    if (options.display.rallyTree) {
      const pts = filtered.map((ep) => ({
        winner: ep.point.winner as 0 | 1,
        result: ep.point.result,
        rallyLength: ep.point.rallyLength ?? 2,
      }));
      charts.rallyTreeChart.data(pts);
      charts.rallyTreeChart.update();
    }

    // Update statView
    if (options.display.statView) {
      charts.statViewChart.data(computeMatchStats(filtered));
      charts.statViewChart.update();
    }

    // Update coronaChart (re-render from filtered data)
    if (options.display.coronaChart && matchUpState) {
      renderCorona(filtered);
    }
  }

  // ── Corona re-render ──────────────────────────────────────────

  function renderCorona(episodes?: Episode[]) {
    select(coronaDiv).selectAll("*").remove();

    if (!episodes || episodes.length === 0) return;

    // Build a pseudo-setmap from filtered episodes
    const diffs: number[] = [];
    let diff = 0;
    for (const ep of episodes) {
      diff += ep.point.winner === 0 ? 1 : -1;
      diffs.push(diff);
    }

    const size = Math.min(
      coronaDiv.clientWidth || 200,
      coronaDiv.clientHeight || 200,
    );
    const svg = select(coronaDiv)
      .append("svg")
      .attr("width", size)
      .attr("height", size);

    coronaChart(
      svg as any,
      [
        {
          p2sdiff: diffs,
          gamesScore: [0, 0],
          players: options.players,
          winnerIndex: 0,
        },
      ],
      {
        width: size,
        height: size,
        radius: size * 1.35,
        colors: options.colors,
        display: { info: false, badge: false },
      },
    );
  }

  // ── Public API ─────────────────────────────────────────────────

  dashboard.matchUp = function (state: any, players?: [string, string]) {
    matchUpState = state;
    if (players) options.players = players;

    allEpisodes = buildEpisodes(state);

    // Feed each chart
    charts.ptsHorizonChart.matchUp(state, options.players);
    charts.statViewChart.data(computeMatchStats(allEpisodes));
    charts.gameTreeChart.matchUp(state, options.players);
    charts.rallyTreeChart.matchUp(state);

    return dashboard;
  };

  dashboard.update = function () {
    if (!mounted) return;

    // Defer to requestAnimationFrame so the browser has completed grid
    // layout — sizeToFit measurements need accurate getBoundingClientRect.
    requestAnimationFrame(() => {
      charts.ptsHorizonChart.update();
      charts.statViewChart.update();
      charts.gameTreeChart.update();
      charts.rallyTreeChart.update();

      // Render corona
      if (options.display.coronaChart && matchUpState && allEpisodes.length > 0) {
        coronaChartFromMatchUp(coronaDiv, matchUpState, {
          colors: options.colors,
          players: options.players,
          display: { info: true },
        });
      }
    });
  };

  dashboard.options = function (values?: Partial<DashboardOptions>) {
    if (!arguments.length) return options;
    if (values) {
      if (values.colors) options.colors = values.colors;
      if (values.players) options.players = values.players;
      if (values.display) Object.assign(options.display, values.display);
    }
    return dashboard;
  };

  dashboard.charts = function (): DashboardCharts {
    return charts;
  };

  return dashboard;
}
