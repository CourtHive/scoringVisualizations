import { select, arc as d3Arc, pie as d3Pie } from 'd3';

export type CompetitivenessBucket = 'COMPETITIVE' | 'ROUTINE' | 'DECISIVE' | 'WALKOVER';

export interface DonutDatum {
  bucket: CompetitivenessBucket;
  count: number;
}

export interface DonutChartOptions {
  width?: number;
  height?: number;
  padAngle?: number;
  cornerRadius?: number;
  colors?: Partial<Record<CompetitivenessBucket, string>>;
  labels?: Partial<Record<CompetitivenessBucket, string>>;
  showCenterTotal?: boolean;
  title?: string;
  onSliceClick?: (datum: DonutDatum) => void;
}

const BUCKET_ORDER: CompetitivenessBucket[] = ['COMPETITIVE', 'ROUTINE', 'DECISIVE', 'WALKOVER'];
// Legend reads top→bottom shortest→longest; longest label sits at the bottom
// where it has the most horizontal clearance from the donut arc.
const LEGEND_ORDER: CompetitivenessBucket[] = ['ROUTINE', 'DECISIVE', 'COMPETITIVE', 'WALKOVER'];

const DEFAULT_COLORS: Record<CompetitivenessBucket, string> = {
  COMPETITIVE: '#2BC303',
  ROUTINE: '#0369C3',
  DECISIVE: '#7E57C2',
  WALKOVER: '#E0E0E0',
};

const DEFAULT_LABELS: Record<CompetitivenessBucket, string> = {
  COMPETITIVE: 'Competitive',
  ROUTINE: 'Routine',
  DECISIVE: 'Decisive',
  WALKOVER: 'Walkover / Defaulted',
};

const WALKOVER_STATUSES = new Set(['WALKOVER', 'DOUBLE_WALKOVER', 'DEFAULTED', 'DOUBLE_DEFAULT']);
const COMPETITIVENESS_VALUES = new Set<CompetitivenessBucket>(['COMPETITIVE', 'ROUTINE', 'DECISIVE']);

const TEXT_PRIMARY = 'var(--tmx-text-primary, #333)';
const TEXT_SECONDARY = 'var(--tmx-text-secondary, #555)';
const TEXT_MUTED = 'var(--tmx-text-muted, #888)';
const ANCHOR_MIDDLE = 'middle';
const FONT_WEIGHT_BOLD = 'bold';
const ATTR_TEXT_ANCHOR = 'text-anchor';
const ATTR_FONT_WEIGHT = 'font-weight';

/**
 * Bucket factory matchUps by competitiveness for donut input.
 * WALKOVER bucket absorbs WALKOVER / DOUBLE_WALKOVER / DEFAULTED / DOUBLE_DEFAULT
 * matchUpStatus values; the three competitiveness levels come from
 * `matchUp.competitiveProfile.competitiveness` (populated when the matchUp
 * was fetched with `contextProfile: { withCompetitiveness: true }`).
 */
export function aggregateMatchUps(matchUps: any[]): DonutDatum[] {
  const counts: Record<CompetitivenessBucket, number> = {
    COMPETITIVE: 0,
    ROUTINE: 0,
    DECISIVE: 0,
    WALKOVER: 0,
  };

  for (const matchUp of matchUps) {
    if (matchUp?.matchUpStatus && WALKOVER_STATUSES.has(matchUp.matchUpStatus)) {
      counts.WALKOVER += 1;
      continue;
    }
    const competitiveness = matchUp?.competitiveProfile?.competitiveness as CompetitivenessBucket | undefined;
    if (competitiveness && COMPETITIVENESS_VALUES.has(competitiveness)) {
      counts[competitiveness] += 1;
    }
  }

  return BUCKET_ORDER.map((bucket) => ({ bucket, count: counts[bucket] }));
}

function renderEmpty(target: HTMLElement): void {
  const empty = document.createElement('div');
  empty.style.cssText = `color:${TEXT_MUTED}; font-size:0.95rem; text-align:center; padding:24px;`;
  empty.textContent = 'No matches to chart';
  target.appendChild(empty);
}

