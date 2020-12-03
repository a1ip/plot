import {ascending} from "d3-array";
import {create} from "d3-selection";
import {defined} from "../defined.js";
import {Mark, identity, indexOf, maybeColor} from "../mark.js";
import {Style, applyDirectStyles, applyIndirectStyles} from "../style.js";

class AbstractTick extends Mark {
  constructor(
    data,
    channels,
    {
      z,
      stroke,
      transform,
      ...style
    } = {}
  ) {
    const [vstroke, cstroke = vstroke == null ? "currentColor" : undefined] = maybeColor(stroke);
    super(
      data,
      [
        ...channels,
        {name: "z", value: z, optional: true},
        {name: "stroke", value: vstroke, scale: "color", optional: true}
      ],
      transform
    );
    Object.assign(this, Style({stroke: cstroke, ...style}));
  }
  render(I, scales, channels) {
    const {color} = scales;
    const {x: X, y: Y, z: Z, stroke: S} = channels;
    let index = I.filter(i => defined(X[i]) && defined(Y[i]));
    if (S) index = index.filter(i => defined(S[i]));
    if (Z) index.sort((i, j) => ascending(Z[i], Z[j]));
    return create("svg:g")
        .call(applyIndirectStyles, this)
        .call(g => g.selectAll("line")
          .data(index)
          .join("line")
            .call(applyDirectStyles, this)
            .attr("x1", this._x1(scales, channels))
            .attr("x2", this._x2(scales, channels))
            .attr("y1", this._y1(scales, channels))
            .attr("y2", this._y2(scales, channels))
            .attr("stroke", S && (i => color(S[i]))))
      .node();
  }
}

export class TickX extends AbstractTick {
  constructor(data, {x = identity, y = indexOf, ...options} = {}) {
    super(
      data,
      [
        {name: "x", value: x, scale: "x"},
        {name: "y", value: y, scale: "y", type: "band"}
      ],
      options
    );
  }
  _x1({x}, {x: X}) {
    return i => Math.round(x(X[i])) + 0.5;
  }
  _x2({x}, {x: X}) {
    return i => Math.round(x(X[i])) + 0.5;
  }
  _y1({y}, {y: Y}) {
    return i => y(Y[i]);
  }
  _y2({y}, {y: Y}) {
    return i => y(Y[i]) + y.bandwidth();
  }
}

export class TickY extends AbstractTick {
  constructor(data, {x = indexOf, y = identity, ...options} = {}) {
    super(
      data,
      [
        {name: "x", value: x, scale: "x", type: "band"},
        {name: "y", value: y, scale: "y"}
      ],
      options
    );
  }
  _x1({x}, {x: X}) {
    return i => x(X[i]);
  }
  _x2({x}, {x: X}) {
    return i => x(X[i]) + x.bandwidth();
  }
  _y1({y}, {y: Y}) {
    return i => Math.round(y(Y[i])) + 0.5;
  }
  _y2({y}, {y: Y}) {
    return i => Math.round(y(Y[i])) + 0.5;
  }
}

export function tickX(data, options) {
  return new TickX(data, options);
}

export function tickY(data, options) {
  return new TickY(data, options);
}