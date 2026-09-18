import {
  caddr,
  cadr,
  car,
  Constants,
  E,
  GAMMA,
  iscons,
  isdouble,
  ismultiply,
  isrational,
  LOG,
  Num,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { double, integer, nativeInt } from './bignum';
import { Eval } from './eval';
import { zzfloat } from './float';
import { isinteger, isnegativeterm, isposint, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { checkArgCount, equal, exponential, yyexpand } from './misc';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { build_tensor } from './scan';

// Special functions of one argument share one evaluator: exact rules first,
// a number for a float argument, otherwise the call is left as it is. The
// derivative, when there is one, is looked up by derivative.ts.
interface Special {
  exact?: (x: U) => U | undefined;
  numeric: (x: number) => number | undefined;
  odd?: boolean;
  derivative?: (x: U) => U;
}

// usr_symbol: the soft names only exist once they are used
const call = (name: string, ...args: U[]) => makeList(usr_symbol(name), ...args);
const sq = (x: U) => power(x, integer(2));
const halfPi = () => divide(Constants.Pi(), integer(2));

export const SPECIAL: { [name: string]: Special } = {
  lambertw: {
    exact: lambertExact,
    numeric: lambertW,
    // W' = W/(x*(1+W)), see specialDerivative: the same on every branch
  },
  Si: {
    odd: true,
    exact: (x) => (isZeroAtomOrTensor(x) ? Constants.zero : undefined),
    numeric: (x) => cisi(x)[1],
    derivative: (x) => divide(call('sin', x), x)
  },
  Ci: {
    numeric: (x) => (x > 0 ? cisi(x)[0] : undefined),
    derivative: (x) => divide(call('cos', x), x)
  },
  Ei: {
    numeric: expIntegralEi,
    derivative: (x) => divide(exponential(x), x)
  },
  fresnels: {
    odd: true,
    exact: (x) => (isZeroAtomOrTensor(x) ? Constants.zero : undefined),
    numeric: (x) => fresnel(x)[0],
    derivative: (x) => call('sin', multiply(halfPi(), sq(x)))
  },
  fresnelc: {
    odd: true,
    exact: (x) => (isZeroAtomOrTensor(x) ? Constants.zero : undefined),
    numeric: (x) => fresnel(x)[1],
    derivative: (x) => call('cos', multiply(halfPi(), sq(x)))
  },
  digamma: {
    // the poles at 0, -1, -2, ...: like gamma there
    exact: (x) =>
      isinteger(x) && !isposint(x) ? stop('divide by zero') : undefined,
    numeric: digamma
  }
};

export function evalSpecial(name: string): (p1: U) => U {
  return (p1: U) => {
    checkArgCount(p1, 1);
    return special(name, Eval(cadr(p1)));
  };
}

function special(name: string, x: U): U {
  const f = SPECIAL[name];
  if (isdouble(x)) {
    const v = f.numeric(x.d);
    return v === undefined || Number.isNaN(v) ? call(name, x) : double(v);
  }
  const exact = f.exact && f.exact(x);
  if (exact !== undefined) {
    return exact;
  }
  if (f.odd && isnegativeterm(x)) {
    return negate(special(name, negate(x)));
  }
  return call(name, x);
}

// d/dX of a special function call, undefined for anything else
export function specialDerivative(p: U, dx: (q: U) => U): U | undefined {
  const head = car(p);
  if (!iscons(p) || !('printname' in head)) {
    return undefined;
  }
  const name = (head as any).printname as string;
  if (name === GAMMA) {
    return multiply(multiply(p, call('digamma', cadr(p))), dx(cadr(p)));
  }
  if (name === 'lambertw') {
    return multiply(divide(p, multiply(cadr(p), add(Constants.one, p))), dx(cadr(p)));
  }
  const f = SPECIAL[name];
  if (!f || !f.derivative) {
    return undefined;
  }
  return multiply(Eval(f.derivative(cadr(p))), dx(cadr(p)));
}

// ---- Lambert W: lambertw(x) is the principal branch W0, lambertw(x, -1)
// the other real branch W-1, defined for -1/e <= x < 0

export function Eval_lambertw(p1: U) {
  checkArgCount(p1, 1, 2);
  const x = Eval(cadr(p1));
  const branch = caddr(p1) === symbol('nil') ? Constants.zero : Eval(caddr(p1));
  const k = nativeInt(branch);
  if (k === 0) {
    return special('lambertw', x);
  }
  if (k === -1) {
    if (isdouble(x)) {
      const v = lambertWm1(x.d);
      if (v !== undefined) {
        return double(v);
      }
    } else if (equal(x, negate(exponential(Constants.negOne)))) {
      return Constants.negOne;
    }
  }
  return call('lambertw', x, isNaN(k) ? branch : integer(k));
}

function lambertWm1(x: number): number | undefined {
  if (x < -1 / Math.E || x >= 0) {
    return undefined;
  }
  let w = Math.log(-x) - Math.log(-Math.log(-x));
  if (x < -0.3) {
    w = -1 - Math.sqrt(2 * (Math.E * x + 1)); // near the branch point
  }
  for (let i = 0; i < 100; i++) {
    const ew = Math.exp(w);
    const f = w * ew - x;
    const step = f / (ew * (w + 1) - ((w + 2) * f) / (2 * w + 2));
    if (!Number.isFinite(step)) {
      break;
    }
    w -= step;
    if (Math.abs(step) < 1e-15 * (1 + Math.abs(w))) {
      break;
    }
  }
  return w;
}

// W(0) = 0, W(e) = 1, W(-1/e) = -1, W(k*log(k)) = log(k) for k >= 1 and
// W(log(k^k)) = log(k)
function lambertExact(x: U): U | undefined {
  if (isZeroAtomOrTensor(x)) {
    return Constants.zero;
  }
  if (x === symbol(E)) {
    return Constants.one;
  }
  if (equal(x, negate(exponential(Constants.negOne)))) {
    return Constants.negOne;
  }
  if (ismultiply(x)) {
    const log = x.tail().find((f) => car(f) === symbol(LOG));
    if (log && isrational(cadr(log)) && equal(x, multiply(cadr(log), log))) {
      const k = zzfloat(cadr(log));
      if (isdouble(k) && k.d >= 1) {
        return log;
      }
    }
  }
  if (car(x) === symbol(LOG) && isinteger(cadr(x))) {
    for (let k = 2; k < 40; k++) {
      if (equal(power(integer(k), integer(k)), cadr(x))) {
        return call(LOG, integer(k));
      }
    }
  }
  return undefined;
}

function lambertW(x: number): number | undefined {
  if (x < -1 / Math.E) {
    return undefined; // complex
  }
  if (x === 0) {
    return 0;
  }
  let w =
    x < 1 ? Math.sqrt(2 * (Math.E * x + 1)) - 1 : Math.log(x) - Math.log(Math.log(x) + 1);
  for (let i = 0; i < 50; i++) {
    const ew = Math.exp(w);
    const f = w * ew - x;
    const step = f / (ew * (w + 1) - ((w + 2) * f) / (2 * w + 2));
    w -= step;
    if (Math.abs(step) < 1e-15 * (1 + Math.abs(w))) {
      break;
    }
  }
  return w;
}

// ---- sine and cosine integral: series for small x, Lentz's continued
// fraction of E1(i*x) beyond (Numerical Recipes, cisi)

type C = [number, number];
const cmul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cinv = (a: C): C => {
  const n = a[0] * a[0] + a[1] * a[1];
  return [a[0] / n, -a[1] / n];
};
const EULER = 0.5772156649015329;
const FPMIN = 1e-300;

function cisi(x: number): [number, number] {
  const t = Math.abs(x);
  if (t === 0) {
    return [-Infinity, 0];
  }
  let ci: number;
  let si: number;
  if (t > 2) {
    let b: C = [1, t];
    let c: C = [1 / FPMIN, 0];
    let d = cinv(b);
    let h = d;
    for (let i = 1; i < 1000; i++) {
      const a = -i * i;
      b = [b[0] + 2, b[1]];
      d = cinv([a * d[0] + b[0], a * d[1] + b[1]]);
      const ac = cinv(c);
      c = [b[0] + a * ac[0], b[1] + a * ac[1]];
      const del = cmul(c, d);
      h = cmul(h, del);
      if (Math.abs(del[0] - 1) + Math.abs(del[1]) < 1e-16) {
        break;
      }
    }
    h = cmul([Math.cos(t), -Math.sin(t)], h);
    ci = -h[0];
    si = Math.PI / 2 + h[1];
  } else {
    let sums = 0;
    let sumc = 0;
    let term = 1;
    for (let k = 1; k < 100; k++) {
      term *= t / k;
      const contribution = term / k;
      if (k % 2 === 1) {
        sums += ((k - 1) / 2) % 2 === 0 ? contribution : -contribution;
      } else {
        sumc += (k / 2) % 2 === 1 ? -contribution : contribution;
      }
      if (contribution < 1e-18) {
        break;
      }
    }
    si = sums;
    ci = sumc + Math.log(t) + EULER;
  }
  return [ci, x < 0 ? -si : si];
}

// Ei(x): series for x > 0 (asymptotic from 40 on), -E1(-x) for x < 0 with
// E1 from its series up to 1 and a continued fraction beyond
function expIntegralEi(x: number): number | undefined {
  if (x === 0) {
    return undefined;
  }
  if (x > 0) {
    if (x > 40) {
      let sum = 1;
      let term = 1;
      for (let k = 1; k < 60; k++) {
        const next = (term * k) / x;
        if (next > term) {
          break;
        }
        term = next;
        sum += term;
      }
      return (Math.exp(x) / x) * sum;
    }
    let sum = 0;
    let term = 1;
    for (let k = 1; k < 500; k++) {
      term *= x / k;
      sum += term / k;
      if (term / k < 1e-17 * sum) {
        break;
      }
    }
    return EULER + Math.log(x) + sum;
  }
  const y = -x;
  if (y <= 1) {
    let sum = 0;
    let term = 1;
    for (let k = 1; k < 100; k++) {
      term *= -y / k;
      sum -= term / k;
    }
    return -(-EULER - Math.log(y) + sum);
  }
  let b = y + 1;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i++) {
    const a = -i * i;
    b += 2;
    d = 1 / (a * d + b);
    c = b + a / c;
    const del = c * d;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) {
      break;
    }
  }
  return -h * Math.exp(-y);
}

