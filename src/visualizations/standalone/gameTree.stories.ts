import type { Meta, StoryObj } from '@storybook/html';
import { gameTree } from './gameTree';
import { sampleGamePoints, deuceGamePoints, noAdGamePoints, pointsToEpisodes } from './data/sampleGame';
import { generateMultipleGamesV4 } from './data/sampleGames';
import { setDev } from './utils/setDev';
import { select } from 'd3';

interface GameTreeArgs {
  showImages: boolean;
  sizeToFit: boolean;
  showEmpty: boolean;
  noAd: boolean;
}

/**
 * Game Tree Visualization
 *
 * Displays a tree diagram showing the progression of points through a game.
 * Each branch represents a possible score path, with line width indicating
 * the number of points played through that path.
 */
const meta: Meta<GameTreeArgs> = {
  title: 'Visualizations/GameTree',
  tags: ['autodocs'],
  render: (args) => {
    // Create container
    const container = document.createElement('div');
    container.id = 'game-tree-container';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';

    // Create chart
    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        show_images: args.showImages,
      },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: {
        colors: {
          0: '#a55194',
          1: '#6b6ecf',
          neutral: '#ecf0f1',
        },
      },
    });

    const episodes = pointsToEpisodes(sampleGamePoints);
    chart.data(episodes);

    // Set dev data for debugging
    setDev({
      // umo: mcpGameFixture.matchUp,
      data: episodes,
      // points: mcpGameFixture.matchUp.history?.points || [],
      episodes: episodes,
      // vizPoints: mcpGamePoints,
    });

    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);

    return container;
  },
  argTypes: {
    showImages: { control: 'boolean' },
    sizeToFit: { control: 'boolean' },
    showEmpty: { control: 'boolean' },
    noAd: { control: 'boolean' },
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
    const container = document.createElement('div');
    container.id = 'game-tree-container';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        show_images: args.showImages,
      },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: {
        colors: {
          0: '#a55194',
          1: '#6b6ecf',
          neutral: '#ecf0f1',
        },
      },
    });

    const episodes = generateMultipleGamesV4();
    chart.data(episodes);

    setDev({
      // umo: mcpGameFixture.matchUp,
      data: episodes,
      // points: mcpGameFixture.matchUp.history?.points || [],
      episodes: episodes,
      // vizPoints: mcpGamePoints,
    });

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
    const container = document.createElement('div');
    container.id = 'game-tree-deuce';
    container.style.width = '100%';
    container.style.height = '700px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        show_images: args.showImages,
      },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: {
        colors: {
          0: '#a55194',
          1: '#6b6ecf',
          neutral: '#ecf0f1',
        },
      },
    });

    const episodes = pointsToEpisodes(deuceGamePoints);
    chart.data(episodes);

    setDev({
      // umo: mcpGameFixture.matchUp,
      data: episodes,
      // points: mcpGameFixture.matchUp.history?.points || [],
      episodes: episodes,
      // vizPoints: mcpGamePoints,
    });

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
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: true,
        showEmpty: false,
        noAd: true, // Enable No-Ad mode
        show_images: false,
      },
      lines: {
        points: { winners: 'green', errors: '#BA1212', unknown: '#2ed2db' },
        colors: { underlines: 'black' },
      },
      nodes: {
        colors: {
          0: '#a55194',
          1: '#6b6ecf',
          neutral: '#ecf0f1',
        },
      },
    });

    // Use the No-Ad specific game data
    const episodes = pointsToEpisodes(noAdGamePoints);
    chart.data(episodes);

    setDev({
      // umo: mcpGameFixture.matchUp,
      data: episodes,
      // points: mcpGameFixture.matchUp.history?.points || [],
      episodes: episodes,
      // vizPoints: mcpGamePoints,
    });

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
    const container = document.createElement('div');
    container.id = 'game-tree-colored';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        show_images: args.showImages,
      },
      lines: {
        points: { winners: '#2ecc71', errors: '#e74c3c', unknown: '#3498db' },
        colors: { underlines: 'black' },
      },
      nodes: {
        colors: {
          0: '#9b59b6',
          1: '#f39c12',
          neutral: '#95a5a6',
        },
      },
    });

    const episodes = pointsToEpisodes(sampleGamePoints);
    chart.data(episodes);

    setDev({
      // umo: mcpGameFixture.matchUp,
      data: episodes,
      // points: mcpGameFixture.matchUp.history?.points || [],
      episodes: episodes,
      // vizPoints: mcpGamePoints,
    });

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
    const container = document.createElement('div');
    container.id = 'game-tree-empty';
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#f5f5f5';

    const chart = gameTree();
    chart.options({
      display: {
        sizeToFit: args.sizeToFit,
        showEmpty: args.showEmpty,
        noAd: args.noAd,
        show_images: args.showImages,
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
