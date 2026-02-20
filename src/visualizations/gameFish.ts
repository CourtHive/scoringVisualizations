import { select, scaleLinear, scaleBand, range } from "d3";
import { extractGamePoints } from "../engine/feedMatchUp";
import { keyWalk } from "./utils/keyWalk";
import { generateId } from "./utils/generateId";

export function gameFish() {
  let data: any;
  let fishWidth;
  let fishHeight;
  let coords = [0, 0];
  let lastCoords: any;
  let update: any;
  const images: any = { left: undefined, right: undefined };

  const options: any = {
    id: generateId(),
    score: [0, 0],
    width: 600,
    height: 600,
    margins: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    fish: {
      school: false,
      gridcells: ["0", "15", "30", "40", "G"],
      maxRally: undefined,
      cellSize: undefined,
      minCellSize: 5,
      maxCellSize: 20,
    },
    set: {
      tiebreakTo: 7,
    },
    display: {
      orientation: "vertical",
      transitionTime: 0,
      sizeToFit: false,
      leftImg: false,
      rightImg: false,
      showImages: undefined,
      reverse: false,
      pointScore: true,
      service: true,
      player: true,
      rally: true,
      score: true,
      grid: true,
    },
    colors: {
      players: { 0: "red", 1: "black" },
      results: {
        Out: "red",
        Net: "coral",
        "Unforced Error": "red",
        Forced: "orange",
        Ace: "lightgreen",
        "Serve Winner": "lightgreen",
        Winner: "lightgreen",
        "Forced Volley Error": "orange",
        "Forced Error": "orange",
        In: "yellow",
        "Passing Shot": "lightgreen",
        "Out Passing Shot": "red",
        "Net Cord": "yellow",
        "Out Wide": "red",
        "Out Long": "red",
        "Double Fault": "red",
        Unknown: "blue",
        Error: "red",
      },
    },
  };

  const STROKE_WIDTH = "stroke-width";
  const FILL_OPACITY = "fill-opacity";
  const default_colors = { default: "#235dba" };
  let colors = structuredClone(default_colors);

  const events: any = {
    leftImage: { click: null },
    rightImage: { click: null },
    update: { begin: null, end: null },
    point: { mouseover: null, mouseout: null, click: null },
  };

  let fishFrame: any;
  let root: any;
  let bars: any;
  let fish: any;
  let game: any;

  function findOffset(point: any) {
    // In school mode (momentum chart), use cumulative set points for nose-to-tail alignment.
    // In standalone mode, use game-level points so the grid stays centered.
    const pts =
      (options.fish.school && point.setCumulativePoints) || point.points;
    if (!pts || pts.length < 2) return 0;
    return (
      pts[options.display.reverse ? 0 : 1] -
      pts[options.display.reverse ? 1 : 0]
    );
  }

  function chart(selection: any) {
    const parentType = selection._groups[0][0].tagName.toLowerCase();

    if (parentType !== "svg") {
      root = selection.append("div").attr("class", "fishRoot");

      fishFrame = root
        .append("svg")
        .attr("id", "gameFish" + options.id)
        .attr("class", "fishFrame");

      bars = fishFrame.append("g");
      fish = fishFrame.append("g");
      game = fishFrame.append("g");
    }

    update = function (opts: any) {
      if (bars === undefined || fish === undefined || game === undefined)
        return;

      if (options.display.sizeToFit || opts?.sizeToFit) {
        const dims = selection.node().getBoundingClientRect();
        options.width = Math.max(dims.width, 100);
        options.height = Math.max(dims.height, 100);
      }

      if (options.fish.cellSize && !options.fish.school) {
        const multiplier = Math.max(10, data.length + 2);
        options.height = options.fish.cellSize * multiplier * 0.9;
      }

      let tiebreak = false;
      let maxRally = 0;
      data.forEach((e: any) => {
        const rlen = e.rallyLength;
        if (rlen > maxRally) maxRally = rlen;
        if (e.score && e.score.indexOf("T") > 0) tiebreak = true;
      });

      if (options.fish.maxRally && options.fish.maxRally > maxRally)
        maxRally = options.fish.maxRally;

      fishWidth =
        options.width - (options.margins.left + options.margins.right);
      fishHeight =
        options.height - (options.margins.top + options.margins.bottom);

      // Ensure dimensions are valid
      if (Number.isNaN(fishWidth) || fishWidth <= 0) fishWidth = 100;
      if (Number.isNaN(fishHeight) || fishHeight <= 0) fishHeight = 100;

      const vert = options.display.orientation === "vertical" ? 1 : 0;
      const fish_offset = vert ? fishWidth : fishHeight;
      const fish_length = vert ? fishHeight : fishWidth;
      const midpoint =
        (vert ? options.margins.left : options.margins.top) + fish_offset / 2;
      const sw = 1; // service box % offset
      const rw = 0.9; // rally_width % offset

      bars.attr(
        "transform",
        translate(vert ? 0 : coords[0], vert ? coords[1] : 0, 0),
      );
      fish.attr("transform", translate(coords[0], coords[1], 0));
      game.attr("transform", translate(coords[0], coords[1], 0));

      let cellSize;
      if (options.fish.cellSize) {
        cellSize = options.fish.cellSize;
      } else {
        const offset_divisor = tiebreak
          ? options.set.tiebreakTo + 4
          : options.fish.gridcells.length + 2;
        const cell_offset =
          fish_offset /
          (options.fish.gridcells.length +
            (options.display.service ? offset_divisor : 0));
        const cell_length = fish_length / (data.length + 2);
        cellSize = Math.min(cell_offset, cell_length);
        cellSize = Math.max(options.fish.minCellSize, cellSize);
        cellSize = Math.min(options.fish.maxCellSize, cellSize);
      }

      // Ensure cellSize is valid
      if (!cellSize || Number.isNaN(cellSize) || cellSize <= 0) {
        cellSize = options.fish.minCellSize || 5;
      }

      const diag = Math.sqrt(2 * Math.pow(cellSize, 2));
      const radius = diag / 2;

      // In school mode (momentum chart), compute the lateral offset for the grid
      // so it aligns with the fish body's starting position.
      // gridBaseOffset = cumulative set differential BEFORE the first point of this game.
      let gridBaseOffset = 0;
      if (data.length > 0 && options.fish.school) {
        const firstPt = data[0];
        const cumPts = firstPt.setCumulativePoints;
        const gamePts = firstPt.points;
        if (cumPts && gamePts) {
          const rev = options.display.reverse;
          const cumDiff = cumPts[rev ? 0 : 1] - cumPts[rev ? 1 : 0];
          const gameDiff = gamePts[rev ? 0 : 1] - gamePts[rev ? 1 : 0];
          gridBaseOffset = cumDiff - gameDiff;
        }
      }

      const grid_data = [];
      const grid_labels = [];
      const grid_side = tiebreak
        ? options.set.tiebreakTo
        : options.fish.gridcells.length - 1;
      for (let g = 0; g < grid_side; g++) {
        const label = tiebreak ? g : options.fish.gridcells[g];
        // l = length, o = offset
        grid_labels.push({
          label: label,
          l: (g + (vert ? 1.25 : 0.75)) * radius,
          o: (g + (vert ? 0.75 : 1.25)) * radius,
          rotate: 45,
        });
        grid_labels.push({
          label: label,
          l: (g + 1.25) * radius,
          o: -1 * (g + 0.75) * radius,
          rotate: -45,
        });
        for (let c = 0; c < grid_side; c++) {
          grid_data.push([g, c]);
        }
      }

      // check if this is a standalone SVG or part of larger SVG
      if (root) {
        root
          .attr("width", options.width + "px")
          .attr("height", options.height + "px");

        fishFrame
          .attr("width", options.width + "px")
          .attr("height", options.height + "px");
      }

      if (options.display.pointScore) {
        fish
          .selectAll(".game_score" + options.id)
          .data(grid_labels)
          .join("text")
          .attr("class", "game_score" + options.id)
          .attr("font-size", radius * 0.8 + "px")
          .attr("transform", gscoreT)
          .attr("text-anchor", "middle")
          .text(function (d: any) {
            return d.label;
          });
      } else {
        fish.selectAll(".game_score" + options.id).remove();
      }

      if (options.display.grid) {
        fish
          .selectAll(".gridcell" + options.id)
          .data(grid_data)
          .join("rect")
          .attr("class", "gridcell" + options.id)
          .attr("stroke", "#ccccdd")
          .attr(STROKE_WIDTH, lineWidth)
          .attr("transform", gridCT)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr(FILL_OPACITY, 0);
      } else {
        fish.selectAll(".gridcell" + options.id).remove();
      }

      game
        .selectAll(".gamecell" + options.id)
        .data(data)
        .join("rect")
        .attr("id", (d: any, i: number) => {
          return options.id + "Gs" + d.set + "g" + d.game + "p" + i;
        })
        .attr("class", "gamecell" + options.id)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("transform", gameCT)
        .attr("stroke", "#ccccdd")
        .attr(STROKE_WIDTH, lineWidth)
        .attr("opacity", options.display.player ? 1 : 0)
        .style("fill", function (d: any) {
          return options.colors.players[d.winner];
        });

      game
        .selectAll(".result" + options.id)
        .data(data)
        .join("circle")
        .attr("id", function (d: any, i: number) {
          return options.id + "Rs" + d.set + "g" + d.game + "p" + i;
        })
        .attr("class", "result" + options.id)
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr(STROKE_WIDTH, lineWidth)
        .attr("cx", zX)
        .attr("cy", zY)
        .attr("r", circleRadius)
        .style("fill", function (d: any) {
          return options.colors.results[d.result];
        });

      // offset Scale
      const oScale = scaleLinear()
        .range([0, fish_offset * rw])
        .domain([0, maxRally]);

      // lengthScale
      const lScale = scaleBand()
        .domain(range(data.length).map(String))
        .range([0, data.length * radius])
        .round(true);

      if (options.display.rally) {
        bars
          .selectAll(".rally_bar" + options.id)
          .data(data)
          .join((enter: any) =>
            enter
              .append("rect")
              .on("mouseover", function (this: SVGRectElement, event: any, d: any) {
                select(this).attr("fill", "yellow");
                if (events.point.mouseover) events.point.mouseover(d, event);
              })
              .on("mouseout", function (this: SVGRectElement, event: any, d: any) {
                select(this).attr("fill", "#eeeeff");
                if (events.point.mouseout) events.point.mouseout(d, event);
              })
              .on("click", function (event: any, d: any) {
                if (events.point.click) events.point.click(d, event);
              }),
          )
          .attr("class", "rally_bar" + options.id)
          .attr("id", function (d: any, i: number) {
            return options.id + "Bs" + d.set + "g" + d.game + "p" + i;
          })
          .attr("opacity", 1)
          .attr("stroke", "white")
          .attr(STROKE_WIDTH, lineWidth)
          .attr("fill", "#eeeeff")
          .attr("transform", rallyT)
          .attr("height", vert ? lScale.bandwidth() : rallyCalc)
          .attr("width", vert ? rallyCalc : lScale.bandwidth());
      } else {
        bars.selectAll(".rally_bar" + options.id).remove();
      }

      if (options.display.score) {
        const score = options.score.slice();
        if (options.display.reverse) score.reverse();
        bars
          .selectAll(".set_score" + options.id)
          .data(score)
          .join("text")
          .attr("class", "set_score" + options.id)
          .attr("transform", sscoreT)
          .attr("font-size", radius * 0.8 + "px")
          .attr("text-anchor", "middle")
          .text(function (d: any) {
            return d;
          });

        bars
          .selectAll(".ssb" + options.id)
          .data(options.score)
          .join("rect")
          .attr("class", "ssb" + options.id)
          .attr("transform", ssbT)
          .attr("stroke", "black")
          .attr(STROKE_WIDTH, lineWidth)
          .attr(FILL_OPACITY, 0)
          .attr("height", radius + "px")
          .attr("width", radius + "px");
      } else {
        bars.selectAll(".set_score" + options.id).remove();
        bars.selectAll(".ssb" + options.id).remove();
      }

      if (options.display.service) {
        const serves: any = [];
        data.forEach(function (s: any, i: number) {
          let first_serve = false;
          const serve_outcomes = ["Ace", "Serve Winner", "Double Fault"];
          if (s.first_serve) {
            first_serve = true;
            serves.push({
              point: i,
              serve: "first",
              server: s.server,
              result: s.first_serve.error,
            });
          }

          serves.push({
            point: i,
            serve: first_serve ? "second" : "first",
            server: s.server,
            result: serve_outcomes.includes(s.result) ? s.result : "In",
          });
        });

        bars
          .selectAll(".serve" + options.id)
          .data(serves)
          .join("circle")
          .attr("class", "serve" + options.id)
          .attr("cx", sX)
          .attr("cy", sY)
          .attr("r", circleRadius)
          .attr("stroke", colorShot)
          .attr(STROKE_WIDTH, lineWidth)
          .attr("fill", colorShot);

        bars
          .selectAll(".sbox" + options.id)
          .data(data)
          .join("rect")
          .attr("class", "sbox" + options.id)
          .attr("stroke", "#ccccdd")
          .attr(FILL_OPACITY, 0)
          .attr("transform", sBoxT)
          .attr(STROKE_WIDTH, lineWidth)
          .attr("height", vert ? lScale.bandwidth() : 1.5 * radius)
          .attr("width", vert ? 1.5 * radius : lScale.bandwidth());

        bars
          .selectAll(".return" + options.id)
          .data(data)
          .join("circle")
          .attr("class", "return" + options.id)
          .attr("cx", rX)
          .attr("cy", rY)
          .attr("r", circleRadius)
          .attr("stroke", colorReturn)
          .attr(STROKE_WIDTH, lineWidth)
          .attr("fill", colorReturn);
      } else {
        bars.selectAll(".sbox" + options.id).remove();
        bars.selectAll(".return" + options.id).remove();
        bars.selectAll(".serve" + options.id).remove();
      }

      if (options.display.rightImg) {
        images.right = fishFrame
          .selectAll("image.rightImage")
          .data([0])
          .join((enter: any) =>
            enter
              .append("image")
              .attr("class", "rightImage")
              .attr("y", 5)
              .attr("height", "20px")
              .attr("width", "20px")
              .attr("opacity", options.display.showImages ? 1 : 0)
              .on("click", function () {
                if (events.rightImage.click)
                  events.rightImage.click(options.id);
              }),
          )
          .attr("x", options.width - 30)
          .attr("xlink:href", options.display.rightImg);
      } else if (fishFrame) {
        fishFrame.selectAll("image.rightImage").remove();
      }

      if (options.display.leftImg) {
        images.left = fishFrame
          .selectAll("image.leftImage")
          .data([0])
          .join((enter: any) =>
            enter
              .append("image")
              .attr("class", "leftImage")
              .attr("x", 10)
              .attr("y", 5)
              .attr("height", "20px")
              .attr("width", "20px")
              .attr("opacity", options.display.showImages ? 1 : 0)
              .on("click", function () {
                if (events.leftImage.click)
                  events.leftImage.click(options.id);
              }),
          )
          .attr("xlink:href", options.display.leftImg);
      } else if (fishFrame) {
        fishFrame.selectAll("image.leftImage").remove();
      }

      // ancillary functions for update()
      function circleRadius() {
        return options.display.player || options.display.service
          ? radius / 3
          : radius / 2;
      }
      function lineWidth() {
        return radius > 20 ? 1.5 : 0.75;
      }
      function colorShot(d: any) {
        return options.colors.results[d.result];
      }
      function colorReturn(d: any) {
        const rlen = d.rallyLength;
        if (!rlen) return "white";
        if (rlen > 1) return "yellow";
        if (rlen === 1) return options.colors.results[d.result];
        return "white";
      }

      function rallyCalc(d: any) {
        const rlen = d.rallyLength;
        return rlen ? oScale(rlen) : 0;
      }

      function sscoreT(_: any, i: number) {
        let o = i ? midpoint + radius * 0.5 : midpoint - radius * 0.5;
        o = vert ? o : o + radius * 0.3;
        const l = radius * (vert ? 0.8 : 0.5);
        return translate(o, l, 0);
      }

      function ssbT(_: any, i: number) {
        const o = i ? midpoint : midpoint - radius;
        const l = 0;
        return translate(o, l, 0);
      }

      function gscoreT(d: any) {
        const o = +midpoint + d.o + gridBaseOffset * radius;
        const l = radius + d.l;
        return translate(o, l, d.rotate);
      }

      // for the momentum chart the midpoint needs to be adjusted
      function gridCT(d: any) {
        const o = midpoint + (d[1] - d[0] + vert - 1 + gridBaseOffset) * radius;
        const l = (d[0] + d[1] + 3 - vert) * radius;
        return translate(o, l, 45);
      }

      function gameCT(d: any, i: number) {
        const o = midpoint + (findOffset(d) + vert - 1) * radius;
        const l = (i + 4 - vert) * radius;
        lastCoords = [o - midpoint, l - diag, diag];
        return translate(o, l, 45);
      }

      function sBoxT(d: any, i: number) {
        const o =
          d.server === 0
            ? midpoint - (fish_offset / 2) * sw
            : midpoint + (fish_offset / 2) * sw - 1.5 * radius;
        const l = radius + cL(d, i);
        return translate(o, l, 0);
      }

      function _rallyTstart(d: any, i: number) {
        const o = midpoint;
        const l = radius + cL(d, i);
        return translate(o, l, 0);
      }

      function rallyT(d: any, i: number) {
        const o = d.rallyLength ? midpoint - oScale(d.rallyLength) / 2 : 0;
        const l = radius + cL(d, i);
        return translate(o, l, 0);
      }

      function translate(o: any, l: any, rotate: any) {
        const x = vert ? o : l;
        const y = vert ? l : o;
        return "translate(" + x + "," + y + ") rotate(" + rotate + ")";
      }

      function cL(_: any, i: number) {
        return (i + 2.5) * radius;
      }

      function rX(d: any, i: number) {
        return vert ? rO(d) : rL(d, i);
      }
      function rY(d: any, i: number) {
        return vert ? rL(d, i) : rO(d);
      }
      function rL(_: any, i: number) {
        return radius + (i + 3) * radius;
      }
      function rO(d: any) {
        return d.server === 0
          ? midpoint + (fish_offset / 2) * sw - 0.75 * radius
          : midpoint - (fish_offset / 2) * sw + 0.75 * radius;
      }

      function sX(d: any) {
        return vert ? sO(d) : sL(d);
      }
      function sY(d: any) {
        return vert ? sL(d) : sO(d);
      }
      function sL(d: any) {
        return radius + (d.point + 3) * radius;
      }
      function sO(d: any) {
        const offset =
          (d.serve === "first" && d.server === 0) ||
          (d.serve === "second" && d.server === 1)
            ? 0.4
            : 1.1;
        return d.server === 0
          ? midpoint - (fish_offset / 2) * sw + offset * radius
          : midpoint + (fish_offset / 2) * sw - offset * radius;
      }

      function zX(d: any, i: number) {
        return vert ? zO(d) : zL(d, i);
      }
      function zY(d: any, i: number) {
        return vert ? zL(d, i) : zO(d);
      }
      function zL(_: any, i: number) {
        return radius + (i + 3) * radius;
      }
      function zO(d: any) {
        return +midpoint + findOffset(d) * radius;
      }
    };
  }

  // ACCESSORS

  chart.g = function (values: any) {
    if (!arguments.length) return chart;
    if (typeof values != "object" || values.constructor === Array) return;
    if (values.bars) bars = values.bars;
    if (values.fish) fish = values.fish;
    if (values.game) game = values.game;
  };

  // allows updating individual options and suboptions
  // while preserving state of other options
  chart.options = function (values: any) {
    if (!arguments.length) return options;
    keyWalk(values, options);
    if (values.events) keyWalk(values.events, events);
    return chart;
  };

  chart.events = function (functions: any[]) {
    if (!arguments.length) return events;
    keyWalk(functions, events);
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

  chart.coords = function (value: any) {
    if (!arguments.length) return lastCoords;
    coords = value;
    return chart;
  };

  chart.data = function (value: any) {
    if (!arguments.length) return data;
    // gameFish receives GameGroup which contains points array
    // If value contains episodes that need normalization, handle it
    if (
      value?.points &&
      Array.isArray(value.points) &&
      value.points.length > 0
    ) {
      // This is a GameGroup - points might be UMO v4 Episodes
      // For gameFish, we just need the point data which is already extracted in groupGames
      data = structuredClone(value);
    } else {
      data = value;
    }
    return chart;
  };

  chart.matchUp = function (
    matchUpState: any,
    setIdx?: number,
    gameIdx?: number,
  ) {
    const points = extractGamePoints(matchUpState, setIdx ?? 0, gameIdx ?? 0);
    chart.data(points);
    return chart;
  };

  chart.update = function (opts: any) {
    if (events.update.begin) events.update.begin();
    if (typeof update === "function" && data) update(opts);
    setTimeout(function () {
      if (events.update.end) events.update.end();
    }, options.display.transitionTime);
  };

  chart.colors = function (color3s: any) {
    if (!arguments.length) return colors;
    if (typeof color3s !== "object") return false;
    const keys = Object.keys(color3s);
    if (!keys.length) return false;
    // remove all properties that are not colors
    keys.forEach(function (f) {
      if (!/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color3s[f]))
        delete color3s[f];
    });
    if (Object.keys(color3s).length) {
      colors = color3s;
    } else {
      colors = structuredClone(default_colors);
    }
    return chart;
  };

  return chart;

  // ancillary functions
}
