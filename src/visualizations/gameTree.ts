/* eslint-disable */
// @ts-nocheck
/**
 * Game Tree Visualization - Standalone Version (D3 v7)
 * Now supports both UMO v4 and legacy Episode formats
 */
import { select, scaleLinear } from 'd3';
import { buildEpisodes } from '../episodes/buildEpisodes';

// Helper Functions
// ----------------

// http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeColor2(color, percent) {
  const f = Number.parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

// not used
export function blendColors(c0, c1, p) {
  const f = Number.parseInt(c0.slice(1), 16),
    t = Number.parseInt(c1.slice(1), 16),
    R1 = f >> 16,
    G1 = (f >> 8) & 0x00ff,
    B1 = f & 0x0000ff,
    R2 = t >> 16,
    G2 = (t >> 8) & 0x00ff,
    B2 = t & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((R2 - R1) * p) + R1) * 0x10000 +
      (Math.round((G2 - G1) * p) + G1) * 0x100 +
      (Math.round((B2 - B1) * p) + B1)
    )
      .toString(16)
      .slice(1)
  );
}

function shadeRGBColor(color, percent) {
  const f = color.split(','),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = Number.parseInt(f[0].slice(4)),
    G = Number.parseInt(f[1]),
    B = Number.parseInt(f[2]);
  return (
    'rgb(' +
    (Math.round((t - R) * p) + R) +
    ',' +
    (Math.round((t - G) * p) + G) +
    ',' +
    (Math.round((t - B) * p) + B) +
    ')'
  );
}

// not used
export function blendRGBColors(c0, c1, p) {
  const f = c0.split(','),
    t = c1.split(','),
    R = Number.parseInt(f[0].slice(4)),
    G = Number.parseInt(f[1]),
    B = Number.parseInt(f[2]);
  return (
    'rgb(' +
    (Math.round((Number.parseInt(t[0].slice(4)) - R) * p) + R) +
    ',' +
    (Math.round((Number.parseInt(t[1]) - G) * p) + G) +
    ',' +
    (Math.round((Number.parseInt(t[2]) - B) * p) + B) +
    ')'
  );
}

function colorShade(color, percent) {
  if (color.length > 7) return shadeRGBColor(color, percent);
  else return shadeColor2(color, percent);
}

// not used
export function colorBlend(color1, color2, percent) {
  if (color1.length > 7) return blendRGBColors(color1, color2, percent);
  else return blendColors(color1, color2, percent);
}

// http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
function getHexColor(colorStr) {
  const a = document.createElement('div');
  a.style.color = colorStr;
  const colors = window
    .getComputedStyle(document.body.appendChild(a))
    .color.match(/\d+/g)
    .map(function (a) {
      return Number.parseInt(a, 10);
    });
  document.body.removeChild(a);
  return colors.length >= 3
    ? '#' + ((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2]).toString(16).substr(1)
    : false;
}

function applyMax(arr: any) {
  return Math.max.apply(null, arr);
}

function applyMin(arr: any) {
  return Math.min.apply(null, arr);
}

function get_id(d: any) {
  return d?.id;
}

