import { createPlaybackEngine } from "../engine/createPlaybackEngine";
import { feedMatchUp, getMcpFixture } from "../engine/feedMatchUp";
import { createPlaybackControlsUI } from "./helpers/PlaybackControls";
import { buildEpisodes } from "../episodes/buildEpisodes";
import { supportsGameVisualizations } from "../utils/supportsGameVisualizations";
import type { Meta, StoryObj } from "@storybook/html";
import { gameTree } from "./gameTree";
import { select } from "d3";
import {
  sampleGamePoints,
  deuceGamePoints,
  noAdGamePoints,
  pointsToEpisodes,
} from "./data/sampleGame";

interface GameTreeArgs {
  showImages: boolean;
  sizeToFit: boolean;
  showEmpty: boolean;
  noAd: boolean;
  matchIndex?: number;
  delayMs?: number;
}

/**
 * Game Tree — Point Progression via Sankey Diagram
 *
 * "Game Tree" is a depiction of Point Progression for a selection of games
 * within a tennis match or across a series of matches. Games start at 0-0
 * and "progress" through the tree until a player wins the game. The
 * visualization possesses the Markov property: future states are constrained
 * by the current score at any moment in a game.
 *
 * The thickness of the lines connecting any two scores indicates the number
 * of points which "progressed" between the two nodes. The color of lines
 * indicates the percentage of points won due to Winners (green) and
 * Errors (red).
 *
 * The two circles in the upper-left are "Selectors" — click to choose which
 * player's service games to view. Deselecting both shows all points
 * regardless of server. Clicking an already-selected player removes all
 * filters, restoring the initial unfiltered view.
 *
 * Hovering over point lines displays the number of points that progressed
 * between two nodes; hovering over a point node displays the percentage of
 * games won from that score position.
 *
 * Original design (c) GameSetMap (Damien Saunder & David Webb). The first
 * known application of a Sankey Diagram / Harness Flow Map to Point
 * Progression in Tennis. Reproduced and enhanced with permission.
 *
 * @see https://tennisviz.blogspot.com/2015/10/game-tree.html
 */
const meta: Meta<GameTreeArgs> = {
  title: "Visualizations/GameTree",
  tags: ["autodocs"],
  render: (args) => {
    // Create container
    const container = document.createElement("div");
    container.id = "game-tree-container";
    container.style.width = "100%";
    container.style.height = "600px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    // Create chart
    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
      lines: {
        points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: {
          0: "#a55194",
          1: "#6b6ecf",
          neutral: "#ecf0f1",
        },
      },
    });

    const episodes = pointsToEpisodes(sampleGamePoints);
    chart.data(episodes);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
  argTypes: {
    showImages: { control: "boolean" },
    sizeToFit: { control: "boolean" },
    showEmpty: { control: "boolean" },
    noAd: { control: "boolean" },
    matchIndex: {
      control: "select",
      options: {
        "Federer vs Djokovic": 0,
        "Federer vs Wawrinka": 1,
        "Djokovic vs Nadal": 2,
        "Schwartzman vs Cervantes": 3,
      },
    },
    delayMs: { control: { type: "range", min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<GameTreeArgs>;

/**
 * Multiple Games - Shows various game progressions
 * 5 games with different patterns to demonstrate path variety
 */
export const MultipleGames: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: false,
    noAd: false,
  },
  render: (args) => {
    const container = document.createElement("div");
    container.id = "game-tree-container";
    container.style.width = "100%";
    container.style.height = "600px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
      lines: {
        points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: {
          0: "#a55194",
          1: "#6b6ecf",
          neutral: "#ecf0f1",
        },
      },
    });

    // Real MCP match data: Federer vs Djokovic (all episodes)
    const fixture = getMcpFixture(0);
    const matchUp = feedMatchUp(0);
    const episodes = buildEpisodes(matchUp);
    chart.players(fixture.players as [string, string]);
    chart.data(episodes);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Single Game - Standard game
 */
export const SingleGame: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: false,
    noAd: false,
  },
};

