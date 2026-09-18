import {
  ABS,
  ARCCOS,
  ARCSIN,
  ARCTAN,
  caddr,
  cadr,
  car,
  Constants,
  COS,
  E,
  isadd,
  isdouble,
  ismultiply,
  ispower,
  isrational,
  issymbol,
  LOG,
  Num,
  SIN,
  TAN,
  U,
  YYE
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { absval } from './abs';
import { withSign } from './assume';
import { add, subtract } from './add';
import { integer, rational } from './bignum';
import { denominator } from './denominator';
import { derivative } from './derivative';
import { Eval } from './eval';
import { zzfloat } from './float';
import {
  isinteger,
  isnegativenumber,
  isone,
  ispolyexpandedform,
  isZeroAtomOrTensor
} from './is';
import { makeList } from './list';
import { equal, exponential, yyexpand } from './misc';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { power } from './power';
import { rationalize } from './rationalize';
import { rootsList } from './roots';
import { simplify } from './simplify';
import { subst } from './subst';

// Equations that are not polynomial in x: the expression is written as a
// polynomial (or rational function) in one "kernel" such as exp(x), log(x),
// sin(x), sqrt(x) or abs(x), the kernel is solved for, and the kernel
// equation kernel(x) = c is inverted into a smaller equation that is solved
// recursively. Every candidate is checked in the equation it came from, which
// drops the extraneous roots that squaring, abs and log domains produce.
//
// Trig equations give the principal solutions, or with solve(eq, x, n) the
// periodic families in the integer n, see solveWithFamily and tidySolutions.

type Kind =
  | 'exp'
  | 'log'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'arcsin'
  | 'arccos'
  | 'arctan'
  | 'abs'
  | 'lambertw'
  | 'radical'
  | 'other';

const MAX_DEPTH = 6;

// the integer symbol of solve(eq, x, n): sin and cos solutions get
// + 2*pi*n, tan solutions + pi*n. Module state, set by solveWithFamily only.
// n is an integer while the equation is solved, so that holds() can see
// sin(pi+2*n*pi) = 0 and drop a family at which a denominator vanishes.
let family: U | undefined;

export function solveWithFamily(E: U, x: U, n: U | undefined): U[] {
  if (n === undefined) {
    return solveEquation(E, x);
  }
  family = n;
  try {
    return withSign(n, 'integer', () => solveEquation(E, x));
  } finally {
    family = undefined;
  }
}

function periodic(angle: U, period: U): U {
  return family === undefined ? angle : add(angle, multiply(period, family));
}

// All solutions of E = 0 in x that hold in E itself, unsorted, no duplicates
// removed. Throws when the equation has a shape it cannot handle.
export function solveEquation(E: U, x: U, depth = 0): U[] {
  if (!Find(E, x)) {
    if (isZeroAtomOrTensor(simplify(E))) {
      stop('solve: infinitely many solutions');
    }
    return [];
  }
  if (ispolyexpandedform(E, x)) {
    return rootsList(E, x);
  }
  if (depth > MAX_DEPTH) {
    cannot(x);
  }
  const R = rationalize(E);
  const candidates = isone(denominator(R))
    ? solveInKernel(E, x, depth)
    : solveEquation(numerator(R), x, depth + 1);
  return candidates.filter((c) => holds(E, x, c));
}

function cannot(x: U): never {
  return stop('solve: cannot solve the equation for ' + x);
}

// The maximal subexpressions of p containing x that are not sums, products
// or integer powers, i.e. what has to be inverted to reach x.
function kernels(p: U, x: U, acc: U[] = []): U[] {
  if (!Find(p, x) || equal(p, x)) {
    return acc;
  }
  if (isadd(p) || ismultiply(p)) {
    p.tail().forEach((el) => kernels(el, x, acc));
  } else if (ispower(p) && !Find(caddr(p), x) && isinteger(caddr(p))) {
    kernels(cadr(p), x, acc);
  } else if (!acc.some((k) => equal(k, p))) {
    acc.push(p);
  }
  return acc;
}

function kind(k: U, x: U): Kind {
  if (ispower(k)) {
    if (Find(caddr(k), x)) {
      return Find(cadr(k), x) ? 'other' : 'exp';
    }
    return isrational(caddr(k)) ? 'radical' : 'other';
  }
  const fns: { [name: string]: Kind } = {
    [LOG]: 'log',
    [SIN]: 'sin',
    [COS]: 'cos',
    [TAN]: 'tan',
    [ARCSIN]: 'arcsin',
    [ARCCOS]: 'arccos',
    [ARCTAN]: 'arctan',
    [ABS]: 'abs',
    lambertw: 'lambertw'
  };
  const f = car(k);
  const name = issymbol(f) ? f.printname : '';
  return fns[name] && !Find(cadr(k), f) ? fns[name] : 'other';
}

function solveInKernel(E: U, x: U, depth: number): U[] {
  const ks = kernels(E, x);
  const kinds = ks.map((k) => kind(k, x));
  const lambert = lambertForm(E, ks, kinds, x);
  if (lambert !== undefined) {
    return lambert;
  }
  if (kinds.includes('other')) {
    cannot(x);
  }
  const u = usr_symbol('solve_u');

  if (kinds.every((k) => k === 'exp')) {
    const [kernel, Eu] = commonExponential(E, ks, x, u);
    return viaKernel(Eu, u, kernel, x, depth);
  }
  if (ks.length === 1) {
    return viaKernel(subst(E, ks[0], u), u, ks[0], x, depth);
  }
  if (kinds.every((k) => k === 'log')) {
    return solveEquation(combineLogs(E, ks, x), x, depth + 1);
  }
  if (ks.length === 2 && kinds.includes('sin') && kinds.includes('cos')) {
    const rewritten = pythagorean(E, ks, kinds, x) || asTangent(E, ks, kinds, x);
    if (rewritten !== undefined) {
      return solveEquation(rewritten, x, depth + 1);
    }
  }
  // several kernels: isolate a radical or abs, the rest stays on the other
  // side and is handled by the recursive call
  const i = kinds.findIndex((k) => k === 'radical' || k === 'abs');
  if (i < 0) {
    cannot(x);
  }
  return viaKernel(subst(E, ks[i], u), u, ks[i], x, depth);
}

// Equations that need the Lambert W function, W(z)*exp(W(z)) = z:
//   alpha*x*b^(beta*x+gamma) + c = 0   x = W(r*B/b^gamma)/B, r = -c/alpha,
//                                      B = beta*log(b)
//   alpha*x*log(x) + c = 0       x = exp(W(r))
//   a*x^x + c = 0                x = exp(W(log(-c/a)))
// undefined for any other shape.
function lambertForm(E: U, ks: U[], kinds: Kind[], x: U): U[] | undefined {
  if (ks.length !== 1) {
    return undefined;
  }
  const k = ks[0];
  const u = usr_symbol('solve_u');
  const Eu = subst(E, k, u);
  const a = derivative(Eu, u);
  const c = Eval(subtract(Eu, multiply(a, u)));
  if (Find(a, u) || Find(c, u) || Find(c, x) || isZeroAtomOrTensor(a)) {
    return undefined;
  }
  // W0(z), and W-1(z) as well for -1/e < z < 0, where both are real
  const W = (z: U): U[] => {
    const f = zzfloat(z);
    const two = isdouble(f) && f.d < 0 && f.d > -1 / Math.E;
    return (two ? [call('lambertw', z, Constants.negOne)] : []).concat([call('lambertw', z)]);
  };
  if (ispower(k) && equal(cadr(k), x) && equal(caddr(k), x)) {
    return Find(a, x)
      ? undefined
      : W(call(LOG, divide(negate(c), a))).map((w) => exponential(w));
  }
  const alpha = divide(a, x);
  if (Find(alpha, x)) {
    return undefined;
  }
  const r = divide(negate(c), alpha);
  if (kinds[0] === 'log' && equal(cadr(k), x)) {
    return W(r).map((w) => exponential(w));
  }
  if (kinds[0] === 'exp') {
    // b^(beta*x+gamma) = b^gamma * exp(B*x): x*exp(B*x) = r/b^gamma
    const beta = derivative(caddr(k), x);
    const gamma = Eval(subtract(caddr(k), multiply(beta, x)));
    if (Find(beta, x) || Find(gamma, x) || isZeroAtomOrTensor(beta)) {
      return undefined;
    }
    // (E is the equation in here, YYE the number e)
    const B = cadr(k) === symbol(YYE) ? beta : multiply(beta, call(LOG, cadr(k)));
    const shifted = divide(r, power(cadr(k), gamma));
    return W(multiply(shifted, B)).map((w) => divide(w, B));
  }
  return undefined;
}

// Solves Eu (E with the kernel written as u) for u and inverts the kernel
// for every value found.
function viaKernel(Eu: U, u: U, kernel: U, x: U, depth: number): U[] {
  const P = numerator(rationalize(Eu));
  if (!ispolyexpandedform(P, u)) {
    cannot(x);
  }
  const what = kind(kernel, x);
  const result: U[] = [];
  for (const c of rootsList(P, u)) {
    if (Find(c, x) && what !== 'radical' && what !== 'abs') {
      cannot(x);
    }
    result.push(...invert(kernel, what, c, x, depth));
  }
  return result;
}

// Solutions of kernel(x) = c: the inverse function applied to c gives one or
// two equations for the argument, which are solved recursively.
function invert(kernel: U, what: Kind, c: U, x: U, depth: number): U[] {
  const g = cadr(kernel);
  let eqs: U[];
  switch (what) {
    case 'exp':
      if (isZeroAtomOrTensor(c)) {
        return [];
      }
      eqs = [subtract(caddr(kernel), logBase(g, c))];
      break;
    case 'log':
      eqs = [subtract(g, exponential(c))];
      break;
    case 'sin': {
      if (outsideUnitInterval(c)) {
        return [];
      }
      const a = call(ARCSIN, c);
      eqs = distinctAngles(g, [a, subtract(Constants.Pi(), a)]);
      break;
    }
    case 'cos': {
      if (outsideUnitInterval(c)) {
        return [];
      }
      const a = call(ARCCOS, c);
      eqs = distinctAngles(g, [a, negate(a)]);
      break;
    }
    case 'tan':
      eqs = [subtract(g, periodic(call(ARCTAN, c), Constants.Pi()))];
      break;
    case 'arcsin':
      eqs = [subtract(g, call(SIN, c))];
      break;
    case 'arccos':
      eqs = [subtract(g, call(COS, c))];
      break;
    case 'arctan':
      eqs = [subtract(g, call(TAN, c))];
      break;
    case 'lambertw':
      // W(g) = c  <=>  g = c*exp(c)
      eqs = [subtract(g, multiply(c, exponential(c)))];
      break;
    case 'abs':
      if (isnegativenumber(c)) {
        return [];
      }
      eqs = [add(g, c), subtract(g, c)];
      break;
    case 'radical': {
      const e = caddr(kernel) as Num;
      const p = integer(e.a.toJSNumber());
      const q = integer(e.b.toJSNumber());
      if (e.b.isEven() && isnegativenumber(c)) {
        return [];
      }
      eqs = [subtract(power(g, p), power(c, q))];
      break;
    }
    default:
      cannot(x);
  }
  return eqs.reduce<U[]>(
    (acc, eq) => acc.concat(solveEquation(yyexpand(eq), x, depth + 1)),
    []
  );
}

function call(fn: string, ...args: U[]): U {
  // usr_symbol finds keywords too and creates soft names like lambertw
  return Eval(makeList(usr_symbol(fn), ...args));
}

function outsideUnitInterval(c: U): boolean {
  const f = zzfloat(c);
  return isdouble(f) && Math.abs(f.d) > 1;
}

// g = a for each angle a, dropping angles that differ by a multiple of 2*pi
function distinctAngles(g: U, angles: U[]): U[] {
  const kept: U[] = [];
  for (const a of angles) {
    const same = kept.some((b) => {
      const turns = zzfloat(divide(subtract(a, b), multiply(integer(2), Constants.Pi())));
      return isdouble(turns) && Math.abs(turns.d - Math.round(turns.d)) < 1e-9;
    });
    if (!same) {
      kept.push(a);
    }
  }
  const twoPi = multiply(integer(2), Constants.Pi());
  return kept.map((a) => subtract(g, periodic(a, twoPi)));
}

// log(c)/log(b), as an integer k when b^k = c exactly
function logBase(b: U, c: U): U {
  if (b === symbol(E)) {
    return call(LOG, c);
  }
  if (isrational(b) && isrational(c) && !isnegativenumber(b) && !isnegativenumber(c)) {
    const k = Math.round(Math.log(toNumber(c)) / Math.log(toNumber(b)));
    if (equal(power(b, integer(k)), c)) {
      return integer(k);
    }
  }
  return divide(call(LOG, c), call(LOG, b));
}

function toNumber(p: U): number {
  const f = zzfloat(p);
  return isdouble(f) ? f.d : NaN;
}

// All kernels are b_i^(g_i): finds a base b and exponent h with every kernel
// equal to (b^h)^k_i for integers k_i, and returns [b^h, E in u = b^h].
function commonExponential(E: U, ks: U[], x: U, u: U): [U, U] {
  const bases = ks.map((k) => cadr(k));
  let exponents = ks.map((k) => caddr(k));
  let base = bases[0];
  if (!bases.every((b) => equal(b, base))) {
    // numeric bases that are integer powers of the smallest one
    if (!bases.every((b) => isrational(b) && !isnegativenumber(b))) {
      cannot(x);
    }
    base = bases.reduce((m, b) => (toNumber(b) < toNumber(m) ? b : m));
    exponents = bases.map((b, i) => {
      const k = Math.round(Math.log(toNumber(b)) / Math.log(toNumber(base)));
      if (!equal(power(base, integer(k)), b)) {
        cannot(x);
      }
      return multiply(integer(k), exponents[i]);
    });
  }
  // every exponent is a rational multiple of the first
  // (dividing 1+x by itself would expand to 1/(1+x)+x/(1+x))
  const ratios = exponents.map((g) =>
    equal(g, exponents[0]) ? Constants.one : simplify(divide(g, exponents[0]))
  );
  if (!ratios.every(isrational)) {
    cannot(x);
  }
  const L = (ratios as Num[]).reduce((l, r) => lcm(l, r.b.toJSNumber()), 1);
  const h = divide(exponents[0], integer(L));
  let Eu = E;
  ks.forEach((k, i) => {
    const r = ratios[i] as Num;
    const ki = (r.a.toJSNumber() * L) / r.b.toJSNumber();
    Eu = subst(Eu, k, power(u, integer(ki)));
  });
  return [power(base, h), Eu];
}

function lcm(a: number, b: number): number {
  const gcd = (p: number, q: number): number => (q === 0 ? p : gcd(q, p % q));
  return (a * b) / gcd(a, b);
}

// E = sum of n_i*log(g_i) + d with integer n_i and d free of x becomes
// prod g_i^n_i = exp(-d), written as a difference with positive powers only.
function combineLogs(E: U, ks: U[], x: U): U {
  const us = ks.map((_, i) => usr_symbol('solve_u' + i));
  let Eu = ks.reduce((acc, k, i) => subst(acc, k, us[i]), E);
  let lhs: U = Constants.one;
  let rhs: U = Constants.one;
  ks.forEach((k, i) => {
    const n = derivative(Eu, us[i]);
    if (!isinteger(n) || us.some((v) => Find(n, v))) {
      cannot(x);
    }
    Eu = subtract(Eu, multiply(n, us[i]));
    if (isnegativenumber(n)) {
      rhs = multiply(rhs, power(cadr(k), negate(n)));
    } else {
      lhs = multiply(lhs, power(cadr(k), n));
    }
  });
  if (Find(Eu, x) || us.some((v) => Find(Eu, v))) {
    cannot(x);
  }
  return yyexpand(subtract(lhs, multiply(rhs, exponential(negate(Eu)))));
}

// sin(g)^2 = 1-cos(g)^2 (or the other way round) when that leaves a single
// kernel, i.e. the replaced function only appears in even powers.
function pythagorean(E: U, ks: U[], kinds: Kind[], x: U): U | undefined {
  const s = ks[kinds.indexOf('sin')];
  const c = ks[kinds.indexOf('cos')];
  if (!equal(cadr(s), cadr(c))) {
    return undefined;
  }
  for (const [from, to] of [
    [s, c],
    [c, s]
  ]) {
    const sq = power(subtract(Constants.one, power(to, integer(2))), rational(1, 2));
    const rewritten = yyexpand(subst(E, from, sq));
    if (kernels(rewritten, x).every((k) => equal(k, to))) {
      return rewritten;
    }
  }
  return undefined;
}

// a*sin(g) + b*cos(g) = 0 with a, b free of x is tan(g) = -b/a
function asTangent(E: U, ks: U[], kinds: Kind[], x: U): U | undefined {
  const s = ks[kinds.indexOf('sin')];
  const c = ks[kinds.indexOf('cos')];
  if (!equal(cadr(s), cadr(c))) {
    return undefined;
  }
  const [us, uc] = [usr_symbol('solve_u0'), usr_symbol('solve_u1')];
  const Eu = subst(subst(E, s, us), c, uc);
  const a = derivative(Eu, us);
  const b = derivative(Eu, uc);
  const rest = Eval(subtract(Eu, add(multiply(a, us), multiply(b, uc))));
  if (
    !isZeroAtomOrTensor(rest) ||
    [a, b].some((p) => Find(p, x) || Find(p, us) || Find(p, uc)) ||
    isZeroAtomOrTensor(a)
  ) {
    return undefined;
  }
  return add(call(TAN, cadr(s)), divide(b, a));
}

// Whether E vanishes at x = c: exactly, after simplifying, or numerically.
// A value that still holds other symbols cannot be decided and is kept.
function holds(E: U, x: U, c: U): boolean {
  try {
    let v = Eval(subst(E, x, c));
    if (isZeroAtomOrTensor(v)) {
      return true;
    }
    v = simplify(v);
    if (isZeroAtomOrTensor(v)) {
      return true;
    }
    const m = zzfloat(absval(v));
    if (!isdouble(m)) {
      return true;
    }
    // relative to the largest term: 3^x - 7^15 is off by rounding of 7^15
    const scale = (isadd(E) ? E.tail() : [E]).reduce((max, t) => {
      const size = zzfloat(absval(Eval(subst(t, x, c))));
      return isdouble(size) && size.d > max ? size.d : max;
    }, 1);
    return Math.abs(m.d) < 1e-9 * scale;
  } catch (e) {
    return false;
  }
}

// Removes duplicates, merges the families in n that differ by half a period
// and, when every solution (at n = 0) is a real number, sorts them.
export function tidySolutions(sols: U[], n?: U): U[] {
  let uniq = sols.filter((s, i) => sols.findIndex((t) => equal(s, t)) === i);
  if (n !== undefined) {
    uniq = mergeHalfPeriods(uniq, n);
  }
  const value = (s: U) => toNumber(n === undefined ? s : offset(s, n));
  if (uniq.every((s) => !Number.isNaN(value(s)))) {
    uniq.sort((a, b) => value(a) - value(b));
  }
  return uniq;
}

function offset(s: U, n: U): U {
  return Eval(subst(s, n, Constants.zero));
}

// a+P*n and b+P*n with a-b = +-P/2 exactly are together (a or b)+P/2*n,
// e.g. +-1/2*pi+2*n*pi is 1/2*pi+n*pi. Repeated until nothing merges.
// ponytail: only halves; three families a third of a period apart (the
// 1/2*pi+2/3*n*pi of 2*cos(x)^2+sin(x)=1) stay three, add if it matters.
function mergeHalfPeriods(sols: U[], n: U): U[] {
  const out = [...sols];
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const m = mergedFamily(out[i], out[j], n);
      if (m !== undefined) {
        out.splice(j, 1);
        out[i] = m;
        // start over: the merged family may fit an earlier one
        // (+-1/4*pi+n*pi is 1/4*pi+1/2*n*pi); ends, each merge removes one
        i = -1;
        break;
      }
    }
  }
  return out;
}

function mergedFamily(s: U, t: U, n: U): U | undefined {
  const period = derivative(s, n);
  if (isZeroAtomOrTensor(period) || Find(period, n) || !equal(period, derivative(t, n))) {
    return undefined;
  }
  const half = divide(period, integer(2));
  const [a, b] = [offset(s, n), offset(t, n)];
  const d = subtract(a, b);
  if (!isZeroAtomOrTensor(add(d, half)) && !isZeroAtomOrTensor(subtract(d, half))) {
    return undefined;
  }
  // the offset of smaller absolute value, the positive one on a tie
  const [va, vb] = [toNumber(a), toNumber(b)];
  const useB = Math.abs(vb) < Math.abs(va) - 1e-12 || (Math.abs(vb) <= Math.abs(va) + 1e-12 && vb > va);
  return add(useB ? b : a, multiply(half, n));
}
