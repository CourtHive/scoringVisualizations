/**
 * Rally Tree - Migrated to D3 v7
 * Displays rally length distribution in a tree-like format
 * Shows how rally lengths are distributed by player and outcome
 */

import { max, scaleLinear, area, curveLinear, curveBasis } from 'd3';

interface Point {
  winner: 0 | 1;
  result?: string;
  rally?: string;
  rallyLength?: () => number;
  rl?: [number, number]; // Rally length count per player
  i?: number; // Index
  hide?: boolean;
}

interface RallyTreeOptions {
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  display: {
    sizeToFit: boolean;
  };
  orientation: 'horizontal' | 'vertical';
  data: {
    sort: boolean;
  };
  areas: {
    colors: { 0: string; 1: string };
    interpolation: string;
  };
  points: {
    colors: { [key: string]: string };
  };
}

export function rallyTree() {
  let points: Point[] = [];
  let ryl: number[][];
  let max0: number, max1: number;
  let maxRally: number;
  let maxLimb: number, widthScale: number, barSpacing: number, barHeight: number;
  let displayPct = true;
  let barPadding = 1;
  let cellPadding = 1;
  const transition_time = 1000;

  const options: RallyTreeOptions = {
    width: 100,
    height: 100,
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    display: {
      sizeToFit: false,
    },
    orientation: 'horizontal',
    data: {
      sort: false,
    },
    areas: {
      colors: { 0: 'blue', 1: 'purple' },
      interpolation: 'linear',
    },
    points: {
      colors: {},
    },
  };

  const events = {
    pointbar: { mouseover: null, mouseout: null, click: null },
    statbar: { click: null },
    pctarea: { mouseover: null, mouseout: null },
    update: { begin: null, end: null },
    rallies: { none: null, display: null },
  };

  let rtroot: Selection<SVGSVGElement, any, any, any>;
  let rttree: Selection<SVGGElement, any, any, any>;
  let rtarea: Selection<SVGGElement, any, any, any>;

  function chart(selection: Selection<any, any, any, any>) {
    const root = selection.append('div').attr('class', 'rallyRoot');

    rtroot = root
      .append('svg')
      .attr('class', 'rallyTree')
      .attr('height', options.orientation === 'horizontal' ? options.height : options.width)
      .attr('width', options.orientation === 'horizontal' ? options.width : options.height);

    rttree = rtroot.append('g').attr('class', 'rttree');
    rtarea = rtroot.append('g').attr('class', 'rtarea');

    chart.update = update;
  }

  function update(opts?: { sizeToFit?: boolean }) {
    // Calculate max rally length using D3 v7 max
    maxRally = max(points, (point) => {
      if (point.rally && point.rallyLength) return point.rallyLength();
      return 0;
    }) || 0;

    if (maxRally < 3) {
      rtroot.selectAll('rect').remove();
      rtarea.selectAll('path').remove();
      rtarea.selectAll('line').remove();
      return;
    }

    if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
      // Would get dimensions from parent in real implementation
      options.width = Math.max(options.width, 100);
      options.height = Math.max(options.height, 100);
    }

    if (points.length > 500) {
      barPadding = 0;
      cellPadding = 0;
    } else {
      barPadding = 1;
      cellPadding = 1;
    }

    // Track rally length counts
    ryl = [[], []];
    points.forEach((e, i) => {
      e.i = i;
      const rallyLen = e.rallyLength ? e.rallyLength() : 0;
      if (ryl[e.winner][rallyLen]) {
        ryl[e.winner][rallyLen] += 1;
      } else {
        ryl[e.winner][rallyLen] = 1;
      }
      e.rl = [ryl[0][rallyLen] || 0, ryl[1][rallyLen] || 0];
    });

    rtroot
      .transition()
      .duration(transition_time)
      .attr('width', options.width)
      .attr('height', options.height);

    max0 = points.length ? (points.length === 1 ? points[0].rl![0] : max(points, (p) => p.rl![0])!) : 0;
    max1 = points.length ? (points.length === 1 ? points[0].rl![1] : max(points, (p) => p.rl![1])!) : 0;
    max0 = max0 || 0;
    max1 = max1 || 0;
    maxLimb = max0 + max1 + 1;
    widthScale = (options.orientation === 'horizontal' ? options.width : options.height) / maxLimb;
    barSpacing = (options.orientation === 'horizontal' ? options.height : options.width) / (maxRally + 1);
    barHeight = barSpacing - barPadding;

    // D3 v7: Use .join() instead of .enter().append().merge()
    // Point bars
    rttree.selectAll('rect.point-bar')
      .data(points)
      .join(
        // Enter
        enter => enter
          .append('rect')
          .attr('id', (d, i) => 'cell' + i)
          .attr('class', 'point-bar')
          .attr('x', () => Math.random() * options.width)
          .attr('y', () => Math.random() * options.height)
          .attr('fill', (d) => options.points.colors[d.result || ''] || '#ccc')
          .attr('width', () => (options.orientation === 'horizontal' ? widthScale - cellPadding : barHeight))
          .attr('height', () => (options.orientation === 'horizontal' ? barHeight : widthScale - cellPadding))
          .on('mouseover', events.pointbar.mouseover as any)
          .on('mouseout', events.pointbar.mouseout as any)
          .on('click', events.pointbar.click as any)
          .call(enter => enter.transition()
            .duration(transition_time)
            .style('opacity', 1)
            .attr('x', (d) => calcX(d))
            .attr('y', (d) => calcY(d))
          ),
        // Update
        update => update
          .call(update => update.transition()
            .duration(transition_time)
            .attr('fill', (d) => options.points.colors[d.result || ''] || '#ccc')
            .style('opacity', (d) => (d.hide ? 0 : 1))
            .attr('x', (d) => calcX(d))
            .attr('y', (d) => calcY(d))
            .attr('width', () => (options.orientation === 'horizontal' ? widthScale - cellPadding : barHeight))
            .attr('height', () => (options.orientation === 'horizontal' ? barHeight : widthScale - cellPadding))
          )
      );

    // Win percentage areas
    rtarea.selectAll('.pct-area')
      .data([0, 1])
      .join(
        enter => enter
          .append('path')
          .attr('id', (d) => 'player' + d + 'pctarea')
          .attr('class', 'pct-area')
          .attr('opacity', 0),
        update => update
      )
      .attr('fill', (d) => options.areas.colors[d as 0 | 1])
      .attr('display', displayPct ? 'inline' : 'none')
      .transition()
      .delay(transition_time)
      .attr('opacity', displayPct ? 0.2 : 0)
      .attr('d', (d) => calcArea(d as 0 | 1));

    // Center stat bar
    rtarea.selectAll('rect.stat-bar')
      .data([0])
      .join(
        enter => enter
          .append('rect')
          .attr('class', 'stat-bar')
          .style('opacity', 0.2)
          .attr('fill', 'blue')
      )
      .on('click', events.statbar.click as any)
      .transition()
      .duration(transition_time)
      .style('opacity', 0.2)
      .attr('x', statbarX())
      .attr('y', statbarY())
      .attr('width', statbarWidth())
      .attr('height', statbarHeight());
  }

  function rallyWinPct(player: 0 | 1): number[] {
    const pct: number[] = [];
    const maxLen = maxRally || 20;
    
    for (let i = 0; i <= maxLen; i++) {
      const totalPoints = (ryl[0][i] || 0) + (ryl[1][i] || 0);
      if (totalPoints > 0) {
        pct.push((ryl[player][i] || 0) / totalPoints * 100);
      } else {
        pct.push(0);
      }
    }
    
    return pct;
  }

  function calcArea(player: 0 | 1) {
    // D3 v7: Use curveLinear/curveBasis directly
    const curveType = options.areas.interpolation === 'linear' ? curveLinear : curveBasis;
    const pct = rallyWinPct(player);

    if (options.orientation === 'horizontal') {
      const xScale = scaleLinear()
        .range(player === 0 ? [max0 * widthScale, 0] : [(max0 + 1) * widthScale, options.width])
        .domain([0, 100]);

      const yScale = scaleLinear()
        .range([0, options.height])
        .domain([0, pct.length - 1]);

      return area<number>()
        .curve(curveType)
        .x1((d) => xScale(d))
        .x0(player === 0 ? max0 * widthScale : (max0 + 1) * widthScale)
        .y((d, i) => yScale(i))(pct);
    } else {
      const yScale = scaleLinear()
        .range(player === 0 ? [max0 * widthScale, 0] : [max0 * widthScale, options.height])
        .domain([0, 100]);

      const xScale = scaleLinear()
        .range([0, options.width])
        .domain([0, pct.length - 1]);

      return area<number>()
        .curve(curveType)
        .y1((d) => yScale(d))
        .y0(player === 0 ? max0 * widthScale : max0 * widthScale)
        .x((d, i) => xScale(i))(pct);
    }
  }

  function calcX(d: Point): number {
    const rallyLen = d.rallyLength ? d.rallyLength() : 0;
    if (d.winner === 0) {
      return options.orientation === 'horizontal'
        ? max0 * widthScale - (d.rl![0] || 0) * widthScale
        : rallyLen * barSpacing;
    } else {
      return options.orientation === 'horizontal'
        ? max0 * widthScale + (d.rl![1] || 0) * widthScale
        : rallyLen * barSpacing;
    }
  }

  function calcY(d: Point): number {
    const rallyLen = d.rallyLength ? d.rallyLength() : 0;
    if (d.winner === 0) {
      return options.orientation === 'horizontal'
        ? rallyLen * barSpacing
        : max0 * widthScale - (d.rl![0] || 0) * widthScale;
    } else {
      return options.orientation === 'horizontal'
        ? rallyLen * barSpacing
        : max0 * widthScale + (d.rl![1] || 0) * widthScale;
    }
  }

  function statbarX(): number {
    return options.orientation === 'horizontal' ? max0 * widthScale : 0;
  }

  function statbarY(): number {
    return options.orientation === 'horizontal' ? 0 : max0 * widthScale;
  }

  function statbarWidth(): number {
    return options.orientation === 'horizontal' ? widthScale - cellPadding : options.width;
  }

  function statbarHeight(): number {
    return options.orientation === 'horizontal' ? options.height : widthScale - cellPadding;
  }

  // ACCESSORS
  chart.options = function (values?: any) {
    if (!arguments.length) return options;
    const vKeys = Object.keys(values);
    const oKeys = Object.keys(options);
    for (let k = 0; k < vKeys.length; k++) {
      if (oKeys.indexOf(vKeys[k]) >= 0) {
        if (typeof options[vKeys[k]] === 'object') {
          const sKeys = Object.keys(values[vKeys[k]]);
          const osKeys = Object.keys(options[vKeys[k]]);
          for (let sk = 0; sk < sKeys.length; sk++) {
            if (osKeys.indexOf(sKeys[sk]) >= 0) {
              options[vKeys[k]][sKeys[sk]] = values[vKeys[k]][sKeys[sk]];
            }
          }
        } else {
          options[vKeys[k]] = values[vKeys[k]];
        }
      }
    }
    return chart;
  };

  chart.data = function (value?: Point[]) {
    if (!arguments.length) return points;
    points = value || [];
    return chart;
  };

  chart.events = function (value?: any) {
    if (!arguments.length) return events;
    if (typeof value !== 'undefined') {
      const vKeys = Object.keys(value);
      const eKeys = Object.keys(events);
      for (let k = 0; k < vKeys.length; k++) {
        if (eKeys.indexOf(vKeys[k]) >= 0) {
          const sKeys = Object.keys(value[vKeys[k]]);
          const esKeys = Object.keys(events[vKeys[k]]);
          for (let sk = 0; sk < sKeys.length; sk++) {
            if (esKeys.indexOf(sKeys[sk]) >= 0) {
              events[vKeys[k]][sKeys[sk]] = value[vKeys[k]][sKeys[sk]];
            }
          }
        }
      }
    }
    return chart;
  };

  chart.update = update;

  return chart;
}