/**
 * Deuce game with complex branching
 */
export const DeuceGame: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: false,
    noAd: false,
  },
  render: (args: any) => {
    const container = document.createElement("div");
    container.id = "game-tree-deuce";
    container.style.width = "100%";
    container.style.height = "700px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
      lines: {
        points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: {
          0: "#a55194",
          1: "#6b6ecf",
          neutral: "#ecf0f1",
        },
      },
    });

    const episodes = pointsToEpisodes(deuceGamePoints);
    chart.data(episodes);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * No-Ad scoring format
 * Shows a game that goes to 40-40, then directly to game (no advantage)
 */
export const NoAdScoring: Story = {
  render: () => {
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "600px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: true,
        showEmpty: false,
        noAd: true, // Enable No-Ad mode
        showImages: false,
      },
      lines: {
        points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: {
          0: "#a55194",
          1: "#6b6ecf",
          neutral: "#ecf0f1",
        },
      },
    });

    // Use the No-Ad specific game data
    const episodes = pointsToEpisodes(noAdGamePoints);
    chart.data(episodes);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Color-coded by result type
 * Green = Winners, Red = Errors, Blue = Unknown
 */
export const ColorCodedResults: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: false,
    noAd: false,
  },
  render: (args) => {
    const container = document.createElement("div");
    container.id = "game-tree-colored";
    container.style.width = "100%";
    container.style.height = "600px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
      lines: {
        points: { winners: "#2ecc71", errors: "#e74c3c", unknown: "#3498db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: {
          0: "#9b59b6",
          1: "#f39c12",
          neutral: "#95a5a6",
        },
      },
    });

    const episodes = pointsToEpisodes(sampleGamePoints);
    chart.data(episodes);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Empty state - No data
 */
export const EmptyState: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: true,
    noAd: false,
  },
  render: (args) => {
    const container = document.createElement("div");
    container.id = "game-tree-empty";
    container.style.width = "100%";
    container.style.height = "600px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
    });

    chart.data([]);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Live Playback — Points appear incrementally via the reactive LiveEngine.
 * Use the Play/Pause/Step/Undo/Redo controls to interact.
 */
export const LivePlayback: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: false,
    noAd: false,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement("div");

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
      lines: {
        points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: { 0: "#a55194", 1: "#6b6ecf", neutral: "#ecf0f1" },
      },
    });

    const chartDiv = document.createElement("div");
    chartDiv.style.width = "100%";
    chartDiv.style.height = "600px";
    chartDiv.style.backgroundColor = "#f5f5f5";

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    const names = playback.getFixture().players as [string, string];
    chart.players(names);

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      chart.matchUp(matchUp);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, {
      showScoreboard: true,
    });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart);
      mounted = true;
      playback.start();
    }, 0);

    return container;
  },
};

/**
 * Format Awareness — Demonstrates supportsGameVisualizations() utility.
 *
 * The Game Tree is only appropriate for formats with traditional tennis game
 * scoring. Click [Yes] buttons to see different valid games; click [No] to see
 * the unsupported-format response.
 */
