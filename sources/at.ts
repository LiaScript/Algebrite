import {
  AT,
  caddr,
  cadddr,
  cadr,
  car,
  cddr,
  DERIVATIVE,
  iscons,
  issymbol,
  NIL,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { is_usr_symbol, symbol, usr_symbol } from '../runtime/symbol';
import { Eval } from './eval';
import { makeList } from './list';
import { subst } from './subst';

/* at =====================================================================

at(expr, x, value) is expr at x = value, the substitution done after
differentiating: at(d(y(t),t),t,0) is y'(0).

It stays unevaluated while expr has a derivative with respect to x that
can't be computed (an unknown function). For an unknown function of the
variable alone, d(...d(y(x),x)...,x), it prints as y'(value), y''(value),
..., and y'(value) can be typed in.

*/

export function Eval_at(p1: U): U {
  const x = issymbol(caddr(p1)) ? caddr(p1) : Eval(caddr(p1));
  return at(Eval(cadr(p1)), x, Eval(cadddr(p1)));
}

export function at(expr: U, x: U, value: U): U {
  // subst turns each derivative with respect to x into an at(); for expr
  // itself that must not be evaluated again, it would come back here
  if (car(expr) === symbol(DERIVATIVE) && caddr(expr) === x) {
    return makeAt(expr, x, value);
  }
  return Eval(subst(expr, x, value));
}

// Substituting a free symbol not already in expr just renames the
// variable: at(d(y(t),t),t,a) is d(y(a),a).
export function canRename(expr: U, value: U): boolean {
  return is_usr_symbol(value) && !Find(expr, value);
}

// The unevaluated at(), in canonical form: primes use a fixed variable, so
// y'(0) from subst, from laplace and typed in are the same expression.
export function makeAt(expr: U, x: U, value: U): U {
  if (canRename(expr, value)) {
    return Eval(subst(expr, x, value));
  }
  if (primeOrder(expr, x) > 0 && x !== primeVariable()) {
    return makeAt(subst(expr, x, primeVariable()), primeVariable(), value);
  }
  return makeList(symbol(AT), expr, x, value);
}

// placeholder variable of the prime notation, the parser can't produce it
export function primeVariable(): U {
  return usr_symbol('$x');
}

// n for d(...d(y(x),x)...,x) with y a function of x alone, else 0
export function primeOrder(expr: U, x: U): number {
  let n = 0;
  while (car(expr) === symbol(DERIVATIVE) && caddr(expr) === x) {
    expr = cadr(expr);
    n++;
  }
  const isCallOfXAlone =
    iscons(expr) &&
    issymbol(car(expr)) &&
    cadr(expr) === x &&
    cddr(expr) === symbol(NIL);
  return isCallOfXAlone ? n : 0;
}

// "y''(0)" for at(d(d(y(x),x),x),x,0), else null
export function primeName(p: U): string | null {
  if (car(p) !== symbol(AT)) {
    return null;
  }
  const expr = cadr(p);
  const n = primeOrder(expr, caddr(p));
  if (n === 0) {
    return null;
  }
  let f = expr;
  while (car(f) === symbol(DERIVATIVE)) {
    f = cadr(f);
  }
  return car(f).toString() + "'".repeat(n);
}

// y'(value) typed in: at(d(y(x),x),x,value) with the prime variable
export function primeCall(name: string, order: number, value: U): U {
  const x = primeVariable();
  let expr = makeList(usr_symbol(name), x);
  for (let i = 0; i < order; i++) {
    expr = makeList(symbol(DERIVATIVE), expr, x);
  }
  return makeList(symbol(AT), expr, x, value);
}
