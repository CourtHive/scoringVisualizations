/* eslint-disable */
// @ts-nocheck
/**
 * Horizon Chart — Single-set renderer (D3 v7)
 *
 * Renders one horizon chart for a single set's differential data.
 * Takes sdata: [index, diff][] and renders colored area bands —
 * positive values fan out in one color, negative in another,
 * stacked by band count.
 */

import { select, scaleLinear, area, curveBasis, curveLinear, range as d3Range } from 'd3';
import { keyWalk } from './utils/keyWalk';

type CurveInterpolation = 'basis' | 'linear';

interface HorizonChartOptions {
  id: string | number;
  width: number;
  height: number;
  position: { x: number; y: number };
  display: {
    ppp: number | undefined;
    bands: number;
    mode: 'mirror' | 'offset';
    orientation: 'horizontal' | 'vertical';
    transition_time: number;
    interpolate: CurveInterpolation;
  };
  bounds: { vRangeMax: number | undefined };
}

interface HorizonChartEvents {
  update: { begin: (() => void) | null; end: (() => void) | null };
  chart: { click: ((data: any) => void) | null };
  path: { mouseover: ((data: any) => void) | null; mouseout: ((d: any, i: number, el: any) => void) | null };
}

export function horizonChart() {
  let updateFn: (() => void) | undefined;
  let data: any;
  let sdata: [number, number][] = [];

  const options: HorizonChartOptions = {
    id: 0,
    width: 960,
    height: 100,
    position: { x: 0, y: 0 },
    display: {
      ppp: undefined,
      bands: 1,
      mode: 'mirror',
      orientation: 'horizontal',
      transition_time: 0,
      interpolate: 'basis',
    },
    bounds: { vRangeMax: undefined },
  };

  const colorScale = scaleLinear<string>()
    .domain([-options.display.bands, 0, 0, options.display.bands])
    .range(['#08519c', '#bdd7e7', '#bae4b3', '#006d2c']);

  const events: HorizonChartEvents = {
    update: { begin: null, end: null },
    chart: { click: null },
    path: { mouseover: null, mouseout: null },
  };

  function chart(selection: any) {
    selection.each(function (_: any, i: number, n: any) {
      const root = select(n[i]).append('svg:g').attr('class', 'hcc').append('a');

      updateFn = function () {
        const horizontal = options.display.orientation === 'horizontal';
        const bandRange = horizontal ? options.height : options.width;
        const ppp = options.display.ppp ? options.display.ppp : bandRange / sdata.length;
        const zwidth = horizontal ? ppp * sdata.length : options.width;
        const zheight = horizontal ? options.height : ppp * sdata.length;
        const bands = options.display.bands;
        const curveType = options.display.interpolate === 'linear' ? curveLinear : curveBasis;

        root
          .attr('width', zwidth)
          .attr('height', zheight)
          .attr('transform', `translate(${+options.position.x},${+options.position.y})`)
          .on('click', function () {
            if (events.chart.click) events.chart.click(data);
          });

        // Scales
        const xExtent: [number, number] = [
          Math.min(...sdata.map((d) => d[0])),
          Math.max(...sdata.map((d) => d[0])),
        ];

        const x = scaleLinear().domain(xExtent).range([0, ppp * sdata.length]);

        const yMax = options.bounds.vRangeMax ?? Math.max(...sdata.map((d) => Math.abs(d[1])));
        const y = scaleLinear()
          .domain([0, yMax])
          .range([0, bandRange * bands]);

        // Transform function for band positioning
        let transform: (d: number) => string;
        if (horizontal) {
          transform =
            options.display.mode === 'offset'
              ? (d: number) => `translate(0,${(d + (d < 0 ? 1 : 0) - bands) * bandRange})`
              : (d: number) => `${d < 0 ? 'scale(1,-1)' : ''}translate(0,${(d - bands) * bandRange})`;
        } else {
          transform =
            options.display.mode === 'offset'
              ? (d: number) => `translate(${(d + (d < 0 ? 1 : 0) - bands) * bandRange},0)`
              : (d: number) => `${d < 0 ? 'scale(-1,1)' : ''}translate(${(d - bands) * bandRange},0)`;
        }

        // Clip path
        const defs = root.selectAll('defs').data([null]);
        const defsEnter = defs.enter().append('defs');
        defsEnter.append('clipPath').attr('id', `horizon_clip${options.id}`).append('rect');

        root
          .selectAll('defs')
          .select('clipPath')
          .select('rect')
          .attr('width', zwidth)
          .attr('height', zheight);

        // Clip group
        const clipGroup = root.selectAll('g.horizon-clip').data([null]);
        clipGroup
          .enter()
          .append('g')
          .attr('class', 'horizon-clip')
          .attr('clip-path', `url(#horizon_clip${options.id})`);

        // Area generator
        const horizonArea = horizontal
          ? area<[number, number]>()
              .curve(curveType)
              .x((d) => x(d[0]))
              .y0(bandRange * bands)
              .y1((d) => bandRange * bands - y(d[1]))
          : area<[number, number]>()
              .curve(curveType)
              .y((d) => x(d[0]))
              .x0(bandRange * bands)
              .x1((d) => bandRange * bands - y(d[1]));

        const areaPath = horizonArea(sdata) ?? '';

        // Band indices: [-1, -2, ..., -bands, 1, 2, ..., bands]
        const bandIndices = d3Range(-1, -bands - 1, -1).concat(d3Range(1, bands + 1));

        const path = root.select('g.horizon-clip').selectAll<SVGPathElement, number>('path').data(bandIndices, Number);

        path.exit().remove();

        path
          .enter()
          .append('path')
          .merge(path)
          .on('mouseover', function () {
            if (events.path.mouseover) events.path.mouseover(data);
          })
          .on('mouseout', function (_event: any, d: number) {
            if (events.path.mouseout) events.path.mouseout(d, 0, this);
          })
          .transition()
          .duration(options.display.transition_time)
          .style('fill', (d: number) => colorScale(d))
          .attr('transform', (d: number) => transform(d))
          .attr('d', areaPath);
      };
    });
  }

  // Accessors

  chart.options = function (values?: Record<string, any>) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  };

  chart.events = function (functions?: Partial<HorizonChartEvents>) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.width = function (value?: number) {
    if (!arguments.length) return options.width;
    options.width = value!;
    return chart;
  };

  chart.height = function (value?: number) {
    if (!arguments.length) return options.height;
    options.height = value!;
    return chart;
  };

  chart.data = function (values?: any) {
    if (!arguments.length) return data;
    data = values;
    return chart;
  };

  chart.sdata = function (values?: [number, number][]) {
    if (!arguments.length) return sdata;
    if (Array.isArray(values)) sdata = values;
    return chart;
  };

  chart.update = function () {
    if (events.update.begin) events.update.begin();
    if (typeof updateFn === 'function') updateFn();
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transition_time);
  };

  chart.bands = function (value?: number) {
    if (!arguments.length) return options.display.bands;
    options.display.bands = +value!;
    colorScale.domain([-options.display.bands, 0, 0, options.display.bands]);
    return chart;
  };

  chart.mode = function (value?: string) {
    if (!arguments.length) return options.display.mode;
    options.display.mode = (value + '') as 'mirror' | 'offset';
    return chart;
  };

  chart.duration = function (value?: number) {
    if (!arguments.length) return options.display.transition_time;
    options.display.transition_time = +value!;
    return chart;
  };

  chart.orientation = function (value?: string) {
    if (!arguments.length) return options.display.orientation;
    options.display.orientation = (value + '') as 'horizontal' | 'vertical';
    return chart;
  };

  chart.colors = function (colorRange?: [string, string, string, string]) {
    if (!arguments.length) return colorScale.range();
    colorScale.domain([-options.display.bands, 0, 0, options.display.bands]);
    colorScale.range(colorRange!);
    return chart;
  };

  return chart;
}

