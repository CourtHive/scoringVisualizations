import type { Meta, StoryObj } from '@storybook/html';
import { simpleChart } from './simpleChart';
import { mcpRallyLengths } from './data/mcpAdapter';

interface SimpleChartArgs {
  width: number;
  height: number;
  minPoints: number;
}

/**
 * Simple Chart Visualization
 * 
 * Displays rally lengths as a line chart comparing two players.
 * Each line represents rally lengths over the course of points.
 */
const meta: Meta<SimpleChartArgs> = {
  title: 'Visualizations/SimpleChart',
  tags: ['autodocs'],
  render: (_args) => {
    // Create container
    const container = document.createElement('div');
    container.id = 'simple-chart-container';
    container.style.width = '100%';
    container.style.height = '500px';
    container.style.padding = '20px';
    
    // Real MCP match data: Federer vs Djokovic
    const data = mcpRallyLengths(0);
    
    // Render chart
    setTimeout(() => {
      simpleChart('simple-chart-container', data);
    }, 0);
    
    return container;
  },
  argTypes: {
    width: { control: { type: 'range', min: 300, max: 1200, step: 50 } },
    height: { control: { type: 'range', min: 200, max: 800, step: 50 } },
    minPoints: { control: { type: 'range', min: 10, max: 100, step: 10 } },
  },
};

export default meta;
type Story = StoryObj<SimpleChartArgs>;

/**
 * Default view with standard rally data
 */
export const Default: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 50,
  },
};

/**
 * Short match with fewer points
 */
export const ShortMatch: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 20,
  },
  render: () => {
    const container = document.createElement('div');
    container.id = 'simple-chart-short';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';
    
    // Real MCP match data: Djokovic vs Nadal (shorter match, 99 points)
    const data = mcpRallyLengths(2);
    
    setTimeout(() => {
      simpleChart('simple-chart-short', data);
    }, 0);
    
    return container;
  },
};

/**
 * Long rallies comparison
 */
export const LongRallies: Story = {
  args: {
    width: 800,
    height: 400,
    minPoints: 50,
  },
  render: () => {
    const container = document.createElement('div');
    container.id = 'simple-chart-long';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';
    
    // Real MCP match data: Federer vs Wawrinka (127 points)
    const data = mcpRallyLengths(1);
    
    setTimeout(() => {
      simpleChart('simple-chart-long', data);
    }, 0);
    
    return container;
  },
};

/**
 * Contrasting styles: One player with short rallies, one with long
 */
export const ContrastingStyles: Story = {
  render: () => {
    const container = document.createElement('div');
    container.id = 'simple-chart-contrast';
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.padding = '20px';
    
    // Real MCP match data: Schwartzman vs Cervantes Huegun (135 points)
    const data = mcpRallyLengths(3);
    
    setTimeout(() => {
      simpleChart('simple-chart-contrast', data);
    }, 0);
    
    return container;
  },
};


