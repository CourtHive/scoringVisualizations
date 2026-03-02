import type { Meta, StoryObj } from '@storybook/html';
import { gameFish } from './gameFish';
import { sampleGamePoints, deuceGamePoints, tiebreakGamePoints } from './data/sampleGame';
import { feedMatchUp, extractGamePoints, getMcpFixture } from '../engine/feedMatchUp';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { supportsGameVisualizations } from '../utils/supportsGameVisualizations';
import { select } from 'd3';

interface GameFishArgs {
  orientation: 'vertical' | 'horizontal';
  showService: boolean;
  showRally: boolean;
  showGrid: boolean;
  cellSize: number;
  matchIndex?: number;
  delayMs?: number;
}

/**
 * GameFish — Point Progression, Key Shots, Rallies
 *
 * The GameFish visualization provides a single-glance overview of one game
 * from a tennis match. It is an enhancement of the standard score-matrix
 * for tennis matches.
 *
 * The boxes on the edges of the graphic indicate which player was serving.
 * Light green dots represent Service Winners; yellow dots represent serves
 * that were "In"; red dots represent faults. The boxes alternate sides
 * based on the server for each point.
 *
 * The Game Grid in the center indicates the winner of the point by cell
 * color as well as the final "Key Shot" which determined the point winner.
 * Winners are shown in green, errors in red, and other outcomes in the
 * default player color.
 *
 * Rally lengths are depicted with bluish-grey bars which appear "behind"
 * the GameFish, giving a visual sense of point intensity.
 *
 * GameFish is the building block of the Momentum Chart, where multiple
 * games are laid out nose-to-tail to show the flow of an entire match.
 */
const meta: Meta<GameFishArgs> = {
  title: 'Visualizations/GameFish',
  tags: ['autodocs'],
  render: (args) => {
    // Create container
    const container = document.createElement('div');
    container.id = 'game-fish-container';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';

    // Create chart
    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        transitionTime: 0,
      },
      fish: {
        cellSize: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 0],
    });

    // Real MCP match data: first game of Federer vs Djokovic
    const matchUp = feedMatchUp(0);
    chart.data(extractGamePoints(matchUp, 0, 0));

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    showService: { control: 'boolean' },
    showRally: { control: 'boolean' },
    showGrid: { control: 'boolean' },
    cellSize: { control: { type: 'range', min: 10, max: 40, step: 5 } },
    matchIndex: {
      control: 'select',
      options: { 'Federer vs Djokovic': 0, 'Federer vs Wawrinka': 1, 'Djokovic vs Nadal': 2, 'Schwartzman vs Cervantes': 3 },
    },
    delayMs: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<GameFishArgs>;

/**
 * Default game view - Player 0 wins 40-15
 */
export const Default: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 20,
  },
};

/**
 * Horizontal orientation
 */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 20,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'game-fish-horizontal';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        transitionTime: 0,
      },
      fish: {
        cellSize: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 0],
    });

    // Real MCP match data: second game of Federer vs Djokovic
    const matchUp = feedMatchUp(0);
    chart.data(extractGamePoints(matchUp, 0, 1));

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Deuce game with multiple advantages
 */
export const DeuceGame: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 20,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'game-fish-deuce';
    container.style.width = '100%';
    container.style.height = '700px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        transitionTime: 0,
      },
      fish: {
        cellSize: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 1],
    });

    chart.data(deuceGamePoints);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Tiebreak game (7-5)
 */
export const Tiebreak: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 15,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'game-fish-tiebreak';
    container.style.width = '100%';
    container.style.height = '800px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        transitionTime: 0,
      },
      fish: {
        cellSize: args.cellSize,
        gridcells: ['0', '1', '2', '3', '4', '5', '6', '7'],
      },
      score: [7, 6],
    });

    chart.data(tiebreakGamePoints);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Minimal view - no rally or service indicators
 */
export const MinimalView: Story = {
  args: {
    orientation: 'vertical',
    showService: false,
    showRally: false,
    showGrid: true,
    cellSize: 20,
  },
};

/**
 * Compact view with small cell size
 */
export const CompactView: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 12,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'game-fish-compact';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        transitionTime: 0,
      },
      fish: {
        cellSize: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 0],
    });

    // Real MCP match data: first game of Djokovic vs Nadal
    const matchUp = feedMatchUp(2);
    chart.data(extractGamePoints(matchUp, 0, 0));

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Custom Colors - Blue/Purple Theme (like hive-eye-tracker)
 * More pleasing color scheme with purple and blue
 */
export const CustomColorsBlue: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        rally: true,
        grid: true,
      },
      colors: {
        players: { 0: '#a55194', 1: '#6b6ecf' }, // Purple and blue
      },
      score: [1, 0],
    });

    // gameFish expects just the points array, not a GameGroup
    chart.data(sampleGamePoints);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Custom Colors - Teal/Orange Theme
 * Fresh, vibrant color scheme
 */
