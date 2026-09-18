import bigInt from 'big-integer';
import {
  ABS,
  ARCCOS,
  ARCSIN,
  ARCTAN,
  caddr,
  cadr,
  car,
  COS,
  COSH,
  Double,
  E,
  ERF,
  ERFC,
  GAMMA,
  isadd,
  iscons,
  isdouble,
  ismultiply,
  ispower,
  isrational,
  issymbol,
  istensor,
  LOG,
  PI,
  SIN,
  SINH,
  TAN,
  TANH,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { isinteger } from './is';
import { copy_tensor } from './tensor';
import { bernoulliNumber } from './zeta';

// float(x, n): x to n significant digits. Numbers are big integers scaled by
// 10^P (fixed point) with P = n plus guard digits; the elementary functions
// are their power series after the usual argument reductions. The result is
// a Double that carries the digit string for printing: arithmetic on it
// falls back to double precision.
// ponytail: fixed point, so a result is computed twice and the precision
// doubled until both runs agree (at most 6 times); floating point with an
// exponent per number would make that unnecessary.

type Big = bigInt.BigInteger;

const GUARD = 25;
export const MAX_DIGITS = 1000;

class Fixed {
  readonly S: Big;
  private piCache?: Big;

  constructor(readonly P: number) {
    this.S = bigInt(10).pow(P);
  }

  fromRatio(a: Big, b: Big): Big {
    return a.multiply(this.S).divide(b);
  }

  fromNumber(d: number): Big {
    // 17 significant digits hold every double exactly enough
    const [mant, exp] = d.toExponential(16).split('e');
    const digits = bigInt(mant.replace('.', ''));
    const e = parseInt(exp, 10) - 16 + this.P;
    return e >= 0
      ? digits.multiply(bigInt(10).pow(e))
      : digits.divide(bigInt(10).pow(-e));
  }

  // leading digits only: good enough for starting values and reductions
  toNumber(a: Big): number {
    const s = a.abs().toString();
    const mant = Number(s.slice(0, 17));
    const e = s.length - Math.min(s.length, 17) - this.P;
    return (a.isNegative() ? -1 : 1) * mant * Math.pow(10, e);
  }

  mul(a: Big, b: Big): Big {
    return a.multiply(b).divide(this.S);
  }

  div(a: Big, b: Big): Big {
    if (b.isZero()) {
      throw new Error('division by zero');
    }
    return a.multiply(this.S).divide(b);
  }

  powInt(a: Big, n: number): Big {
    if (n < 0) {
      return this.div(this.S, this.powInt(a, -n));
    }
    let result = this.S;
    for (let base = a; n > 0; n = Math.floor(n / 2)) {
      if (n % 2 === 1) {
        result = this.mul(result, base);
      }
      base = this.mul(base, base);
    }
    return result;
  }

  // the q-th root of a > 0 by Newton: y <- ((q-1)*y + a/y^(q-1))/q
  root(a: Big, q: number): Big {
    if (a.isZero()) {
      return a;
    }
    if (a.isNegative()) {
      throw new Error('root of a negative number');
    }
    let y = this.fromNumber(Math.pow(this.toNumber(a), 1 / q));
    for (let i = 0; i < 200; i++) {
      const next = y
        .multiply(q - 1)
        .add(this.div(a, this.powInt(y, q - 1)))
        .divide(q);
      const done = next.subtract(y).abs().leq(1);
      y = next;
      if (done) {
        break;
      }
    }
    return y;
  }

  // arctan(1/k) = sum (-1)^i / ((2i+1) k^(2i+1))
  private arctanInverse(k: number): Big {
    let term = this.S.divide(k);
    let sum = term;
    for (let i = 1; !term.isZero(); i++) {
      term = term.divide(k * k);
      const t = term.divide(2 * i + 1);
      sum = i % 2 ? sum.subtract(t) : sum.add(t);
    }
    return sum;
  }

  // Machin: pi = 16*arctan(1/5) - 4*arctan(1/239)
  pi(): Big {
    if (!this.piCache) {
      this.piCache = this.arctanInverse(5)
        .multiply(16)
        .subtract(this.arctanInverse(239).multiply(4));
    }
    return this.piCache;
  }

  // exp(x) = exp(x/2^k)^(2^k), the inner one from its series
  exp(x: Big): Big {
    const k = Math.max(0, Math.ceil(Math.log2(Math.abs(this.toNumber(x)) + 1)) + 8);
    const r = x.divide(bigInt(2).pow(k));
    let term = this.S;
    let sum = this.S;
    for (let i = 1; !term.isZero(); i++) {
      term = this.mul(term, r).divide(i);
      sum = sum.add(term);
    }
    for (let i = 0; i < k; i++) {
      sum = this.mul(sum, sum);
    }
    return sum;
  }

  // Newton on exp: y <- y + 2*(x - exp(y))/(x + exp(y))
  log(x: Big): Big {
    if (!x.isPositive()) {
      throw new Error('log of a non-positive number');
    }
    const s = x.toString();
    const approx =
      Math.log(Number(s.slice(0, 17))) +
      (s.length - Math.min(s.length, 17) - this.P) * Math.LN10;
    let y = this.fromNumber(approx);
    for (let i = 0; i < 100; i++) {
      const e = this.exp(y);
      const delta = this.div(x.subtract(e).multiply(2), x.add(e));
      y = y.add(delta);
      if (delta.abs().leq(1)) {
        break;
      }
    }
    return y;
  }

  // x reduced to [-pi, pi], then the sine series
  sin(x: Big): Big {
    const twoPi = this.pi().multiply(2);
    let r = x.mod(twoPi);
    if (r.gt(this.pi())) {
      r = r.subtract(twoPi);
    } else if (r.lt(this.pi().negate())) {
      r = r.add(twoPi);
    }
    const r2 = this.mul(r, r);
    let term = r;
    let sum = r;
    for (let i = 1; !term.isZero(); i++) {
      term = this.mul(term, r2).divide(2 * i * (2 * i + 1));
      sum = i % 2 ? sum.subtract(term) : sum.add(term);
    }
    return sum;
  }

  cos(x: Big): Big {
    return this.sin(x.add(this.pi().divide(2)));
  }

  // abs(x) > 1 through pi/2 - arctan(1/x), then three halvings
  // arctan(x) = 2*arctan(x/(1+sqrt(1+x^2))) before the series
  arctan(x: Big): Big {
    if (x.abs().gt(this.S)) {
      const half = this.pi().divide(2);
      return (x.isNegative() ? half.negate() : half).subtract(
        this.arctan(this.div(this.S, x))
      );
    }
    let r = x;
    for (let i = 0; i < 3; i++) {
      r = this.div(r, this.S.add(this.root(this.S.add(this.mul(r, r)), 2)));
    }
    const r2 = this.mul(r, r);
    let term = r;
    let sum = r;
    for (let i = 1; !term.isZero(); i++) {
      term = this.mul(term, r2);
      const t = term.divide(2 * i + 1);
      sum = i % 2 ? sum.subtract(t) : sum.add(t);
    }
    return sum.multiply(8);
  }

  // erf(x) = 2/sqrt(pi) * sum (-1)^k x^(2k+1)/(k!(2k+1)); the cancellation
  // for large x is caught by the precision check of bigFloat
  erf(x: Big): Big {
    const x2 = this.mul(x, x);
    let term = x;
    let sum = x;
    for (let k = 1; !term.isZero(); k++) {
      term = this.mul(term, x2).divide(k);
      const t = term.divide(2 * k + 1);
      sum = k % 2 ? sum.subtract(t) : sum.add(t);
    }
    return this.div(sum.multiply(2), this.root(this.pi(), 2));
  }

  // Gamma(z): the argument is shifted up to at least P, where Stirling's
  // series log Gamma(w) = (w-1/2) log w - w + log(2 pi)/2
  //   + sum B_2k/(2k(2k-1) w^(2k-1)) converges to the working precision,
  // then divided back down; reflection for z < 0.
  gamma(z: Big): Big {
    if (z.mod(this.S).isZero() && !z.isPositive()) {
      throw new Error('Gamma pole');
    }
    if (z.isNegative()) {
      // Gamma(z) = pi/(sin(pi z) Gamma(1-z))
      const s = this.sin(this.mul(this.pi(), z));
      return this.div(this.pi(), this.mul(s, this.gamma(this.S.subtract(z))));
    }
    let w = z;
    let shift = this.S;
    const target = this.S.multiply(Math.max(10, this.P));
    while (w.lt(target)) {
      shift = this.mul(shift, w);
      w = w.add(this.S);
    }
    let logGamma = this.mul(w.subtract(this.S.divide(2)), this.log(w))
      .subtract(w)
      .add(this.log(this.pi().multiply(2)).divide(2));
    const w2 = this.mul(w, w);
    let wPow = w; // w^(2k-1)
    for (let k = 1; k < 2000; k++) {
      const B = bernoulliNumber(2 * k) as any;
      const term = this.div(this.fromRatio(B.a, B.b), wPow).divide(2 * k * (2 * k - 1));
      if (term.isZero()) {
        break;
      }
      logGamma = logGamma.add(term);
      wPow = this.mul(wPow, w2);
    }
    return this.div(this.exp(logGamma), shift);
  }

  arcsin(x: Big): Big {
    if (x.abs().gt(this.S)) {
      throw new Error('arcsin outside [-1,1]');
    }
    if (x.abs().eq(this.S)) {
      const half = this.pi().divide(2);
      return x.isNegative() ? half.negate() : half;
    }
    return this.arctan(this.div(x, this.root(this.S.subtract(this.mul(x, x)), 2)));
  }
}

function evaluate(p: U, f: Fixed): Big {
  if (isrational(p)) {
    return f.fromRatio(p.a, p.b);
  }
  if (isdouble(p)) {
    return f.fromNumber(p.d);
  }
  if (p === symbol(PI)) {
    return f.pi();
  }
  if (p === symbol(E)) {
    return f.exp(f.S);
  }
  if (isadd(p)) {
    return p.tail().reduce((acc, t) => acc.add(evaluate(t, f)), bigInt.zero);
  }
  if (ismultiply(p)) {
    return p.tail().reduce((acc, t) => f.mul(acc, evaluate(t, f)), f.S);
  }
  if (ispower(p)) {
    const base = cadr(p);
    const e = caddr(p);
    if (base === symbol(E)) {
      return f.exp(evaluate(e, f));
    }
    if (isinteger(e) && e.a.abs().lt(1e6)) {
      return f.powInt(evaluate(base, f), e.a.toJSNumber());
    }
    if (isrational(e) && e.a.abs().lt(1e6) && e.b.lt(1e4)) {
      return f.powInt(f.root(evaluate(base, f), e.b.toJSNumber()), e.a.toJSNumber());
    }
    return f.exp(f.mul(evaluate(e, f), f.log(evaluate(base, f))));
  }
  if (iscons(p) && issymbol(car(p))) {
    const name = (car(p) as any).printname as string;
    const x = () => evaluate(cadr(p), f);
    const expPair = (): [Big, Big] => {
      const ex = f.exp(x());
      return [ex, f.div(f.S, ex)];
    };
    switch (name) {
      case SIN:
        return f.sin(x());
      case COS:
        return f.cos(x());
      case TAN:
        return f.div(f.sin(x()), f.cos(x()));
      case ARCTAN:
        return f.arctan(x());
      case ARCSIN:
        return f.arcsin(x());
      case ARCCOS:
        return f.pi().divide(2).subtract(f.arcsin(x()));
      case LOG:
        return f.log(x());
      case GAMMA:
        return f.gamma(x());
      case ERF:
        return f.erf(x());
      case ERFC:
        return f.S.subtract(f.erf(x()));
      case ABS:
        return x().abs();
      case SINH: {
        const [a, b] = expPair();
        return a.subtract(b).divide(2);
      }
      case COSH: {
        const [a, b] = expPair();
        return a.add(b).divide(2);
      }
      case TANH: {
        const [a, b] = expPair();
        return f.div(a.subtract(b), a.add(b));
      }
    }
  }
  throw new Error('unsupported');
}

// n significant digits of a/10^P, rounded half up: plain decimals while the
// leading digit sits between 10^-6 and 10^n, d.ddd*10^e beyond
function format(a: Big, P: number, n: number): string {
  if (a.isZero()) {
    return '0.0';
  }
  const sign = a.isNegative() ? '-' : '';
  let digits = a.abs().toString();
  let exp10 = digits.length - 1 - P; // power of ten of the leading digit
  if (digits.length > n) {
    const rounded = bigInt(digits.slice(0, n)).add(digits[n] >= '5' ? 1 : 0).toString();
    if (rounded.length > n) {
      exp10++; // 9.99 rounded up to 10.0
    }
    digits = rounded.slice(0, n);
  } else {
    digits = digits.padEnd(n, '0');
  }
  if (exp10 < -6 || exp10 >= n) {
    const mantissa = digits[0] + '.' + (digits.slice(1) || '0');
    return `${sign}${mantissa}*10^${exp10 < 0 ? `(${exp10})` : exp10}`;
  }
  if (exp10 < 0) {
    return `${sign}0.${'0'.repeat(-exp10 - 1)}${digits}`;
  }
  const frac = digits.slice(exp10 + 1);
  return `${sign}${digits.slice(0, exp10 + 1)}.${frac || '0'}`;
}

// p, already evaluated exactly, to n significant digits
export function bigFloat(p: U, n: number): U {
  if (istensor(p)) {
    const t = copy_tensor(p);
    t.tensor.elem = t.tensor.elem.map((el) => bigFloat(el, n));
    return t;
  }
  // Two runs at different precisions must print the same digits: that
  // catches lost digits from cancellation (sin(10^22), exp(100)-exp(100)+1/3)
  // and tiny results. The precision doubles until they agree.
  let P = n + GUARD;
  for (let attempt = 0; ; attempt++) {
    let low: Big;
    let high: Big;
    const fine = new Fixed(P + GUARD);
    try {
      low = evaluate(p, new Fixed(P));
      high = evaluate(p, fine);
    } catch (e) {
      return stop(`float: cannot evaluate ${p} to ${n} digits`);
    }
    const text = format(high, P + GUARD, n);
    if (format(low, P, n) === text || attempt === 6) {
      const d = new Double(fine.toNumber(high));
      d.bigRepr = text;
      return d;
    }
    P *= 2;
  }
}