export const FormatAwareness: Story = {
  render: () => {
    const container = document.createElement("div");
    container.style.cssText =
      "display: flex; gap: 24px; padding: 20px; align-items: flex-start;";

    const leftPanel = document.createElement("div");
    leftPanel.style.cssText = "flex: 0 0 auto;";

    const rightPanel = document.createElement("div");
    rightPanel.style.cssText = "flex: 1; min-width: 320px;";

    const formats = [
      { code: "SET3-S:6/TB7", label: "Tennis (standard)" },
      { code: "SET3-S:6NOAD/TB7", label: "Tennis (No-Ad)" },
      { code: "SET3-S:6/TB7-G:TN", label: "Tennis (explicit -G:TN)" },
      { code: "SET3-S:6/TB7-G:TN3D", label: "Padel (Star Point)" },
      { code: "SET5-S:5-G:3C", label: "TYPTI (consecutive)" },
      { code: "SET3-S:T10-G:AGGR", label: "Timed + aggregate" },
      { code: "SET7XA-S:T10P", label: "INTENNSE (timed)" },
      { code: "T20", label: "Standalone timed" },
      { code: "HAL2A-S:T45", label: "Soccer" },
      { code: "SET3-S:TB11", label: "Squash/Pickleball" },
      { code: "SET3-S:4/TB5@3", label: "Fast4 Tennis" },
    ];

    // Build a pool of different episode sets for variety on [Yes] clicks
    const treePool: Array<{
      episodes: any[];
      noAd: boolean;
      players?: [string, string];
      label: string;
    }> = [];
    for (let mi = 0; mi < 4; mi++) {
      const matchUp = feedMatchUp(mi);
      const fixture = getMcpFixture(mi);
      const episodes = buildEpisodes(matchUp);
      treePool.push({
        episodes,
        noAd: false,
        players: fixture.players as [string, string],
        label: `${fixture.players[0]} v ${fixture.players[1]} — Full match`,
      });
    }
    treePool.push({
      episodes: pointsToEpisodes(sampleGamePoints),
      noAd: false,
      label: "Sample: Quick hold (40-15)",
    });
    treePool.push({
      episodes: pointsToEpisodes(deuceGamePoints),
      noAd: false,
      label: "Sample: Extended deuce game",
    });
    treePool.push({
      episodes: pointsToEpisodes(noAdGamePoints),
      noAd: true,
      label: "Sample: No-Ad scoring",
    });

    let treeIndex = 0;
    let activeBtn: HTMLElement | null = null;

    function showChart() {
      const source = treePool[treeIndex % treePool.length];
      treeIndex++;
      rightPanel.innerHTML = "";

      const labelDiv = document.createElement("div");
      labelDiv.textContent = source.label;
      labelDiv.style.cssText =
        "font-family: sans-serif; font-size: 13px; color: #555; margin-bottom: 8px;";
      rightPanel.appendChild(labelDiv);

      const chartDiv = document.createElement("div");
      chartDiv.style.cssText =
        "width: 100%; height: 500px; background: #f5f5f5;";
      rightPanel.appendChild(chartDiv);

      const chart = gameTree();
      chart.options({
        display: { sizeToFit: true, noAd: source.noAd },
        lines: {
          points: {
            winners: "green",
            errors: "#BA1212",
            unknown: "#2ed2db",
          },
          colors: { underlines: "black" },
        },
        nodes: {
          colors: { 0: "#a55194", 1: "#6b6ecf", neutral: "#ecf0f1" },
        },
      });
      if (source.players) chart.players(source.players);
      chart.data(source.episodes);

      setTimeout(() => {
        select(chartDiv).call(chart);
        chart.update();
      }, 0);
    }

    function showMessage(code: string, label: string) {
      rightPanel.innerHTML = "";

      const msgDiv = document.createElement("div");
      msgDiv.style.cssText =
        "display: flex; flex-direction: column; align-items: center; justify-content: center; " +
        "height: 500px; background: #fdf2f2; border: 2px dashed #e6b0b0; border-radius: 8px; " +
        "font-family: sans-serif; text-align: center; padding: 40px;";

      const icon = document.createElement("div");
      icon.style.cssText =
        "width: 56px; height: 56px; border-radius: 50%; background: #f5c6c6; " +
        "display: flex; align-items: center; justify-content: center; margin-bottom: 16px;";
      icon.innerHTML =
        '<span style="font-size: 28px; color: #c0392b; font-weight: bold; line-height: 1;">&#10005;</span>';
      msgDiv.appendChild(icon);

      const title = document.createElement("div");
      title.textContent = "Format Not Supported";
      title.style.cssText =
        "font-size: 18px; font-weight: bold; color: #c0392b; margin-bottom: 12px;";
      msgDiv.appendChild(title);

      const codeEl = document.createElement("div");
      codeEl.textContent = code;
      codeEl.style.cssText =
        "font-family: monospace; font-size: 15px; background: #fff; padding: 8px 16px; " +
        "border-radius: 4px; margin-bottom: 8px; border: 1px solid #e6b0b0;";
      msgDiv.appendChild(codeEl);

      const labelEl = document.createElement("div");
      labelEl.textContent = label;
      labelEl.style.cssText =
        "font-size: 14px; color: #666; margin-bottom: 20px;";
      msgDiv.appendChild(labelEl);

      const desc = document.createElement("div");
      desc.style.cssText =
        "font-size: 13px; color: #888; max-width: 320px; line-height: 1.5;";
      desc.innerHTML =
        "Game Tree requires traditional tennis game scoring<br>(0 &rarr; 15 &rarr; 30 &rarr; 40 &rarr; Game)";
      msgDiv.appendChild(desc);

      rightPanel.appendChild(msgDiv);
    }

    // Build table with interactive buttons
    const table = document.createElement("table");
    table.style.cssText = "border-collapse: collapse; font-family: monospace;";

    const headerRow = table.insertRow();
    ["Format Code", "Label", "Supported?"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      th.style.cssText =
        "padding: 8px 12px; border: 1px solid #ddd; text-align: left; white-space: nowrap;";
      headerRow.appendChild(th);
    });

    formats.forEach(({ code, label }) => {
      const supported = supportsGameVisualizations(code);
      const row = table.insertRow();

      const codeCell = row.insertCell();
      codeCell.textContent = code;
      codeCell.style.cssText =
        "padding: 8px 12px; border: 1px solid #ddd; white-space: nowrap;";

      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText =
        "padding: 8px 12px; border: 1px solid #ddd; white-space: nowrap;";

      const btnCell = row.insertCell();
      btnCell.style.cssText =
        "padding: 8px 12px; border: 1px solid #ddd; text-align: center;";

      const btn = document.createElement("button");
      btn.textContent = supported ? "Yes" : "No";
      btn.style.cssText =
        "padding: 4px 14px; border: 2px solid transparent; border-radius: 4px; " +
        "cursor: pointer; font-weight: bold; font-size: 13px; font-family: sans-serif; " +
        `color: white; background: ${supported ? "#27ae60" : "#c0392b"}; transition: border-color 0.15s;`;

      btn.addEventListener("mouseenter", () => {
        if (btn !== activeBtn) btn.style.borderColor = "#999";
      });
      btn.addEventListener("mouseleave", () => {
        if (btn !== activeBtn) btn.style.borderColor = "transparent";
      });
      btn.addEventListener("click", () => {
        if (activeBtn) activeBtn.style.borderColor = "transparent";
        activeBtn = btn;
        btn.style.borderColor = "#333";
        if (supported) showChart();
        else showMessage(code, label);
      });

      btnCell.appendChild(btn);
    });

    leftPanel.appendChild(table);
    container.appendChild(leftPanel);
    container.appendChild(rightPanel);

    setTimeout(() => showChart(), 0);

    return container;
  },
};

/**
 * Undo/Redo — Feed 20 points then interact with undo/redo/edit.
 */
export const UndoRedo: Story = {
  args: {
    showImages: false,
    sizeToFit: true,
    showEmpty: false,
    noAd: false,
    matchIndex: 0,
  },
  render: (args) => {
    const container = document.createElement("div");

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        showImages: args.showImages,
      },
      lines: {
        points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
        colors: { underlines: "black" },
      },
      nodes: {
        colors: { 0: "#a55194", 1: "#6b6ecf", neutral: "#ecf0f1" },
      },
    });

    const chartDiv = document.createElement("div");
    chartDiv.style.width = "100%";
    chartDiv.style.height = "600px";
    chartDiv.style.backgroundColor = "#f5f5f5";

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });

    const names = playback.getFixture().players as [string, string];
    chart.players(names);

    // Feed 20 points instantly
    for (let i = 0; i < 20; i++) playback.stepForward();

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      chart.matchUp(matchUp);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, {
      showScoreboard: true,
    });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart);
      mounted = true;
      const state = playback.liveEngine.getState();
      chart.matchUp(state);
      chart.update();
    }, 0);

    return container;
  },
};