// Fresnel S and C: series up to 1.5, continued fraction beyond
// (Numerical Recipes, frenel)
function fresnel(x: number): [number, number] {
  const ax = Math.abs(x);
  let s: number;
  let c: number;
  if (ax < 1.5) {
    let sum = 0;
    let sums = 0;
    let sumc = ax;
    let sign = 1;
    const fact = (Math.PI / 2) * ax * ax;
    let odd = true;
    let term = ax;
    let n = 3;
    for (let k = 1; k <= 100; k++) {
      term *= fact / k;
      sum += (sign * term) / n;
      const test = Math.abs(sum) * 1e-16;
      if (odd) {
        sign = -sign;
        sums = sum;
        sum = sumc;
      } else {
        sumc = sum;
        sum = sums;
      }
      if (term < test) {
        break;
      }
      odd = !odd;
      n += 2;
    }
    s = sums;
    c = sumc;
  } else {
    const pix2 = Math.PI * ax * ax;
    let b: C = [1, -pix2];
    let cc: C = [1 / FPMIN, 0];
    let d = cinv(b);
    let h = d;
    let n = -1;
    for (let k = 2; k <= 1000; k++) {
      n += 2;
      const a = -n * (n + 1);
      b = [b[0] + 4, b[1]];
      d = cinv([a * d[0] + b[0], a * d[1] + b[1]]);
      const ic = cinv(cc);
      cc = [b[0] + a * ic[0], b[1] + a * ic[1]];
      const del = cmul(cc, d);
      h = cmul(h, del);
      if (Math.abs(del[0] - 1) + Math.abs(del[1]) < 1e-16) {
        break;
      }
    }
    h = cmul([ax, -ax], h);
    const e: C = [Math.cos(0.5 * pix2), Math.sin(0.5 * pix2)];
    const eh = cmul(e, h);
    const cs = cmul([0.5, 0.5], [1 - eh[0], -eh[1]]);
    c = cs[0];
    s = cs[1];
  }
  return x < 0 ? [-s, -c] : [s, c];
}