export const CustomColorsTeal: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        rally: true,
        grid: true,
      },
      colors: {
        players: { 0: '#1abc9c', 1: '#e67e22' }, // Teal and orange
      },
      score: [1, 1],
    });

    // gameFish expects just the points array, not a GameGroup
    chart.data(deuceGamePoints);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Custom Colors - Green/Red Theme
 * Classic sports colors
 */
export const CustomColorsGreen: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        rally: true,
        grid: true,
      },
      colors: {
        players: { 0: '#27ae60', 1: '#c0392b' }, // Green and red
      },
      score: [1, 1],
    });

    // gameFish expects just the points array, not a GameGroup
    chart.data(deuceGamePoints);

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
};

/**
 * Format Awareness — Demonstrates supportsGameVisualizations() utility.
 *
 * GameFish is only appropriate for formats with traditional tennis game scoring.
 * Click [Yes] buttons to see different valid games; click [No] to see the
 * unsupported-format response.
 */
export const FormatAwareness: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; gap: 24px; padding: 20px; align-items: flex-start;';

    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'flex: 0 0 auto;';

    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'flex: 1; min-width: 320px;';

    const formats = [
      { code: 'SET3-S:6/TB7', label: 'Tennis (standard)' },
      { code: 'SET3-S:6NOAD/TB7', label: 'Tennis (No-Ad)' },
      { code: 'SET3-S:6/TB7-G:TN', label: 'Tennis (explicit -G:TN)' },
      { code: 'SET3-S:6/TB7-G:TN3D', label: 'Padel (Star Point)' },
      { code: 'SET5-S:5-G:3C', label: 'TYPTI (consecutive)' },
      { code: 'SET3-S:T10-G:AGGR', label: 'Timed + aggregate' },
      { code: 'SET7XA-S:T10P', label: 'INTENNSE (timed)' },
      { code: 'T20', label: 'Standalone timed' },
      { code: 'HAL2A-S:T45', label: 'Soccer' },
      { code: 'SET3-S:TB11', label: 'Squash/Pickleball' },
      { code: 'SET3-S:4/TB5@3', label: 'Fast4 Tennis' },
    ];

    // Build a pool of different games for variety on [Yes] clicks
    const gamePool: Array<{
      points: any[];
      score: [number, number];
      gridcells: string[];
      label: string;
    }> = [];
    for (let mi = 0; mi < 4; mi++) {
      const matchUp = feedMatchUp(mi);
      const fixture = getMcpFixture(mi);
      const name = `${fixture.players[0]} v ${fixture.players[1]}`;
      const games = fixture.sets[0]?.games ?? [];
      for (let gi = 0; gi < Math.min(games.length, 4); gi++) {
        const pts = extractGamePoints(matchUp, 0, gi);
        if (pts.length > 0) {
          const score = gi === 0 ? [0, 0] : (games[gi - 1]?.score ?? [0, 0]);
          gamePool.push({
            points: pts,
            score: score as [number, number],
            gridcells: ['0', '15', '30', '40', 'G'],
            label: `${name} — Set 1, Game ${gi + 1}`,
          });
        }
      }
    }
    gamePool.push({
      points: sampleGamePoints,
      score: [1, 0],
      gridcells: ['0', '15', '30', '40', 'G'],
      label: 'Sample: Quick hold (40-15)',
    });
    gamePool.push({
      points: deuceGamePoints,
      score: [1, 1],
      gridcells: ['0', '15', '30', '40', 'G'],
      label: 'Sample: Extended deuce game',
    });
    gamePool.push({
      points: tiebreakGamePoints,
      score: [6, 6],
      gridcells: ['0', '1', '2', '3', '4', '5', '6', '7'],
      label: 'Sample: Tiebreak (7-5)',
    });

    let gameIndex = 0;
    let activeBtn: HTMLElement | null = null;

    function showChart() {
      const source = gamePool[gameIndex % gamePool.length];
      gameIndex++;
      rightPanel.innerHTML = '';

      const labelDiv = document.createElement('div');
      labelDiv.textContent = source.label;
      labelDiv.style.cssText = 'font-family: sans-serif; font-size: 13px; color: #555; margin-bottom: 8px;';
      rightPanel.appendChild(labelDiv);

      const chartDiv = document.createElement('div');
      chartDiv.style.cssText = 'width: 100%; height: 500px;';
      rightPanel.appendChild(chartDiv);

      const chart = gameFish();
      chart.options({
        display: { sizeToFit: true, grid: true, rally: true, service: true, transitionTime: 0 },
        fish: { cellSize: 20, gridcells: source.gridcells },
        score: source.score,
      });
      chart.data(source.points);

      setTimeout(() => {
        select(chartDiv).call(chart);
        chart.update();
      }, 0);
    }

    function showMessage(code: string, label: string) {
      rightPanel.innerHTML = '';

      const msgDiv = document.createElement('div');
      msgDiv.style.cssText =
        'display: flex; flex-direction: column; align-items: center; justify-content: center; ' +
        'height: 500px; background: #fdf2f2; border: 2px dashed #e6b0b0; border-radius: 8px; ' +
        'font-family: sans-serif; text-align: center; padding: 40px;';

      const icon = document.createElement('div');
      icon.style.cssText =
        'width: 56px; height: 56px; border-radius: 50%; background: #f5c6c6; ' +
        'display: flex; align-items: center; justify-content: center; margin-bottom: 16px;';
      icon.innerHTML = '<span style="font-size: 28px; color: #c0392b; font-weight: bold; line-height: 1;">&#10005;</span>';
      msgDiv.appendChild(icon);

      const title = document.createElement('div');
      title.textContent = 'Format Not Supported';
      title.style.cssText = 'font-size: 18px; font-weight: bold; color: #c0392b; margin-bottom: 12px;';
      msgDiv.appendChild(title);

      const codeEl = document.createElement('div');
      codeEl.textContent = code;
      codeEl.style.cssText =
        'font-family: monospace; font-size: 15px; background: #fff; padding: 8px 16px; ' +
        'border-radius: 4px; margin-bottom: 8px; border: 1px solid #e6b0b0;';
      msgDiv.appendChild(codeEl);

      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 20px;';
      msgDiv.appendChild(labelEl);

      const desc = document.createElement('div');
      desc.style.cssText = 'font-size: 13px; color: #888; max-width: 320px; line-height: 1.5;';
      desc.innerHTML = 'GameFish requires traditional tennis game scoring<br>(0 &rarr; 15 &rarr; 30 &rarr; 40 &rarr; Game)';
      msgDiv.appendChild(desc);

      rightPanel.appendChild(msgDiv);
    }

    // Build table with interactive buttons
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse: collapse; font-family: monospace;';

    const headerRow = table.insertRow();
    ['Format Code', 'Label', 'Supported?'].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; text-align: left; white-space: nowrap;';
      headerRow.appendChild(th);
    });

    formats.forEach(({ code, label }) => {
      const supported = supportsGameVisualizations(code);
      const row = table.insertRow();

      const codeCell = row.insertCell();
      codeCell.textContent = code;
      codeCell.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; white-space: nowrap;';

      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; white-space: nowrap;';

      const btnCell = row.insertCell();
      btnCell.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd; text-align: center;';

      const btn = document.createElement('button');
      btn.textContent = supported ? 'Yes' : 'No';
      btn.style.cssText =
        'padding: 4px 14px; border: 2px solid transparent; border-radius: 4px; ' +
        'cursor: pointer; font-weight: bold; font-size: 13px; font-family: sans-serif; ' +
        `color: white; background: ${supported ? '#27ae60' : '#c0392b'}; transition: border-color 0.15s;`;

      btn.addEventListener('mouseenter', () => {
        if (btn !== activeBtn) btn.style.borderColor = '#999';
      });
      btn.addEventListener('mouseleave', () => {
        if (btn !== activeBtn) btn.style.borderColor = 'transparent';
      });
      btn.addEventListener('click', () => {
        if (activeBtn) activeBtn.style.borderColor = 'transparent';
        activeBtn = btn;
        btn.style.borderColor = '#333';
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
 * Live Playback — Shows first game of selected match building up point by point.
 */
export const LivePlayback: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 20,
    matchIndex: 0,
    delayMs: 400,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        transitionTime: 0,
      },
      fish: {
        cellSize: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [0, 0],
    });

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '600px';

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      // Show the current (last) game being played
      const points = matchUp?.history?.points ?? [];
      if (points.length === 0) {
        chart.data([]);
        if (mounted) chart.update();
        return;
      }
      const lastPoint = points[points.length - 1];
      chart.matchUp(matchUp, lastPoint.set, lastPoint.game);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
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
 * Undo/Redo — Feed 8 points (one game) then interact.
 */
export const UndoRedo: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    cellSize: 20,
    matchIndex: 0,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chart = gameFish();
    chart.options({
      display: {
        sizeToFit: true, orientation: args.orientation,
        service: args.showService, rally: args.showRally,
        grid: args.showGrid, transitionTime: 0,
      },
      fish: { cellSize: args.cellSize, gridcells: ['0', '15', '30', '40', 'G'] },
      score: [0, 0],
    });

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText = 'width:100%; height:600px;';

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });
    for (let i = 0; i < 8; i++) playback.stepForward();

    let mounted = false;
    playback.liveEngine.subscribe((matchUp) => {
      const points = matchUp?.history?.points ?? [];
      if (points.length === 0) {
        chart.data([]);
        if (mounted) chart.update();
        return;
      }
      const lastPoint = points[points.length - 1];
      chart.matchUp(matchUp, lastPoint.set, lastPoint.game);
      if (mounted) chart.update();
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      select(chartDiv).call(chart);
      mounted = true;
      const state = playback.liveEngine.getState();
      const pts = state?.history?.points ?? [];
      if (pts.length > 0) {
        const lp = pts[pts.length - 1];
        chart.matchUp(state, lp.set, lp.game);
      }
      chart.update();
    }, 0);

    return container;
  },
};