export function donutChart(
  target: HTMLElement,
  data: DonutDatum[],
  options: DonutChartOptions = {},
): void {
  const {
    width = 400,
    height = 400,
    padAngle = 0.02,
    cornerRadius = 4,
    colors = {},
    labels = {},
    showCenterTotal = true,
    title,
    onSliceClick,
  } = options;

  const palette = { ...DEFAULT_COLORS, ...colors };
  const display = { ...DEFAULT_LABELS, ...labels };

  const root = select(target);
  root.selectAll('svg').remove();
  root.selectAll('div.donut-empty').remove();

  const slices = data.filter((d) => d.count > 0);
  const total = slices.reduce((sum, d) => sum + d.count, 0);

  if (!slices.length) {
    renderEmpty(target);
    return;
  }

  const radius = Math.min(width, height) / 2;
  const innerRadius = radius * 0.6;
  const outerRadius = radius * 0.85;

  const svg = root
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block')
    .style('margin', '0 auto');

  if (title) {
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 18)
      .attr(ATTR_TEXT_ANCHOR, ANCHOR_MIDDLE)
      .attr('font-size', '14px')
      .attr(ATTR_FONT_WEIGHT, FONT_WEIGHT_BOLD)
      .attr('fill', TEXT_PRIMARY)
      .text(title);
  }

  const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

  const pieGenerator = d3Pie<DonutDatum>()
    .value((d) => d.count)
    .sort(null)
    .padAngle(padAngle);

  const arcGenerator = d3Arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(cornerRadius);

  const arcs = pieGenerator(slices);

  const sliceSelection = g
    .append('g')
    .attr('class', 'donut-slices')
    .selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', (d) => palette[d.data.bucket])
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1)
    .style('cursor', onSliceClick ? 'pointer' : 'default');

  if (onSliceClick) {
    sliceSelection.on('click', (_event, d) => onSliceClick(d.data));
  }

  sliceSelection.append('title').text((d) => {
    const pct = total > 0 ? ((d.data.count / total) * 100).toFixed(1) : '0';
    return `${display[d.data.bucket]}: ${d.data.count} (${pct}%)`;
  });

  g.append('g')
    .attr('class', 'donut-slice-labels')
    .selectAll('text')
    .data(arcs)
    .join('text')
    .attr('transform', (d) => `translate(${arcGenerator.centroid(d)})`)
    .attr(ATTR_TEXT_ANCHOR, ANCHOR_MIDDLE)
    .attr('dy', '0.35em')
    .attr('font-size', '12px')
    .attr(ATTR_FONT_WEIGHT, FONT_WEIGHT_BOLD)
    .attr('fill', (d) => (d.data.bucket === 'WALKOVER' ? '#666' : '#fff'))
    .attr('pointer-events', 'none')
    .text((d) => (d.endAngle - d.startAngle < 0.25 ? '' : String(d.data.count)));

  if (showCenterTotal) {
    const center = g.append('g').attr('class', 'donut-center');
    center
      .append('text')
      .attr(ATTR_TEXT_ANCHOR, ANCHOR_MIDDLE)
      .attr('dy', '-0.2em')
      .attr('font-size', '28px')
      .attr(ATTR_FONT_WEIGHT, FONT_WEIGHT_BOLD)
      .attr('fill', TEXT_PRIMARY)
      .text(total);
    center
      .append('text')
      .attr(ATTR_TEXT_ANCHOR, ANCHOR_MIDDLE)
      .attr('dy', '1.2em')
      .attr('font-size', '11px')
      .attr('fill', TEXT_SECONDARY)
      .text('matches');
  }

  const legend = svg
    .append('g')
    .attr('class', 'donut-legend')
    .attr('transform', `translate(12, ${height - 12 - LEGEND_ORDER.length * 16})`);

  for (const [i, bucket] of LEGEND_ORDER.entries()) {
    const present = slices.find((s) => s.bucket === bucket);
    const row = legend.append('g').attr('transform', `translate(0, ${i * 16})`);
    row
      .append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', palette[bucket])
      .attr('opacity', present ? 1 : 0.35);
    row
      .append('text')
      .attr('x', 14)
      .attr('y', 9)
      .attr('font-size', '11px')
      .attr('fill', TEXT_SECONDARY)
      .text(`${display[bucket]} (${present?.count ?? 0})`);
  }
}

/**
 * Render the donut directly from a list of factory matchUps (with
 * `competitiveProfile.competitiveness` populated).
 */
export function donutChartFromMatchUps(
  target: HTMLElement,
  matchUps: any[],
  options: DonutChartOptions = {},
): void {
  donutChart(target, aggregateMatchUps(matchUps), options);
}
