import {
  caddr,
  cadddr,
  cadr,
  isdouble,
  istensor,
  NIL,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { double } from './bignum';
import { derivative } from './derivative';
import { Eval } from './eval';
import { zzfloat } from './float';
import { guess } from './guess';
import { equationToExpr } from './roots';
import { subst } from './subst';

const MAX_ITER = 100;

// nsolve(f, x, x0):     Newton's method from x0 (default 0)
// nsolve(f, x, [a,b]):  bisection if f(a), f(b) differ in sign, else secant
// f may be an equation (lhs = rhs). Real roots only; see nroots for
// all (complex) roots of a polynomial.
export function Eval_nsolve(p1: U) {
  const f = equationToExpr(cadr(p1));
  const xArg = Eval(caddr(p1));
  const x = xArg === symbol(NIL) ? guess(f) : xArg;
  const start = Eval(cadddr(p1));

  const fn = (v: number) => toNumber(subst(f, x, double(v)));

  if (istensor(start)) {
    if (start.nelem !== 2) {
      stop('nsolve: interval must be [a,b]');
    }
    const a = toNumber(start.elem[0]);
    const b = toNumber(start.elem[1]);
    const fa = fn(a);
    const fb = fn(b);
    if (fa === 0 || fb === 0) {
      return double(fa === 0 ? a : b);
    }
    return double(
      Math.sign(fa) * Math.sign(fb) < 0
        ? bisection(fn, a, b, fa, fb)
        : secant(fn, a, b)
    );
  }

  const df = derivative(f, x);
  const x0 = start === symbol(NIL) ? 0 : toNumber(start);
  return double(newton(fn, (v) => toNumber(subst(df, x, double(v))), x0));
}

function toNumber(p: U): number {
  const r = zzfloat(p);
  if (!isdouble(r)) {
    stop('nsolve: expression does not evaluate to a real number: ' + r);
  }
  return r.d;
}

const converged = (dx: number, x: number) =>
  Math.abs(dx) < 1e-12 * Math.max(1, Math.abs(x));

function newton(f: Fn, df: Fn, x: number): number {
  for (let i = 0; i < MAX_ITER; i++) {
    const fx = f(x);
    if (fx === 0) {
      return x;
    }
    const dx = fx / df(x);
    if (!isFinite(dx)) {
      break;
    }
    x -= dx;
    if (converged(dx, x)) {
      return x;
    }
  }
  return stop('nsolve: no convergence, try another start value');
}

function secant(f: Fn, a: number, b: number): number {
  let fa = f(a);
  for (let i = 0; i < MAX_ITER; i++) {
    const fb = f(b);
    const dx = (fb * (b - a)) / (fb - fa);
    if (!isFinite(dx)) {
      break;
    }
    [a, fa, b] = [b, fb, b - dx];
    if (converged(dx, b)) {
      return b;
    }
  }
  return stop('nsolve: no convergence, try another interval');
}

function bisection(f: Fn, a: number, b: number, fa: number, fb: number): number {
  const bound = Math.max(Math.abs(fa), Math.abs(fb));
  for (let i = 0; i < 200 && !converged(b - a, a); i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm === 0) {
      return m;
    }
    if (Math.sign(fm) === Math.sign(fa)) {
      [a, fa] = [m, fm];
    } else {
      b = m;
    }
  }
  const m = (a + b) / 2;
  // near a root |f| shrinks; growing past both endpoints means the sign
  // change comes from a pole, e.g. tan(x) on [1,2]
  if (!(Math.abs(f(m)) <= bound)) {
    stop('nsolve: sign change without a root, the function has a pole');
  }
  return m;
}

type Fn = (v: number) => number;