export function gameTree() {
  // change the gradient direction in lines across width
  // which means changing line so that it is short and wide
  // rather than long and thick
  //
  // bar chart showing win % for each player or primary/opponents
  // for each point position

  const images = { left: undefined, right: undefined };

  // All options that should be accessible to caller
  let data: any[] = [];
  const options: any = {
    width: 150,
    height: 150,
    min_max: 20, // scaling factor for line widths

    // Margins for the SVG
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },

    display: {
      noAd: false,
      leftImg: false,
      rightImg: false,
      show_images: false,
      sizeToFit: true,
      showEmpty: false, // display even if no data
    },

    lines: {
      easing: false, // 'bounce'
      duration: 600,
      points: { winners: '#2ed2db', errors: '#2ed2db', unknown: '#2ed2db' },
      colors: { underlines: '#2ed2db' },
    },

    nodes: {
      colors: { 0: 'black', 1: 'red', neutral: '#ecf0f1' },
    },

    points: {
      winners: [
        'Winner',
        'Ace',
        'Serve Winner',
        'Passing Shot',
        'Return Winner',
        'Forcing Error',
        'Forcing Volley Error',
        'Net Cord',
        'In',
      ],
      errors: [
        'Unforced Error',
        'Unforced',
        'Forced Error',
        'Error',
        'Out',
        'Net',
        'Netted Passing Shot',
        'L',
        'Overhead Passing Shot',
        'Double Fault',
      ],
      highlight: [], // opposite of filter; filter unhighlighted...
    },

    selectors: {
      enabled: true,
      selected: { 0: false, 1: false },
    },

    labels: { Game: 'GAME', Player: 'Player', Opponent: 'Opponent' },
  };

  // functions which should be accessible via ACCESSORS
  let update: any;

  // PROGRAMMATIC
  // ------------
  let canvas: any;
  let radius: any;
  const transition_time: number = 0;
  const point_connector: string = 'x';
  let counters: any = { w: {}, e: {}, p: {}, n: {} };
  let activeNodeName: string | null = null;

  // DEFINABLE EVENTS
  // Define with ACCESSOR function chart.events()
  const events: any = {
    leftImage: { click: null },
    rightImage: { click: null },
    update: { begin: null, end: null },
    point: { mousemove: null, mouseout: null },
    node: { mousemove: null, mouseout: null },
    score: { mousemove: null, mouseout: null },
    label: { mousemove: null, mouseout: null, click: selectView },
    selector: { mousemove: null, mouseout: null, click: selectView },
  };

  function chart(selection: any) {
    const root = selection.append('div').attr('class', 'gametreeRoot');

    canvas = root.append('svg');

    update = function (opts: any) {
      if (!data.length && !options.display.showEmpty) {
        canvas.selectAll('*').remove();
        return;
      }

      counterCalcs();

      if (options.display.sizeToFit || opts?.sizeToFit) {
        const dims = selection.node().getBoundingClientRect();
        options.width = Math.min(dims.width, dims.height);
      }

      const tree_width = options.width - (options.margins.left + options.margins.right);
      const tree_height = options.width * 0.9;
      radius = ((tree_height + tree_width) / 2) * 0.03;

      const keys = point_lines.map(function (m) {
        return m.id;
      });

      const point_min = applyMin(
        keys.map(function (k) {
          return isNaN(counters.p[k]) ? 0 : counters.p[k];
        }),
      );
      const point_max = applyMax([
        applyMax(
          keys.map(function (k) {
            return isNaN(counters.p[k]) ? 0 : counters.p[k];
          }),
        ),
        options.min_max,
      ]);

      const scale = scaleLinear()
        .domain([point_min, point_max])
        .range([0, radius * 2]);

      canvas.transition().duration(transition_time).attr('width', tree_width).attr('height', tree_height);

      // D3 v7: Use .join() pattern and save merged selection
      const gradientsMerged = canvas
        .selectAll('.gradient')
        .data(point_lines, get_id)
        .join('linearGradient')
        .attr('id', (d: any) => {
          return 'gradient' + d.id;
        })
        .attr('class', 'gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', (d: any) => {
          return d.start.x * tree_width;
        })
        .attr('y1', (d: any) => {
          return d.start.y * tree_height;
        })
        .attr('x2', (d: any) => {
          return d.end.x * tree_width;
        })
        .attr('y2', (d: any) => {
          return d.end.y * tree_height;
        });

      // D3 v7: Use .join() for stops and operate on saved merged selection
      gradientsMerged
        .selectAll('.points_stop')
        .data((d: any) => {
          return calcStops(d);
        })
        .join('stop')
        .attr('class', 'points_stop')
        .attr('offset', (d: any) => {
          return d.offset;
        })
        .attr('stop-color', (d: any) => {
          return d.color;
        });

      // D3 v7: Use .join() with enter/update transitions
      canvas
        .selectAll('.line')
        .data(point_lines)
        .join(
          (enter) =>
            enter
              .append('line')
              .attr('class', 'line')
              .attr('id', (d: any) => d.id)
              .attr('x1', (d: any) => d.start.x * tree_width)
              .attr('y1', (d: any) => d.start.y * tree_height)
              .attr('x2', (d: any) => d.end.x * tree_width)
              .attr('y2', (d: any) => d.end.y * tree_height)
              .attr('stroke-width', (d: any) => (d.width ? d.width : 0))
              .attr('stroke', (d: any) => 'url(#gradient' + d.id + ')')
              .on('mousemove', function (event, d) {
                if (events.point.mousemove) events.point.mousemove(d, event);
              })
              .on('mouseout', function (event, d) {
                if (events.point.mouseout) events.point.mouseout(d, event);
              })
              .on('click', function (event, d) {
                if (events.point.click) events.point.click(d, event);
              }),
          (update) => update,
        )
        .transition()
        .duration(options.lines.easing || (opts && opts.easing) ? options.lines.duration : 0)
        .attr('x1', (d: any) => d.start.x * tree_width)
        .attr('y1', (d: any) => d.start.y * tree_height)
        .attr('x2', (d: any) => d.end.x * tree_width)
        .attr('y2', (d: any) => d.end.y * tree_height)
        .attr('stroke-width', (d: any) => (counters.p[d.id] ? scale(counters.p[d.id]) : 0));

      const ulines = canvas.selectAll('.uline').data(under_lines);

      ulines.exit().remove();

      ulines
        .enter()
        .append('line')
        .attr('class', 'uline')
        .attr('id', function (d: any) {
          return d.id;
        })
        .attr('x1', function (d: any) {
          return d.start.x * tree_width;
        })
        .attr('y1', function (d: any) {
          return d.start.y * tree_height;
        })
        .attr('x2', function (d: any) {
          return d.end.x * tree_width;
        })
        .attr('y2', function (d: any) {
          return d.end.y * tree_height;
        })
        .attr('stroke-width', function (d: any) {
          return d.width ? d.width : 0;
        })
        .attr('stroke', function () {
          return options.lines.colors.underlines;
        })
        .merge(ulines)
        .transition()
        .duration(transition_time)
        .attr('id', function (d: any) {
          return d.id;
        })
        .attr('x1', function (d: any) {
          return d.start.x * tree_width;
        })
        .attr('y1', function (d: any) {
          return d.start.y * tree_height;
        })
        .attr('x2', function (d: any) {
          return d.end.x * tree_width;
        })
        .attr('y2', function (d: any) {
          return d.end.y * tree_height;
        })
        .attr('stroke-width', (d: any) => {
          return d.width ? d.width : 0;
        });

      const nodes = canvas.selectAll('.node').data(point_circles);

      nodes.exit().remove();

      nodes
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('cx', function (d: any) {
          return d.pos.x * tree_width;
        })
        .attr('cy', function (d: any) {
          return d.pos.y * tree_height;
        })
        .attr('r', function () {
          return radius;
        })
        .attr('stroke', function (d: any) {
          return d.color_pct != undefined
            ? colorShade(getHexColor(options.nodes.colors[d.player]), d.color_pct)
            : options.nodes.colors.neutral;
        })
        .attr('fill', function (d: any) {
          return d.color_pct != undefined
            ? colorShade(getHexColor(options.nodes.colors[d.player]), d.color_pct)
            : options.nodes.colors.neutral;
        })
        .on('mousemove', function (d: any, i: number) {
          if (events.score.mousemove) events.score.mousemove(d, i);
        })
        .on('mouseout', function (d: any, i: number) {
          if (events.node.mouseout) events.node.mouseout(d, i);
        })
        .on('click', function (d: any, i: number) {
          if (events.node.click) events.node.click(d, i);
        })
        .merge(nodes)
        .transition()
        .duration(transition_time)
        .attr('cx', function (d: any) {
          return d.pos.x * tree_width;
        })
        .attr('cy', function (d: any) {
          return d.pos.y * tree_height;
        })
        .attr('r', function () {
          return radius;
        });

      // Bounce animation on the active node
      if (activeNodeName) {
        const activePosKey = 'p' + activeNodeName;
        canvas
          .selectAll('.node')
          .filter(function (d: any) {
            // Match by position object reference
            return d.pos === pos[activePosKey];
          })
          .transition()
          .duration(200)
          .attr('r', radius * 1.8)
          .transition()
          .duration(300)
          .attr('r', radius);
      }

      const scores = canvas.selectAll('.score').data(point_text);

      scores.exit().remove();

      scores
        .enter()
        .append('text')
        .attr('class', 'score')
        .attr('x', (d: any) => {
          return d.pos.x * tree_width;
        })
        .attr('y', (d: any) => {
          return d.pos.y * tree_height;
        })
        .attr('font-size', (d: any) => {
          return radius * d.fontsize + 'px';
        })
        .attr('font-family', 'Lato, Arial, sans-serif')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('stroke', (d: any) => {
          return d.stroke;
        })
        .attr('fill', (d: any) => {
          return d.fill;
        })
        .text((d: any) => {
          if (radius * d.fontsize > 7) return d.text;
        })
        .on('mousemove', function (d, i) {
          if (events.score.mousemove) events.score.mousemove(d, i);
        })
        .on('mouseout', function (d, i) {
          if (events.score.mouseout) events.score.mouseout(d, i);
        })
        .on('click', function (d, i) {
          if (events.score.click) events.score.click(d, i);
        })
        .merge(scores)
        .transition()
        .duration(transition_time)
        .attr('x', (d: any) => {
          return d.pos.x * tree_width;
        })
        .attr('y', (d: any) => {
          return d.pos.y * tree_height;
        })
        .attr('font-size', (d: any) => {
          return radius * d.fontsize + 'px';
        })
        .text((d: any) => {
          if (radius * d.fontsize > 5) return d.text;
        });

      const labels = canvas.selectAll('.gt_label').data(label_text);

      labels.exit().remove();

      labels
        .enter()
        .append('text')
        .attr('class', 'gt_label')
        .attr('x', (d: any) => {
          return d.pos.x * tree_width;
        })
        .attr('y', (d: any) => {
          return d.pos.y * tree_height;
        })
        .attr('alignment-baseline', (d: any) => {
          return d.baseline ? d.baseline : undefined;
        })
        .attr('font-size', (d: any) => {
          return radius * d.fontsize + 'px';
        })
        .attr('text-anchor', (d: any) => {
          return d.anchor ? d.anchor : undefined;
        })
        .attr('font-family', 'Lato, Arial, sans-serif')
        .attr('stroke', (d: any) => {
          return d.stroke;
        })
        .attr('fill', (d: any) => {
          return d.fill;
        })
        .text((d: any) => {
          if (radius * d.fontsize > 5) return d.id;
        })
        .attr('selector', (d: any) => {
          return d.id;
        })
        .on('click', function (event: any, d: any) {
          if (events.label.click) events.label.click(event, d, this);
        })
        .merge(labels)
        .transition()
        .duration(transition_time)
        .attr('x', (d: any) => {
          return d.pos.x * tree_width;
        })
        .attr('y', (d: any) => {
          return d.pos.y * tree_height;
        })
        .attr('font-size', (d: any) => {
          return radius * d.fontsize + 'px';
        })
        .text((d: any) => {
          if (radius * d.fontsize > 5) return options.labels[d.id];
        });

      const select = canvas.selectAll('.selector').data(selectors);

      select.exit();

      select
        .enter()
        .append('circle')
        .attr('class', 'selector')
        .attr('status', function (d: any) {
          return d.status;
        })
        .attr('id', function (d: any) {
          return d.id;
        })
        .attr('selector', function (d: any) {
          return d.id;
        })
        .attr('cx', function (d: any) {
          return d.pos.x * tree_width;
        })
        .attr('cy', function (d: any) {
          return d.pos.y * tree_height + 4;
        })
        .attr('r', function (d: any) {
          return radius * d.r_pct;
        })
        .attr('stroke', function (_, i: number) {
          return options.nodes.colors[i];
        })
        .attr('stroke-width', function () {
          return radius * 0.25;
        })
        .attr('fill', function (_, i: number) {
          return !options.selectors.enabled || (options.selectors.enabled && options.selectors.selected[i])
            ? options.nodes.colors[i]
            : options.nodes.colors.neutral;
        })
        .attr('opacity', function (d: any) {
          return d.opacity;
        })
        .on('mousemove', function (event: any, d: any) {
          if (events.selector.mousemove) events.selector.mousemove(event, d);
        })
        .on('mouseout', function (event: any, d: any) {
          if (events.selector.mouseout) events.selector.mouseout(event, d);
        })
        .on('click', function (event: any, d: any) {
          if (events.selector.click) events.selector.click(event, d, this);
        })
        .merge(select)
        .transition()
        .duration(transition_time)
        .attr('cx', function (d: any) {
          return d.pos.x * tree_width;
        })
        .attr('cy', function (d: any) {
          return d.pos.y * tree_height + 4;
        })
        .attr('r', function (d: any) {
          return radius * d.r_pct;
        })
        .attr('stroke-width', function () {
          return radius * 0.25;
        })
        .attr('fill', function (_, i: number) {
          return !options.selectors.enabled || (options.selectors.enabled && options.selectors.selected[i])
            ? options.nodes.colors[i]
            : options.nodes.colors.neutral;
        });

      if (options.display.rightImg) {
        images.right = canvas.selectAll('image.rightImage').data([0]);

        images.right.exit().remove();

        images.right
          .enter()
          .append('image')
          .attr('class', 'rightImage')
          .attr('xlink:href', options.display.rightImg)
          .attr('x', options.width - (options.margins.right + 30))
          .attr('y', 5)
          .attr('height', '20px')
          .attr('width', '20px')
          .attr('opacity', options.display.show_images ? 1 : 0)
          .on('click', function () {
            if (events.rightImage.click) events.rightImage.click(options.id);
          })
          .merge(images.right)
          .attr('x', options.width - (options.margins.right + 30))
          .attr('xlink:href', options.display.rightImg)
          .on('click', function () {
            if (events.rightImage.click) events.rightImage.click(options.id);
          });
      } else {
        root.selectAll('image.rightImage').remove();
      }

      if (options.display.leftImg) {
        images.left = canvas.selectAll('image.leftImage').data([0]);

        images.left
          .enter()
          .append('image')
          .attr('class', 'leftImage')
          .attr('xlink:href', options.display.leftImg)
          .attr('x', 10 + options.margins.left)
          .attr('y', 5)
          .attr('height', '20px')
          .attr('width', '20px')
          .attr('opacity', options.display.show_images ? 1 : 0)
          .on('click', function () {
            if (events.leftImage.click) events.leftImage.click();
          })
          .merge(images.left)
          .attr('x', 10 + options.margins.left)
          .attr('xlink:href', options.display.leftImg)
          .on('click', function () {
            if (events.leftImage.click) events.leftImage.click(options.id);
          });

        images.left.exit().remove();
      } else {
        root.selectAll('image.leftImage').remove();
      }

      /*
      function showImages() {
        if (options.display.show_images == false) return;
        if (options.display.leftImg) images.left.attr('opacity', 1);
        if (options.display.rightImg) images.right.attr('opacity', 1);
      }

      function hideImages() {
        if (options.display.show_images) return;
        if (options.display.leftImg) images.left.attr('opacity', 0);
        if (options.display.rightImg) images.right.attr('opacity', 0);
      }
      */
    };
  }

  // ACCESSORS

  chart.exports = function () {
    return { selectView: selectView };
  };

  // allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function (values) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    return chart;
  };

  function keyWalk(valuesObject, optionsObject) {
    if (!valuesObject || !optionsObject) return;
    const vKeys = Object.keys(valuesObject);
    const oKeys = Object.keys(optionsObject);
    for (let k = 0; k < vKeys.length; k++) {
      if (oKeys.indexOf(vKeys[k]) >= 0) {
        const oo = optionsObject[vKeys[k]];
        const vo = valuesObject[vKeys[k]];
        if (typeof oo == 'object' && typeof vo !== 'function' && oo && oo.constructor !== Array) {
          keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
        } else {
          optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
        }
      }
    }
  }

  chart.events = function (functions) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
    return chart;
  };

  chart.reset = function () {
    data = [];
    clearView();
    counters = { w: {}, e: {}, p: {}, n: {} };
    return chart;
  };

  chart.width = function (value: any) {
    if (!arguments.length) return options.width;
    options.width = value;
    return chart;
  };

  chart.height = function (value: any) {
    if (!arguments.length) return options.height;
    options.height = value;
    return chart;
  };

  chart.data = function (values: any) {
    if (!arguments.length) return data;

    if (values.constructor === Array) {
      chart.reset();
      data = values;
    }
    return chart;
  };

  chart.players = function (names: [string, string]) {
    options.labels.Player = names[0];
    options.labels.Opponent = names[1];
    return chart;
  };

  chart.matchUp = function (matchUpState: any, names?: [string, string]) {
    if (names) chart.players(names);
    const episodes = buildEpisodes(matchUpState);
    chart.data(episodes);
    return chart;
  };

  chart.counters = function () {
    counterCalcs();
    return counters;
  };

  chart.update = function (opts?: any) {
    if (events.update.begin) events.update.begin();
    if (typeof update === 'function') update(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, transition_time);
  };

  // REUSABLE FUNCTIONS
  // ------------------

  function counterCalcs() {
    let _data;
    // w = winners, e = errors, p = points, n = nodes
    counters = { w: {}, e: {}, p: {}, n: {} };

    if (options.selectors.selected[0] || options.selectors.selected[1]) {
      const selected = options.selectors.selected[0] ? 0 : 1;
      _data = data.filter(function (f) {
        return f.point.server == selected;
      });
    } else {
      _data = data;
    }
    _data = _data.filter(function (f) {
      return !f.point.tiebreak;
    });

    for (let d = 0; d < _data.length; d++) {
      const previous_episode = _data[d - 1];
      const previous =
        d == 0 || previous_episode.game.complete ? calcPosition([0, 0]) : calcPosition(previous_episode.point.points);
      const progression = 'L' + previous + point_connector + calcPosition(_data[d].point.points);
      if (options.points.highlight.length && !options.points.highlight.includes(d)) {
        continue;
      }
      counters.p[progression] = counters.p[progression] ? counters.p[progression] + 1 : 1;

      if (options.points.winners.includes(_data[d].point.result)) {
        counters.w[progression] = counters.w[progression] ? counters.w[progression] + 1 : 1;
      } else if (options.points.errors.includes(_data[d].point.result)) {
        counters.e[progression] = counters.e[progression] ? counters.e[progression] + 1 : 1;
      }
    }

    // Determine the active node (last point's position)
    if (_data.length > 0) {
      const lastEp = _data[_data.length - 1];
      if (lastEp.game.complete) {
        activeNodeName = null; // game just completed, no active position
      } else {
        activeNodeName = calcPosition(lastEp.point.points);
      }
    } else {
      activeNodeName = null;
    }

    // make adjustment for multiple dueces
    function calcPosition(points) {
      const point_min = Math.min(...points);
      const diff = point_min >= 4 ? point_min - 3 : 0;
      const pos = points.map((point, index) =>
        options.display.noAd && point == 4 && points[1 - index] == 3 ? 'G' : point - diff,
      );
      return pos.join('-');
    }
  }

  function clearView() {
    select('[id=Player]').attr('opacity', 0.4).attr('status', 'none').attr('fill', options.nodes.colors.neutral);
    select('[id=Opponent]').attr('opacity', 0.4).attr('status', 'none').attr('fill', options.nodes.colors.neutral);
    options.selectors.selected[1] = false;
    options.selectors.selected[0] = false;
  }

  function selectView(_event: any, _datum: any, self: any) {
    if (!options.selectors.enabled) return;
    const selector = select(self).attr('selector');
    const isOpponent = selector === 'Opponent';
    const playerIdx = isOpponent ? 1 : 0;

    if (select('[id=' + selector + ']').attr('status') == 'none') {
      if (isOpponent) {
        select('[id=Player]').attr('opacity', 0.4).attr('status', 'none').attr('fill', options.nodes.colors.neutral);
        select('[id=Opponent]').attr('opacity', 1).attr('status', 'selected').attr('fill', options.nodes.colors[playerIdx]);
        options.selectors.selected[1] = true;
        options.selectors.selected[0] = false;
      } else {
        select('[id=Opponent]').attr('opacity', 0.4).attr('status', 'none').attr('fill', options.nodes.colors.neutral);
        select('[id=Player]').attr('opacity', 1).attr('status', 'selected').attr('fill', options.nodes.colors[playerIdx]);
        options.selectors.selected[0] = true;
        options.selectors.selected[1] = false;
      }
    } else {
      select('[id=' + selector + ']')
        .attr('opacity', 0.4)
        .attr('status', 'none')
        .attr('fill', options.nodes.colors.neutral);
      if (isOpponent) {
        options.selectors.selected[1] = false;
      } else {
        options.selectors.selected[0] = false;
      }
    }
    update();
  }

  function calcStops(d: any) {
    if (!counters.p[d.id]) return [];
    const total_points = counters.p[d.id] == undefined ? 1 : counters.p[d.id];
    const winners = counters.w[d.id] ? counters.w[d.id] : 0;
    const errors = counters.e[d.id] ? counters.e[d.id] : 0;
    const winner_pct = (winners / total_points) * 100;
    // const error_pct = (errors / total_points) * 100;
    const u_pct = ((total_points - (winners + errors)) / total_points) * 100;
    return [
      { offset: '0%', color: options.lines.points.unknown },
      { offset: u_pct + '%', color: options.lines.points.unknown },
      { offset: u_pct + '%', color: options.lines.points.winners },
      { offset: u_pct + winner_pct + '%', color: options.lines.points.winners },
      { offset: u_pct + winner_pct + '%', color: options.lines.points.errors },
      { offset: '100%', color: options.lines.points.errors },
    ];
  }

  // DATA
  // --------------

  const c_start = 0.07;
  const c_dist = 0.14;

  const r_start = 0.05;
  const r_dist = 0.21;

  const f = {
    col1: c_start,
    col2: c_start + c_dist,
    col3: c_start + 2 * c_dist,
    col4: c_start + 3 * c_dist,
    col5: c_start + 4 * c_dist,
    col6: c_start + 5 * c_dist,
    col7: c_start + 6 * c_dist,

    row1: r_start,
    row2: r_start + r_dist,
    row3: r_start + 2 * r_dist,
    row4: r_start + 3 * r_dist,
    row5: r_start + 4 * r_dist,
    foot: r_start + 4.1 * r_dist,

    adr1: r_start + 3.5 * r_dist,
    adc1: c_start + c_dist * 2.5,
    adc2: c_start + c_dist * 3.5,

    selc: c_start * 0.8,
    tslc: c_start,
    sl1r: r_start / 2,
    sl2r: r_start * 1.5,
    plr1: c_start * 0.8,
    plr2: c_start + 4 * c_dist,
    plrs: r_start + 4.25 * r_dist,
  };

  const pos = {
    'p0-0': { x: f.col4, y: f.row1 },
    'p1-1': { x: f.col4, y: f.row2 },
    'p2-2': { x: f.col4, y: f.row3 },
    'p3-3': { x: f.col4, y: f.row4 },
    'p1-0': { x: f.col3, y: f.row2 },
    'p0-1': { x: f.col5, y: f.row2 },
    'p2-1': { x: f.col3, y: f.row3 },
    'p1-2': { x: f.col5, y: f.row3 },
    'p2-0': { x: f.col2, y: f.row3 },
    'p0-2': { x: f.col6, y: f.row3 },
    'p3-2': { x: f.col3, y: f.row4 },
    'p2-3': { x: f.col5, y: f.row4 },
    'p3-1': { x: f.col2, y: f.row4 },
    'p1-3': { x: f.col6, y: f.row4 },
    'p3-0': { x: f.col1, y: f.row4 },
    'p0-3': { x: f.col7, y: f.row4 },
    'p3-4': { x: f.adc1, y: f.adr1 },
    'p4-3': { x: f.adc2, y: f.adr1 },
    'p5-3': { x: f.adc2, y: f.row5 },
    'p3-5': { x: f.adc1, y: f.row5 },
    'p4-1': { x: f.col2, y: f.row5 },
    'p1-4': { x: f.col6, y: f.row5 },
    'p4-2': { x: f.col3, y: f.row5 },
    'p2-4': { x: f.col5, y: f.row5 },
    'p4-0': { x: f.col1, y: f.row5 },
    'p0-4': { x: f.col7, y: f.row5 },

    // No Ad
    'pG-3': { x: f.col4, y: f.row5 },
    'p3-G': { x: f.col4, y: f.row5 },

    sPlyr: { x: f.adc1, y: f.plrs },
    tPlyr: { x: f.col2, y: f.plrs },
    sOpp: { x: f.adc2, y: f.plrs },
    tOpp: { x: f.col6, y: f.plrs },

    GAME: { x: f.col4, y: f.foot },
    L1s: { x: f.col1, y: f.foot },
    L1e: { x: f.adc1, y: f.foot },
    L2s: { x: f.adc2, y: f.foot },
    L2e: { x: f.col7, y: f.foot },
  };

  const point_circles = [
    { name: '0-0', pos: pos['p0-0'], player: 0 },
    { name: '15-15', pos: pos['p1-1'], player: 0 },
    { name: '30-30', pos: pos['p2-2'], player: 0 },
    { name: '40-40', pos: pos['p3-3'], player: 0 },

    { name: '0-15', pos: pos['p0-1'], color_pct: 0.4, player: 1 },
    { name: '15-30', pos: pos['p1-2'], color_pct: 0.4, player: 1 },
    { name: '0-30', pos: pos['p0-2'], color_pct: 0.2, player: 1 },
    { name: '30-40', pos: pos['p2-3'], color_pct: 0.4, player: 1 },
    { name: '15-40', pos: pos['p1-3'], color_pct: 0.2, player: 1 },
    { name: '0-40', pos: pos['p0-3'], color_pct: 0, player: 1 },
    { name: '40-A', pos: pos['p4-3'], color_pct: 0.5, player: 1 },

    { name: '15-0', pos: pos['p1-0'], color_pct: 0.4, player: 0 },
    { name: '30-15', pos: pos['p2-1'], color_pct: 0.4, player: 0 },
    { name: '30-0', pos: pos['p2-0'], color_pct: 0.2, player: 0 },
    { name: '40-30', pos: pos['p3-2'], color_pct: 0.4, player: 0 },
    { name: '40-15', pos: pos['p3-1'], color_pct: 0.2, player: 0 },
    { name: '40-0', pos: pos['p3-0'], color_pct: 0, player: 0 },
    { name: 'A-40', pos: pos['p3-4'], color_pct: 0.5, player: 0 },
  ];

  const point_lines = [
    { id: 'L0-0x0-1', start: pos['p0-0'], end: pos['p0-1'] },
    { id: 'L0-0x1-0', start: pos['p0-0'], end: pos['p1-0'] },
    { id: 'L0-1x0-2', start: pos['p0-1'], end: pos['p0-2'] },
    { id: 'L0-1x1-1', start: pos['p0-1'], end: pos['p1-1'] },
    { id: 'L1-0x2-0', start: pos['p1-0'], end: pos['p2-0'] },
    { id: 'L1-0x1-1', start: pos['p1-0'], end: pos['p1-1'] },
    { id: 'L1-1x1-2', start: pos['p1-1'], end: pos['p1-2'] },
    { id: 'L1-1x2-1', start: pos['p1-1'], end: pos['p2-1'] },
    { id: 'L2-0x2-1', start: pos['p2-0'], end: pos['p2-1'] },
    { id: 'L2-0x3-0', start: pos['p2-0'], end: pos['p3-0'] },
    { id: 'L2-1x2-2', start: pos['p2-1'], end: pos['p2-2'] },
    { id: 'L2-1x3-1', start: pos['p2-1'], end: pos['p3-1'] },
    { id: 'L2-2x2-3', start: pos['p2-2'], end: pos['p2-3'] },
    { id: 'L2-2x3-2', start: pos['p2-2'], end: pos['p3-2'] },
    { id: 'L0-2x0-3', start: pos['p0-2'], end: pos['p0-3'] },
    { id: 'L0-2x1-2', start: pos['p0-2'], end: pos['p1-2'] },
    { id: 'L0-3x0-4', start: pos['p0-3'], end: pos['p0-4'] },
    { id: 'L0-3x1-3', start: pos['p0-3'], end: pos['p1-3'] },
    { id: 'L1-2x2-2', start: pos['p1-2'], end: pos['p2-2'] },
    { id: 'L1-2x1-3', start: pos['p1-2'], end: pos['p1-3'] },
    { id: 'L1-3x2-3', start: pos['p1-3'], end: pos['p2-3'] },
    { id: 'L1-3x1-4', start: pos['p1-3'], end: pos['p1-4'] },
    { id: 'L2-3x3-3', start: pos['p2-3'], end: pos['p3-3'] },
    { id: 'L2-3x2-4', start: pos['p2-3'], end: pos['p2-4'] },
    { id: 'L3-3x3-4', start: pos['p3-3'], end: pos['p4-3'] },
    { id: 'L3-3x4-3', start: pos['p3-3'], end: pos['p3-4'] },
    { id: 'L3-2x3-3', start: pos['p3-2'], end: pos['p3-3'] },
    { id: 'L3-2x4-2', start: pos['p3-2'], end: pos['p4-2'] },
    { id: 'L3-1x3-2', start: pos['p3-1'], end: pos['p3-2'] },
    { id: 'L3-1x4-1', start: pos['p3-1'], end: pos['p4-1'] },
    { id: 'L3-0x3-1', start: pos['p3-0'], end: pos['p3-1'] },
    { id: 'L3-0x4-0', start: pos['p3-0'], end: pos['p4-0'] },
    { id: 'L3-4x3-5', start: pos['p4-3'], end: pos['p5-3'] },
    { id: 'L4-3x5-3', start: pos['p3-4'], end: pos['p3-5'] },

    // no Ad
    { id: 'L3-3xG-3', start: pos['p3-3'], end: pos['pG-3'] },
    { id: 'L3-3x3-G', start: pos['p3-3'], end: pos['p3-G'] },
  ];

  const under_lines = [
    { stroke: 'blue', start: pos['L1s'], end: pos['L1e'], width: 2 },
    { stroke: 'blue', start: pos['L2s'], end: pos['L2e'], width: 2 },
  ];

  const point_text = [
    { pos: pos['p0-0'], fill: 'black', fontsize: 0.7, text: '0-0' },
    { pos: pos['p1-1'], fill: 'black', fontsize: 0.7, text: '15-15' },
    { pos: pos['p2-2'], fill: 'black', fontsize: 0.7, text: '30-30' },
    { pos: pos['p3-3'], fill: 'black', fontsize: 0.7, text: '40-40' },

    { pos: pos['p0-1'], fill: 'white', fontsize: 0.7, text: '0-15' },
    { pos: pos['p1-2'], fill: 'white', fontsize: 0.7, text: '15-30' },
    { pos: pos['p0-2'], fill: 'white', fontsize: 0.7, text: '0-30' },
    { pos: pos['p2-3'], fill: 'white', fontsize: 0.7, text: '30-40' },
    { pos: pos['p1-3'], fill: 'white', fontsize: 0.7, text: '15-40' },
    { pos: pos['p0-3'], fill: 'white', fontsize: 0.7, text: '0-40' },
    { pos: pos['p4-3'], fill: 'white', fontsize: 0.7, text: '40-A' },

    { pos: pos['p1-0'], fill: 'white', fontsize: 0.7, text: '15-0' },
    { pos: pos['p2-1'], fill: 'white', fontsize: 0.7, text: '30-15' },
    { pos: pos['p2-0'], fill: 'white', fontsize: 0.7, text: '30-0' },
    { pos: pos['p3-2'], fill: 'white', fontsize: 0.7, text: '40-30' },
    { pos: pos['p3-1'], fill: 'white', fontsize: 0.7, text: '40-15' },
    { pos: pos['p3-0'], fill: 'white', fontsize: 0.7, text: '40-0' },
    { pos: pos['p3-4'], fill: 'white', fontsize: 0.7, text: 'A-40' },
  ];

  const label_text = [
    { pos: pos['tPlyr'], fill: 'black', fontsize: 0.9, id: 'Player', anchor: 'middle', baseline: 'hanging' },
    { pos: pos['tOpp'], fill: 'black', fontsize: 0.9, id: 'Opponent', anchor: 'middle', baseline: 'hanging' },
    { pos: pos['GAME'], fill: '#555555', fontsize: 0.9, id: 'Game', anchor: 'middle', baseline: 'central' },
  ];

  const selectors = [
    { id: 'Player', pos: pos['sPlyr'], r_pct: 0.4, opacity: 1, status: 'none' },
    { id: 'Opponent', pos: pos['sOpp'], r_pct: 0.4, opacity: 0.4, status: 'none' },
  ];

  return chart;
}