// psi(x): reflection below 1/2, recurrence up to 6, then the asymptotic series
function digamma(x: number): number | undefined {
  if (x <= 0 && Number.isInteger(x)) {
    return undefined;
  }
  if (x < 0.5) {
    return digamma(1 - x) - Math.PI / Math.tan(Math.PI * x);
  }
  let shift = 0;
  while (x < 6) {
    shift -= 1 / x;
    x += 1;
  }
  const i2 = 1 / (x * x);
  return (
    shift +
    Math.log(x) -
    0.5 / x -
    i2 * (1 / 12 - i2 * (1 / 120 - i2 * (1 / 252 - i2 * (1 / 240 - i2 / 132))))
  );
}

// ---- functions of two arguments

// beta(a,b) = Gamma(a)*Gamma(b)/Gamma(a+b)
export function Eval_beta(p1: U) {
  checkArgCount(p1, 2);
  const a = Eval(cadr(p1));
  const b = Eval(caddr(p1));
  const g = (x: U) => Eval(call(GAMMA, x));
  return divide(multiply(g(a), g(b)), g(add(a, b)));
}

// chebyshevt(n,x) and chebyshevu(n,x), the degree first like hermite and
// legendre: T0 = U0 = 1, T1 = x, U1 = 2x, P(n+1) = 2x*P(n) - P(n-1)
export function evalChebyshev(name: string): (p1: U) => U {
  return (p1: U) => {
    checkArgCount(p1, 2);
    const N = Eval(cadr(p1));
    const x = Eval(caddr(p1));
    const n = nativeInt(N);
    if (isNaN(n) || n < 0) {
      return call(name, N, x);
    }
    let prev: U = Constants.one;
    let cur: U = name === 'chebyshevt' ? x : multiply(integer(2), x);
    if (n === 0) {
      return prev;
    }
    for (let i = 1; i < n; i++) {
      [prev, cur] = [cur, subtract(multiply(multiply(integer(2), x), cur), prev)];
    }
    return yyexpand(cur);
  };
}

