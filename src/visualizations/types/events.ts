type Handler<Args extends any[] = []> = ((...args: Args) => void) | null;

export interface PtsChartEvents {
  update: { begin: Handler; end: Handler };
  set_box: { mouseover: Handler<[any, number]>; mouseout: Handler<[any, number]> };
  point_bars: {
    mouseover: Handler<[any, number]>;
    mouseout: Handler<[any, number]>;
    click: Handler<[any, number, Node]>;
  };
}

export interface GameFishEvents {
  leftImage: { click: Handler<[string]> };
  rightImage: { click: Handler<[string]> };
  update: { begin: Handler; end: Handler };
  point: { mouseover: Handler<[any, any]>; mouseout: Handler<[any, any]>; click: Handler<[any, any]> };
}

export interface GameTreeEvents {
  leftImage: { click: Handler<[string]> };
  rightImage: { click: Handler<[string]> };
  update: { begin: Handler; end: Handler };
  point: { mousemove: Handler<[any, any]>; mouseout: Handler<[any, any]>; click: Handler<[any, any]> };
  node: { mousemove: Handler<[any, number]>; mouseout: Handler<[any, number]>; click: Handler<[any, number]> };
  score: { mousemove: Handler<[any, number]>; mouseout: Handler<[any, number]>; click: Handler<[any, number]> };
  label: {
    mousemove: Handler<[any, any]>;
    mouseout: Handler<[any, any]>;
    click: Handler<[any, any, Element]>;
  };
  selector: {
    mousemove: Handler<[any, any]>;
    mouseout: Handler<[any, any]>;
    click: Handler<[any, any, Element]>;
  };
}

export interface MomentumChartEvents {
  score: { click: Handler<[any]> };
  leftImage: { click: Handler<[string]> };
  rightImage: { click: Handler<[string]> };
  update: { begin: Handler; end: Handler };
  point: { mouseover: Handler<[any, any]>; mouseout: Handler<[any, any]>; click: Handler<[any, any]> };
}
