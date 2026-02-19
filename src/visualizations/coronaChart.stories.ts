import type { Meta, StoryObj } from '@storybook/html';
import { coronaChart, coronaChartFromMatchUp } from './coronaChart.ts';
import { createJsonViewer } from './helpers/JsonViewer';
import { createPlaybackEngine } from '../engine/createPlaybackEngine';
import { createPlaybackControlsUI } from './helpers/PlaybackControls';
import { select } from 'd3';

interface CoronaChartArgs {
  radius: number;
  showInfo: boolean;
  showBadge: boolean;
  reverseColors: boolean;
  matchIndex?: number;
  delayMs?: number;
}

/**
 * Corona Chart — Radial Horizon Graph
 *
 * The "Corona" is a Radial Horizon Graph intended to provide a compact,
 * iconic representation of a match. Corona graphs are formally known as
 * radial area graphs.
 *
 * The name draws from astronomy: a coronagraph is "a telescope that can see
 * things very close to the Sun. It uses a disk to block the Sun's bright
 * surface, revealing the faint solar corona." Similarly, the Corona
 * highlights important aspects of a match normally obscured by the quantity
 * of data available.
 *
 * Each radial segment represents a game, with the distance from center
 * indicating the cumulative score differential. Darker color bands indicate
 * a greater point difference. The visualization enables rapid comparison of
 * sets or matches — enough detail to differentiate a 6-0 "cakewalk" from a
 * 6-0 where every game went to deuce and beyond.
 *
 * @see https://tennisviz.blogspot.com/2015/08/points-to-set-horizon-corona.html
 */