// cfrac(x) for a rational, cfrac(x, n) for the first n terms of any number
export function Eval_cfrac(p1: U) {
  checkArgCount(p1, 1, 2);
  const x = Eval(cadr(p1));
  const limit = caddr(p1) === symbol('nil') ? NaN : nativeInt(Eval(caddr(p1)));
  const terms: U[] = [];
  if (isrational(x)) {
    let a = (x as Num).a;
    let b = (x as Num).b;
    while (!b.isZero() && !(terms.length >= limit)) {
      let q = a.divide(b);
      if (a.mod(b).isNegative()) {
        q = q.subtract(1); // floor
      }
      terms.push(new Num(q));
      [a, b] = [b, a.subtract(q.multiply(b))];
    }
    return build_tensor(terms);
  }
  const f = zzfloat(x);
  if (!isdouble(f)) {
    return call('cfrac', x);
  }
  // ponytail: double precision carries about 15 digits, so only the first
  // terms are right; use an exact rational for more
  let v = f.d;
  const n = Number.isNaN(limit) ? 10 : limit;
  for (let i = 0; i < n; i++) {
    const q = Math.floor(v);
    terms.push(integer(q));
    if (Math.abs(v - q) < 1e-10) {
      break;
    }
    v = 1 / (v - q);
  }
  return build_tensor(terms);
}
