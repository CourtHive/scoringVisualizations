import type { Meta, StoryObj } from '@storybook/html';
import { gameFish } from './gameFish';
import { sampleGamePoints, deuceGamePoints, tiebreakGamePoints } from './data/sampleGame';
import { mcpGamePoints } from './data/mcpAdapter';
import { select } from 'd3';

interface GameFishArgs {
  orientation: 'vertical' | 'horizontal';
  showService: boolean;
  showRally: boolean;
  showGrid: boolean;
  cellSize: number;
}

/**
 * Game Fish Visualization
 * 
 * Displays point-by-point details of a tennis game in a compact visual format.
 * Shows server, rally length, point results, and score progression.
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
        transition_time: 0,
      },
      fish: {
        cell_size: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 0],
    });
    
    // Real MCP match data: first game of Federer vs Djokovic
    chart.data(mcpGamePoints(0, 0, 0));

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
        transition_time: 0,
      },
      fish: {
        cell_size: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 0],
    });

    // Real MCP match data: second game of Federer vs Djokovic
    chart.data(mcpGamePoints(0, 0, 1));

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
        transition_time: 0,
      },
      fish: {
        cell_size: args.cellSize,
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
        transition_time: 0,
      },
      fish: {
        cell_size: args.cellSize,
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
        transition_time: 0,
      },
      fish: {
        cell_size: args.cellSize,
        gridcells: ['0', '15', '30', '40', 'G'],
      },
      score: [1, 0],
    });
    
    // Real MCP match data: first game of Djokovic vs Nadal
    chart.data(mcpGamePoints(2, 0, 0));

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