const meta: Meta<CoronaChartArgs> = {
  title: 'Visualizations/CoronaChart',
  tags: ['autodocs'],
  render: (args) => {
    // Main wrapper
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '20px';
    wrapper.style.padding = '20px';

    // Chart container
    const chartContainer = document.createElement('div');
    chartContainer.style.flex = '1';
    chartContainer.style.minWidth = '600px';
    chartContainer.style.backgroundColor = '#f5f5f5';
    chartContainer.style.display = 'flex';
    chartContainer.style.alignItems = 'center';
    chartContainer.style.justifyContent = 'center';
    chartContainer.style.padding = '20px';

    // Create SVG
    const svg = select(chartContainer).append('svg').attr('width', 600).attr('height', 600);

    // Generate sample data
    const sampleSetMap = [
      {
        p2sdiff: generateScoreDiffs(50),
        gamesScore: [6, 4] as [number, number],
        players: ['Player One', 'Player Two'] as [string, string],
        winnerIndex: 0 as 0 | 1,
      },
    ];

    const prefs = {
      width: 600,
      height: 600,
      radius: args.radius,
      colors: args.reverseColors ? ['#6b6ecf', '#a55194'] : ['#a55194', '#6b6ecf'],
      display: {
        info: args.showInfo,
        badge: args.showBadge ? 'Match' : false,
        home: false,
      },
      functions: {},
    };

    // Render corona chart
    setTimeout(() => {
      coronaChart(svg, sampleSetMap, prefs, 0, 0);
    }, 0);

    // Data viewer
    const dataContainer = document.createElement('div');
    dataContainer.style.flex = '0 0 400px';

    const dataTitle = document.createElement('h3');
    dataTitle.textContent = 'Sample Data';
    dataTitle.style.marginTop = '0';
    dataTitle.style.marginBottom = '10px';
    dataContainer.appendChild(dataTitle);

    const jsonContainer = document.createElement('div');
    createJsonViewer(jsonContainer, sampleSetMap, { expanded: 2 });
    dataContainer.appendChild(jsonContainer);

    wrapper.appendChild(chartContainer);
    wrapper.appendChild(dataContainer);

    return wrapper;
  },
  argTypes: {
    radius: { control: { type: 'range', min: 200, max: 2000, step: 20 } },
    showInfo: { control: 'boolean' },
    showBadge: { control: 'boolean' },
    reverseColors: { control: 'boolean' },
    matchIndex: {
      control: 'select',
      options: { 'Federer vs Djokovic': 0, 'Federer vs Wawrinka': 1, 'Djokovic vs Nadal': 2, 'Schwartzman vs Cervantes': 3 },
    },
    delayMs: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<CoronaChartArgs>;

/**
 * Default corona chart
 */
export const Default: Story = {
  args: {
    radius: 810,
    showInfo: false,
    showBadge: false,
    reverseColors: false,
  },
};

/**
 * Extra large radius
 */
export const ExtraLarge: Story = {
  args: {
    radius: 1350,
    showInfo: false,
    showBadge: false,
    reverseColors: false,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'corona-chart-large';
    container.style.width = '100%';
    container.style.height = '1000px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const svg = select(container).append('svg').attr('width', 1000).attr('height', 1000);

    const sampleSetMap = [
      {
        p2sdiff: generateScoreDiffs(80),
        gamesScore: [7, 6] as [number, number],
        players: ['Federer', 'Nadal'] as [string, string],
        winnerIndex: 0 as 0 | 1,
      },
    ];

    const prefs = {
      width: 1000,
      height: 1000,
      radius: args.radius,
      colors: ['#a55194', '#6b6ecf'],
      display: { info: false, badge: false, home: false },
      functions: {},
    };

    setTimeout(() => {
      coronaChart(svg, sampleSetMap, prefs, 0, 0);
    }, 0);

    return container;
  },
};

/**
 * With Result - shows player names and match score
 */
export const WithResult: Story = {
  args: {
    radius: 1350,
    showInfo: true,
    showBadge: false,
    reverseColors: false,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'corona-chart-info';
    container.style.width = '100%';
    container.style.height = '1000px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const svg = select(container).append('svg').attr('width', 1000).attr('height', 1000);

    const sampleSetMap = [
      {
        p2sdiff: generateScoreDiffs(60),
        gamesScore: [6, 3] as [number, number],
        players: ['Serena Williams', 'Venus Williams'] as [string, string],
        winnerIndex: 0 as 0 | 1,
      },
      {
        p2sdiff: generateScoreDiffs(50),
        gamesScore: [6, 2] as [number, number],
        players: ['Serena Williams', 'Venus Williams'] as [string, string],
        winnerIndex: 0 as 0 | 1,
      },
    ];

    const prefs = {
      width: 1000,
      height: 1000,
      radius: args.radius,
      colors: args.reverseColors ? ['#6b6ecf', '#a55194'] : ['#a55194', '#6b6ecf'],
      display: { info: args.showInfo, badge: false, home: false },
      functions: {},
    };

    setTimeout(() => {
      coronaChart(svg, sampleSetMap, prefs, 0, 0);
    }, 0);

    return container;
  },
};

/**
 * With badge display - minimal label in center
 */
export const WithBadge: Story = {
  args: {
    radius: 1080,
    showInfo: false,
    showBadge: true,
    reverseColors: false,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'corona-chart-badge';
    container.style.width = '100%';
    container.style.height = '800px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const svg = select(container).append('svg').attr('width', 800).attr('height', 800);

    const sampleSetMap = [
      {
        p2sdiff: generateScoreDiffs(55),
        gamesScore: [7, 5] as [number, number],
        players: ['Djokovic', 'Murray'] as [string, string],
        winnerIndex: 0 as 0 | 1,
      },
    ];

    const prefs = {
      width: 800,
      height: 800,
      radius: args.radius,
      colors: ['#a55194', '#6b6ecf'],
      display: { info: false, badge: 'Final', home: false },
      functions: {},
    };

    setTimeout(() => {
      coronaChart(svg, sampleSetMap, prefs, 0, 0);
    }, 0);

    return container;
  },
};

/**
 * Reversed colors - Player colors swapped
 */
export const ReversedColors: Story = {
  args: {
    radius: 1080,
    showInfo: false,
    showBadge: false,
    reverseColors: true,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'corona-chart-reversed';
    container.style.width = '100%';
    container.style.height = '800px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';

    const svg = select(container).append('svg').attr('width', 800).attr('height', 800);

    const sampleSetMap = [
      {
        p2sdiff: generateScoreDiffs(70),
        gamesScore: [4, 6] as [number, number],
        players: ['Player A', 'Player B'] as [string, string],
        winnerIndex: 1 as 0 | 1,
      },
    ];

    const prefs = {
      width: 800,
      height: 800,
      radius: args.radius,
      colors: args.reverseColors ? ['#6b6ecf', '#a55194'] : ['#a55194', '#6b6ecf'],
      display: { info: false, badge: false, home: false },
      functions: {},
    };

    setTimeout(() => {
      coronaChart(svg, sampleSetMap, prefs, 0, 0);
    }, 0);

    return container;
  },
};

/**
 * Live Playback — Corona chart updates as points are added via the reactive LiveEngine.
 * Clears and re-renders the SVG on each state change.
 */
export const LivePlayback: Story = {
  args: {
    radius: 350,
    showInfo: false,
    showBadge: false,
    reverseColors: false,
    matchIndex: 0,
    delayMs: 200,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '700px';
    chartDiv.style.backgroundColor = '#f5f5f5';
    chartDiv.style.display = 'flex';
    chartDiv.style.alignItems = 'center';
    chartDiv.style.justifyContent = 'center';

    const playback = createPlaybackEngine({
      matchIndex: args.matchIndex,
      delayMs: args.delayMs,
    });

    const fixture = playback.getFixture();

    const coronaOpts = {
      colors: args.reverseColors ? ['#6b6ecf', '#a55194'] : ['#a55194', '#6b6ecf'],
      players: fixture.players as [string, string],
      display: { info: args.showInfo, badge: args.showBadge ? 'Match' : false, home: false },
    };

    playback.liveEngine.subscribe((matchUp) => {
      coronaChartFromMatchUp(chartDiv, matchUp, coronaOpts);
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      playback.start();
    }, 0);

    return container;
  },
};

/**
 * Undo/Redo — Feed 20 points then interact.
 */
export const UndoRedo: Story = {
  args: {
    radius: 350,
    showInfo: false,
    showBadge: false,
    reverseColors: false,
    matchIndex: 0,
  },
  render: (args) => {
    const container = document.createElement('div');

    const chartDiv = document.createElement('div');
    chartDiv.style.cssText =
      'width:100%; height:700px; background:#f5f5f5; display:flex; align-items:center; justify-content:center;';

    const playback = createPlaybackEngine({ matchIndex: args.matchIndex });
    for (let i = 0; i < 20; i++) playback.stepForward();

    const fixture = playback.getFixture();

    const coronaOpts = {
      colors: args.reverseColors ? ['#6b6ecf', '#a55194'] : ['#a55194', '#6b6ecf'],
      players: fixture.players as [string, string],
      display: { info: args.showInfo, badge: args.showBadge ? 'Match' : false, home: false },
    };

    playback.liveEngine.subscribe((matchUp) => {
      coronaChartFromMatchUp(chartDiv, matchUp, coronaOpts);
    });

    const controls = createPlaybackControlsUI(playback, { showScoreboard: true });
    container.appendChild(controls);
    container.appendChild(chartDiv);

    setTimeout(() => {
      coronaChartFromMatchUp(chartDiv, playback.liveEngine.getState(), coronaOpts);
    }, 0);

    return container;
  },
};

// Helper function to generate sample score differentials
function generateScoreDiffs(count: number): number[] {
  const diffs: number[] = [];
  let current = 0;

  for (let i = 0; i < count; i++) {
    const change = Math.random() > 0.5 ? 1 : -1;
    current += change;
    // Keep within reasonable bounds
    current = Math.max(-12, Math.min(12, current));
    diffs.push(current);

    // Occasionally reset to zero (game boundary)
    if (Math.random() > 0.85) {
      diffs.push(0);
      current = 0;
      i++;
    }
  }

  return diffs;
}
