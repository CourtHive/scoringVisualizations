/* eslint-disable */
// @ts-nocheck
import { select, scaleLinear, line, axisBottom, axisLeft } from 'd3';
import { extractRallyLengths } from '../engine/feedMatchUp';

export function simpleChart(target: any, data: any, playerNames?: [string, string]) {
  const dom_parent = select('#' + target);
  // let dims = dom_parent.node().getBoundingClientRect();
  //   let screen_width = dims.width;
  //   let screen_height = screen_width / 2;
  const screen_width = window.innerWidth * 0.85;
  const screen_height = screen_width / 2;

  const min_points = 50;
  const colors = ['blue', 'red'];
  dom_parent.selectAll('svg').remove();
  const svg = dom_parent.append('svg').attr('width', screen_width).attr('height', screen_height);

  const margin = { top: 30, right: 20, bottom: 50, left: 55 };
  const width = +svg.attr('width') - margin.left - margin.right;
  const height = +svg.attr('height') - margin.top - margin.bottom;

  const x = scaleLinear().range([0, width]);
  const y = scaleLinear().range([height, 0]);

  const lineGenerator = line()
    .x(function (d) {
      return x(d[0]);
    })
    .y(function (d) {
      return y(d[1]);
    });
  //      .curve(d3.curveStepAfter);

  const chart = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const maxY = Math.max(...data.map((p) => p.length));
  x.domain([0, Math.max(...data.map((p) => Math.max(...p)), min_points)]);
  y.domain([0, maxY]);

  chart
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(axisBottom(x));

  chart
    .append('g')
    .call(
      axisLeft(y)
        .ticks(Math.min(maxY, 4))
        .tickFormat((d) => d)
    );

  // X-axis label
  chart
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('font-size', '14px')
    .attr('fill', '#333')
    .text('Rally Length');

  // Y-axis label
  chart
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -40)
    .attr('font-size', '14px')
    .attr('fill', '#333')
    .text('Points Won');

  // Legend
  const names = playerNames || ['Player 1', 'Player 2'];
  const legend = chart.append('g').attr('transform', `translate(${width - 180}, 0)`);
  [0, 1].forEach((i) => {
    const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
    g.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 0).attr('y2', 0)
      .attr('stroke', colors[i]).attr('stroke-width', 3);
    g.append('text').attr('x', 25).attr('y', 4).attr('font-size', '12px').attr('fill', '#333')
      .text(names[i]);
  });

  drawLines(data);
  appendCircles(data);

  function lineData(points) {
    points = points.map((point, index) => [point, index + 1]);
    points.unshift([0, 0]);
    return points;
  }

  function drawLines(players) {
    players.forEach((points, index) => {
      chart
        .append('path')
        .datum(lineData(points))
        .attr('fill', 'none')
        .attr('stroke', colors[index])
        .attr('stroke-width', '5px')
        .attr('shape-rendering', 'crispEdges')
        .attr('d', lineGenerator);
    });
  }

  function appendCircles(players) {
    players.forEach((points, index) => {
      const targetclass = '.datapoint' + index;
      if (points.length < 10) {
        // D3 v7: Use .join() instead of .enter().append()
        chart
          .selectAll(targetclass)
          .data(lineData(points))
          .join('circle')
          .attr('class', targetclass.slice(1)) // Remove leading dot for class name
          .attr('fill', '#FFFFFF')
          .attr('stroke', colors[index])
          .attr('stroke-width', '2px')
          .attr('r', 3.5)
          .attr('cx', function (d) {
            return x(d[0]);
          })
          .attr('cy', function (d) {
            return y(d[1]);
          });
      }
    });
  }
}

/**
 * Companion function: render simpleChart directly from a ScoringEngine MatchUp.
 */
export function simpleChartFromMatchUp(target: any, matchUp: any, playerNames?: [string, string]): void {
  const data = extractRallyLengths(matchUp);
  simpleChart(target, data, playerNames);
}
