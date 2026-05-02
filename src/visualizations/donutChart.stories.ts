import type { Meta, StoryObj } from '@storybook/html';
import {
  donutChart,
  donutChartFromMatchUps,
  aggregateMatchUps,
  type DonutDatum,
  type DonutChartOptions,
} from './donutChart.ts';
import { createJsonViewer } from './helpers/JsonViewer';

interface DonutChartArgs {
  width: number;
  height: number;
  showCenterTotal: boolean;
  showTitle: boolean;
}

/**
 * Donut Chart — Match Competitiveness Distribution
 *
 * Aggregate view of how matchUps in a structure (or any list of matchUps)
 * distribute across the four competitiveness buckets:
 *
 * - **COMPETITIVE** — close matches (small score spread)
 * - **ROUTINE** — moderate spread
 * - **DECISIVE** — wide spread, dominant winner
 * - **WALKOVER / DEFAULTED** — non-played outcomes (greyed/light)
 *
 * Buckets come from `matchUp.competitiveProfile.competitiveness` (populated
 * when fetched with `contextProfile: { withCompetitiveness: true }`). The
 * fourth bucket absorbs `WALKOVER` / `DOUBLE_WALKOVER` / `DEFAULTED` /
 * `DOUBLE_DEFAULT` matchUpStatus values.
 *
 * Originally a TMX-Classic visualization (orgTournament repo, d3 v5.16),
 * rescued and rebuilt for d3 v7 + the modern factory data model.
 */
const meta: Meta<DonutChartArgs> = {
  title: 'Visualizations/DonutChart',
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 200, max: 800, step: 20 } },
    height: { control: { type: 'range', min: 200, max: 800, step: 20 } },
    showCenterTotal: { control: 'boolean' },
    showTitle: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DonutChartArgs>;

const SAMPLE_DATA: DonutDatum[] = [
  { bucket: 'COMPETITIVE', count: 18 },
  { bucket: 'ROUTINE', count: 12 },
  { bucket: 'DECISIVE', count: 7 },
  { bucket: 'WALKOVER', count: 3 },
];

function chartLayout(
  data: DonutDatum[] | undefined,
  matchUps: any[] | undefined,
  args: DonutChartArgs,
  title?: string,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex; gap:20px; padding:20px; align-items:flex-start;';

  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = 'flex:1; min-width:480px; background:#f5f5f5; padding:20px; border-radius:8px;';

  const dataContainer = document.createElement('div');
  dataContainer.style.cssText = 'flex:0 0 360px;';
  const dataTitle = document.createElement('h3');
  dataTitle.textContent = matchUps ? 'Sample MatchUps' : 'Aggregated Buckets';
  dataTitle.style.cssText = 'margin:0 0 10px 0;';
  dataContainer.appendChild(dataTitle);

  const jsonContainer = document.createElement('div');
  createJsonViewer(jsonContainer, matchUps ?? data, { expanded: 1 });
  dataContainer.appendChild(jsonContainer);

  const opts: DonutChartOptions = {
    width: args.width,
    height: args.height,
    showCenterTotal: args.showCenterTotal,
    title: args.showTitle ? title : undefined,
    onSliceClick: (d) => console.log('clicked', d),
  };

  setTimeout(() => {
    if (matchUps) {
      donutChartFromMatchUps(chartContainer, matchUps, opts);
    } else if (data) {
      donutChart(chartContainer, data, opts);
    }
  }, 0);

  wrapper.appendChild(chartContainer);
  wrapper.appendChild(dataContainer);
  return wrapper;
}

export const Default: Story = {
  args: { width: 400, height: 400, showCenterTotal: true, showTitle: false },
  render: (args) => chartLayout(SAMPLE_DATA, undefined, args),
};

export const WithTitle: Story = {
  args: { width: 480, height: 480, showCenterTotal: true, showTitle: true },
  render: (args) => chartLayout(SAMPLE_DATA, undefined, args, 'U16 Boys Singles — Main Draw'),
};

export const NoWalkovers: Story = {
  args: { width: 400, height: 400, showCenterTotal: true, showTitle: false },
  render: (args) =>
    chartLayout(
      [
        { bucket: 'COMPETITIVE', count: 22 },
        { bucket: 'ROUTINE', count: 14 },
        { bucket: 'DECISIVE', count: 9 },
        { bucket: 'WALKOVER', count: 0 },
      ],
      undefined,
      args,
    ),
};

export const MostlyDecisive: Story = {
  args: { width: 400, height: 400, showCenterTotal: true, showTitle: false },
  render: (args) =>
    chartLayout(
      [
        { bucket: 'COMPETITIVE', count: 2 },
        { bucket: 'ROUTINE', count: 4 },
        { bucket: 'DECISIVE', count: 24 },
        { bucket: 'WALKOVER', count: 1 },
      ],
      undefined,
      args,
    ),
};

export const Empty: Story = {
  args: { width: 400, height: 400, showCenterTotal: true, showTitle: false },
  render: (args) =>
    chartLayout(
      [
        { bucket: 'COMPETITIVE', count: 0 },
        { bucket: 'ROUTINE', count: 0 },
        { bucket: 'DECISIVE', count: 0 },
        { bucket: 'WALKOVER', count: 0 },
      ],
      undefined,
      args,
    ),
};

export const FromMatchUps: Story = {
  args: { width: 400, height: 400, showCenterTotal: true, showTitle: true },
  render: (args) => {
    const sampleMatchUps = [
      ...buildMatchUps('COMPETITIVE', 18),
      ...buildMatchUps('ROUTINE', 12),
      ...buildMatchUps('DECISIVE', 7),
      ...buildMatchUps('WALKOVER_STATUS', 3),
    ];
    return chartLayout(undefined, sampleMatchUps, args, 'Aggregated from MatchUps');
  },
};

function buildMatchUps(kind: string, count: number): any[] {
  const out: any[] = [];
  for (let i = 0; i < count; i += 1) {
    if (kind === 'WALKOVER_STATUS') {
      out.push({ matchUpId: `wo-${i}`, matchUpStatus: 'WALKOVER' });
    } else {
      out.push({
        matchUpId: `${kind.toLowerCase()}-${i}`,
        matchUpStatus: 'COMPLETED',
        competitiveProfile: { competitiveness: kind },
      });
    }
  }
  return out;
}

// Smoke-test the bucket helper from inside the story so the data viewer panel
// can show the same shape the chart consumes.
export const BucketAggregation: Story = {
  args: { width: 400, height: 400, showCenterTotal: true, showTitle: false },
  render: (args) => {
    const sampleMatchUps = [
      ...buildMatchUps('COMPETITIVE', 5),
      ...buildMatchUps('ROUTINE', 3),
      ...buildMatchUps('DECISIVE', 2),
      ...buildMatchUps('WALKOVER_STATUS', 1),
    ];
    const aggregated = aggregateMatchUps(sampleMatchUps);
    return chartLayout(aggregated, undefined, args);
  },
};
