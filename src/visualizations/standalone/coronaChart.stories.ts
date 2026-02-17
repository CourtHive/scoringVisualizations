import type { Meta, StoryObj } from '@storybook/html';
import { coronaChart } from './coronaChart.ts';
import { createJsonViewer } from './helpers/JsonViewer';
import { select } from 'd3';

interface CoronaChartArgs {
  radius: number;
  showInfo: boolean;
  showBadge: boolean;
  reverseColors: boolean;
}

/**
 * Corona Chart Visualization
 *
 * Displays point-by-point score differentials in a radial/circular format.
 * Creates a "corona" effect showing momentum swings around a central point.
 * Each radial segment represents a game, with the distance from center
 * indicating the cumulative score differential.
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
        games_score: [6, 4] as [number, number],
        players: ['Player One', 'Player Two'] as [string, string],
        winner_index: 0 as 0 | 1,
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
    radius: { control: { type: 'range', min: 100, max: 500, step: 20 } },
    showInfo: { control: 'boolean' },
    showBadge: { control: 'boolean' },
    reverseColors: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CoronaChartArgs>;

/**
 * Default corona chart
 */
export const Default: Story = {
  args: {
    radius: 350,
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
    radius: 450,
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
        games_score: [7, 6] as [number, number],
        players: ['Federer', 'Nadal'] as [string, string],
        winner_index: 0 as 0 | 1,
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
    radius: 420,
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
        games_score: [6, 3] as [number, number],
        players: ['Serena Williams', 'Venus Williams'] as [string, string],
        winner_index: 0 as 0 | 1,
      },
      {
        p2sdiff: generateScoreDiffs(50),
        games_score: [6, 2] as [number, number],
        players: ['Serena Williams', 'Venus Williams'] as [string, string],
        winner_index: 0 as 0 | 1,
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
    radius: 350,
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
        games_score: [7, 5] as [number, number],
        players: ['Djokovic', 'Murray'] as [string, string],
        winner_index: 0 as 0 | 1,
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
    radius: 350,
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
        games_score: [4, 6] as [number, number],
        players: ['Player A', 'Player B'] as [string, string],
        winner_index: 1 as 0 | 1,
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
