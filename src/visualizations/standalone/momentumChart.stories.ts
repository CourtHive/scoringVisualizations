import type { Meta, StoryObj } from '@storybook/html';
import { momentumChart } from './momentumChart';
import { generateSampleMatchUpV4 } from './data/sampleMatch';
import { select } from 'd3';

interface MomentumChartArgs {
  orientation: 'vertical' | 'horizontal';
  showService: boolean;
  showRally: boolean;
  showGrid: boolean;
  showScore: boolean;
  continuous: boolean;
}

/**
 * Momentum Chart Visualization
 * 
 * Displays the flow of momentum across multiple games in a set or match.
 * Each game is represented as a vertical or horizontal section showing
 * point progression and score changes.
 */
const meta: Meta<MomentumChartArgs> = {
  title: 'Visualizations/MomentumChart',
  tags: ['autodocs'],
  render: (args) => {
    // Create container
    const container = document.createElement('div');
    container.id = 'momentum-chart-container';
    container.style.width = '100%';
    container.style.height = '800px';
    container.style.padding = '20px';
    
    // Create chart
    const chart = momentumChart();
    chart.options({
      display: {
        sizeToFit: true,
        continuous: args.continuous,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        score: args.showScore,
        momentum_score: true,
        transition_time: 0,
      },
      colors: {
        players: { 0: '#a55194', 1: '#6b6ecf' },
      },
    });
    
    // Generate sample match data
    const matchUp = generateSampleMatchUpV4();
    const matchData = matchUp.episodes;
    chart.data(matchData);
    
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
    showScore: { control: 'boolean' },
    continuous: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<MomentumChartArgs>;

/**
 * Default momentum view - Full match
 */
export const Default: Story = {
  args: {
    orientation: 'vertical',
    showService: false,
    showRally: true,
    showGrid: false,
    showScore: true,
    continuous: false,
  },
};

/**
 * Horizontal orientation
 */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    showService: false,
    showRally: true,
    showGrid: false,
    showScore: true,
    continuous: false,
  },
};

/**
 * Continuous mode - no gaps between games
 */
export const ContinuousMode: Story = {
  args: {
    orientation: 'vertical',
    showService: false,
    showRally: true,
    showGrid: false,
    showScore: true,
    continuous: true,
  },
};

/**
 * With service and grid indicators
 */
export const DetailedView: Story = {
  args: {
    orientation: 'vertical',
    showService: true,
    showRally: true,
    showGrid: true,
    showScore: true,
    continuous: false,
  },
};

/**
 * Minimal view - rally bars only
 */
export const MinimalView: Story = {
  args: {
    orientation: 'vertical',
    showService: false,
    showRally: true,
    showGrid: false,
    showScore: false,
    continuous: false,
  },
};

/**
 * Compact horizontal layout
 */
export const CompactHorizontal: Story = {
  args: {
    orientation: 'horizontal',
    showService: false,
    showRally: true,
    showGrid: false,
    showScore: true,
    continuous: true,
  },
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'momentum-chart-compact';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';
    
    const chart = momentumChart();
    chart.options({
      display: {
        sizeToFit: true,
        continuous: args.continuous,
        orientation: args.orientation,
        service: args.showService,
        rally: args.showRally,
        grid: args.showGrid,
        score: args.showScore,
        momentum_score: true,
        transition_time: 0,
      },
      colors: {
        players: { 0: '#e74c3c', 1: '#3498db' },
      },
    });
    
    const matchUp = generateSampleMatchUpV4();
    const matchData = matchUp.episodes;
    chart.data(matchData);
    
    setTimeout(() => {
      select(container).call(chart);
      if (chart.update) chart.update();
    }, 0);
    
    return container;
  },
};
