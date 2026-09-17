import {
  caddddr,
  cadddr,
  caddr,
  cadr,
  cddddr,
  evalFloats,
  isNumericAtom,
  isstr,
  issymbol,
  istensor,
  NIL,
  SYMBOL_X,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { get_binding, set_binding, symbol } from '../runtime/symbol';
import { double, nativeDouble } from './bignum';
import { Eval } from './eval';
import { yyfloat } from './float';
import { scan } from './scan';

// 'draw' function
//
// draw(f)            plot f over x
// draw(f, x)         plot f over variable x
// draw(f, x, a, b)   plot f over x in [a, b]
// draw([f, g], ...)  plot several curves; expr and f(v) are then arrays
// draw(f, x, a, b, "red dashed")  options, or ["...", "..."] per curve
//
// Algebrite does no rendering itself: the host registers a handler via
// setDrawHandler(handler, callback), which receives
// { expr, variable, range, f, callback }. f(v) samples the expression
// numerically (NaN where it's not a real number); callback is passed
// through untouched for the handler to hand its output to. options are
// passed as raw strings, their meaning is up to the handler; num("-pi")
// evaluates an expression string numerically so options can be symbolic.

export interface DrawArgs {
  expr: string | string[];
  variable: string;
  range: [number, number] | undefined;
  f: (v: number) => number | number[];
  options: string | string[] | undefined;
  num: (s: string) => number;
  callback: unknown;
}

let drawHandler: ((args: DrawArgs) => void) | undefined;
let drawCallback: unknown;

export function setDrawHandler(
  handler: ((args: DrawArgs) => void) | undefined,
  callback?: unknown
) {
  drawHandler = handler;
  drawCallback = callback;
}

function toFloat(p: U): number {
  const r = evalFloats(() => Eval(yyfloat(Eval(p))));
  return isNumericAtom(r) ? nativeDouble(r) : NaN;
}

export function Eval_draw(p1: U) {
  if (!drawHandler) {
    return p1;
  }

  const body = cadr(p1);
  const variable = caddr(p1) === symbol(NIL) ? symbol(SYMBOL_X) : caddr(p1);
  if (!issymbol(variable)) {
    stop('draw: 2nd arg should be the variable to plot over');
  }

  const range: [number, number] | undefined =
    cadddr(p1) === symbol(NIL)
      ? undefined
      : [toFloat(cadddr(p1)), toFloat(caddddr(p1))];

  // ponytail: f binds the variable globally, so it is only valid while the
  // handler runs synchronously inside this Eval; sample eagerly if needed later.
  const at = (p: U, v: number): number => {
    const saved = get_binding(variable);
    set_binding(variable, double(v));
    try {
      return toFloat(p);
    } catch (e) {
      return NaN;
    } finally {
      set_binding(variable, saved);
    }
  };

  const opts = cadr(cddddr(p1)) === symbol(NIL) ? undefined : Eval(cadr(cddddr(p1)));
  const str = (p: U) => (isstr(p) ? p.str : p.toString());
  const options = !opts ? undefined : istensor(opts) ? opts.elem.map(str) : str(opts);

  const num = (s: string): number => {
    try {
      return toFloat(scan(s)[1]);
    } catch (e) {
      return NaN;
    }
  };

  const evaluated = Eval(body);
  const parts = istensor(evaluated) ? evaluated.elem : undefined;
  const f = (v: number) => (parts ? parts.map((p) => at(p, v)) : at(body, v));

  drawHandler({
    expr: parts ? parts.map((p) => p.toString()) : evaluated.toString(),
    variable: variable.toString(),
    range,
    f,
    options,
    num,
    callback: drawCallback,
  });

  return symbol(NIL);
}
