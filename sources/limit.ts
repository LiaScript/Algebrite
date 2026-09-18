import {
  ABS,
  ARCTAN,
  ARCTANH,
  caddddr,
  cadddr,
  caddr,
  cadr,
  car,
  CEILING,
  Constants,
  COS,
  E,
  ERF,
  ERFC,
  COSH,
  FLOOR,
  GAMMA,
  INF,
  iscons,
  isdouble,
  ismultiply,
  isNumericAtom,
  ispower,
  isrational,
  issymbol,
  LOG,
  MOD,
  NIL,
  POWER,
  ROUND,
  SGN,
  SIN,
  SINH,
  TAN,
  TANH,
  U,
  isadd,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { facts, isNonzero, isPositive, isReal, withSign } from './assume';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { double, integer, nativeInt, rational } from './bignum';
import { Condense } from './condense';
import { cosine } from './cos';
import { sine } from './sin';
import { degree } from './degree';
import { Eval } from './eval';
import { derivative } from './derivative';
import { denominator } from './denominator';
import { zzfloat } from './float';
import {
  isinteger,
  isminusone,
  isnegativenumber,
  isplusone,
  ispolyexpandedform,
  isposint,
  ispositivenumber,
  isZeroAtomOrTensor
} from './is';
import { add, subtract } from './add';
import { lcm } from './lcm';
import { logarithm } from './log';
import { activeBranch, hasPiecewise, isPiecewise, resolvePiecewise } from './piecewise';
import { power } from './power';
import { makeList } from './list';
import { checkArgCount, equal, exponential, yyexpand } from './misc';
import { divide, inverse, multiply, multiply_all, negate } from './multiply';
import { numerator } from './numerator';
import { rationalize } from './rationalize';
import { simplify } from './simplify';
import { subst } from './subst';

const MAX_LHOPITAL_ITERATIONS = 5;

// Marks "couldn't evaluate at this point" (e.g. division by zero), as
// distinct from a genuine U result — see tryEvalAt().
const INDETERMINATE = Symbol('indeterminate');

// Direct substitution, catching the Error that stop() throws (e.g. on
// division by zero) — this doubles as the indeterminate-form detector,
// since Algebrite has no symbolic infinity/NaN value to check for instead.
function tryEvalAt(expr: U, X: U, A: U): U | typeof INDETERMINATE {
  try {
    return evalWatchingPoles(subst(expr, X, A));
  } catch (e) {
    return INDETERMINATE;
  }
}

// log and arctanh do not stop at their poles, they come back unevaluated as
// log(0) or arctanh(1); substitution then looks like it succeeded.
function hasPole(p: U): boolean {
  if (!iscons(p)) {
    return false;
  }
  if (car(p) === symbol(LOG) && isZeroAtomOrTensor(cadr(p))) {
    return true;
  }
  if (car(p) === symbol(ARCTANH) && (isplusone(cadr(p)) || isminusone(cadr(p)))) {
    return true;
  }
  return p.tail().some(hasPole);
}

// Every log(0) is the same expression, whatever went to 0 inside and how
// fast: log(0)/log(0) = 1 and log(0)-log(0) = 0 say nothing about the limit
// (log(x)/log(x^3+x^2) goes to 1/2). Sums, products and powers are evaluated
// bottom-up, and two poles meeting in one of them stop, as inf-inf does.
// A pole times an exact 0 stays 0: a logarithm loses against every power.
function evalWatchingPoles(p: U): U {
  const arithmetic = isadd(p) || ismultiply(p) || ispower(p);
  if (!iscons(p) || !arithmetic || !(Find(p, symbol(LOG)) || Find(p, symbol(ARCTANH)))) {
    return Eval(p);
  }
  const args = p.tail().map(evalWatchingPoles);
  const polar = args.filter(hasPole);
  const plainPower =
    ispower(p) && !hasPole(args[1]) && isNumericAtom(args[1]) && !isZeroAtomOrTensor(args[1]);
  if (polar.length > 1 || (ispower(p) && polar.length > 0 && !plainPower)) {
    stop('limit: poles meet');
  }
  return Eval(makeList(car(p), ...args));
}

// The pole makes the whole expression infinite: it is the expression, a
// term, a factor (a zero factor would have evaluated to 0 already) or the
// base of a positive power. Inside any other function it does not:
// sin(log(0)) is bounded, 1/log(0) is 0.
function isInfiniteAtPole(p: U): boolean {
  if (isadd(p) || ismultiply(p)) {
    return p.tail().some(isInfiniteAtPole);
  }
  if (ispower(p)) {
    return ispositivenumber(caddr(p)) && isInfiniteAtPole(cadr(p));
  }
  return iscons(p) && hasPole(p) && !p.tail().some(hasPole);
}

// limit(expr, x, point): direct substitution, simplify-then-substitute, and
// a bounded L'Hopital fallback for 0/0 forms. The point may be inf or -inf,
// and the result may be inf or -inf. There is no direction argument, so
// user-facing one-sided limits and multivariable limits are out of scope.
export function Eval_limit(p1: U) {
  checkArgCount(p1, 3, 4);
  const F = Eval(cadr(p1));
  const X = Eval(caddr(p1));
  const A = Eval(cadddr(p1));

  // optional 4th arg: a positive number for the limit from the right,
  // a negative one for the limit from the left
  let sides = [-1, 1];
  const side = caddddr(p1);
  const sideName = issymbol(side) ? side.printname : '';
  if (sideName === 'left' || sideName === 'right') {
    sides = [sideName === 'left' ? -1 : 1];
  } else if (side !== symbol(NIL)) {
    const direction = Eval(side);
    if (!isNumericAtom(direction) || isZeroAtomOrTensor(direction)) {
      stop(
        'limit: 4th argument must be left, right or a positive or negative number'
      );
    }
    sides = [isnegativenumber(direction) ? -1 : 1];
  }
  return limit(F, X, A, sides);
}

const VANISHING_DENOMINATOR =
  'limit: denominator vanishes while numerator does not — limit is infinite or does not exist';

// The fallbacks call limit() on parts of F, and each other, and ask the same
// questions again and again (the limit of sin(1/x) for the squeeze, the
// factors, the jump functions, the oscillation): within one top-level call
// the answers, and the failures, are remembered. What the answer depends on
// besides the arguments is part of the key.
let depth = 0;
const memo = new Map<string, U | Error>();

export function limit(F: U, X: U, A: U, sides: number[] = [-1, 1]): U {
  if (depth > 20) {
    stop('limit: nested too deeply');
  }
  const context = [JSON.stringify(facts(X)), inverting, probing, lhopitalOnceRunning];
  const key = [F, X, A, sides, ...context].join('|');
  const known = memo.get(key);
  if (known instanceof Error) {
    throw known;
  }
  if (known !== undefined) {
    return known;
  }
  depth++;
  try {
    const result = limitGuarded(F, X, A, sides);
    memo.set(key, result);
    return result;
  } catch (e) {
    memo.set(key, e);
    throw e;
  } finally {
    if (--depth === 0) {
      memo.clear();
    }
  }
}

function limitGuarded(F: U, X: U, A: U, sides: number[]): U {
  if (isInfinite(A) && hasPiecewise(F)) {
    // ponytail: the branch at +-1e9 is taken for the one near +-inf
    const G = resolvePiecewise(F, X, double(A === symbol(INF) ? 1e9 : -1e9));
    F = G === undefined ? F : Eval(G);
  }
  F = unboundFloors(F, X, A, sides);
  const viaExp = powerLimit(F, X, A, sides);
  if (viaExp !== undefined) {
    return viaExp;
  }
  try {
    return limitCore(F, X, A, sides);
  } catch (e) {
    // the evaluator expands (x-1)*sin(1/(x-1)); the factors are needed
    const C = isadd(F) ? Condense(F) : F;
    const r =
      squeeze(F, X, A, sides) ||
      (ismultiply(C) ? squeeze(C, X, A, sides) : undefined) ||
      termwise(F, X, A, sides) ||
      combineLogs(F, X, A, sides) ||
      boundedPlusInfinite(F, X, A, sides) ||
      factorwise(F, X, A, sides) ||
      compose(F, X, A, sides) ||
      viaKernel(F, X, A, sides) ||
      leadingTerm(F, X, A, sides) ||
      expProduct(F, X, A, sides) ||
      invert(F, X, A, sides) ||
      lhopitalOnce(F, X, A, sides);
    if (r !== undefined) {
      return r;
    }
    const wave = oscillating(F, X, A, sides);
    if (wave !== undefined) {
      stop(`limit: the limit does not exist: ${wave} oscillates`);
    }
    // each side on its own: 1/tan(x) at pi/2, where tan has two limits
    if (sides.length === 2) {
      let each: U[];
      try {
        each = sides.map((side) => limit(F, X, A, [side]));
      } catch (e2) {
        throw e;
      }
      if (!equal(each[0], each[1])) {
        stop('limit: left and right limits differ — limit does not exist');
      }
      return each[0];
    }
    throw e;
  }
}

// sin(g) or cos(g), also to a positive integer power, with a continuous g
// that goes to +-inf on one of the sides, takes the values 0 and 1 again and
// again: no limit. The same holds for it times a factor with a nonzero or
// infinite limit, and for it plus terms with a finite limit. Returns the
// sin(g) or cos(g) in question. (Times a factor that goes to 0 the limit
// is 0, see squeeze.)
function oscillating(F: U, X: U, A: U, sides: number[]): U | undefined {
  const limitOf = (f: U, side: number): U | undefined => {
    try {
      return limit(f, X, A, [side]);
    } catch (e) {
      return undefined;
    }
  };
  const onSide = (f: U, side: number): U | undefined => {
    if (ispower(f) && isposint(caddr(f))) {
      return onSide(cadr(f), side);
    }
    const toInfinity = (g: U): boolean => {
      const L = Find(g, X) && !hasJump(g, X) && limitOf(g, side);
      return !!L && isInfinite(L);
    };
    if (car(f) === symbol(SIN) || car(f) === symbol(COS)) {
      return toInfinity(cadr(f)) ? f : undefined;
    }
    // the fractional part mod(g,1), see unboundFloors
    if (car(f) === symbol(MOD) && !Find(caddr(f), X)) {
      return toInfinity(cadr(f)) ? f : undefined;
    }
    // (-1)^floor(g) is 1 and -1 again and again
    if (ispower(f) && isnegativenumber(cadr(f)) && isRounding(car(caddr(f)))) {
      return toInfinity(cadr(caddr(f))) ? f : undefined;
    }
    // sgn, floor, ceiling and round of a wave around 0 jump with it (of a
    // sum they need not: sgn(2+sin(x)) is 1), abs of a wave is a wave
    if (iscons(f) && isJumpFunction(car(f)) && car(f) !== symbol(MOD)) {
      const inner = cadr(f);
      return car(f) === symbol(ABS) || !isadd(inner) ? onSide(inner, side) : undefined;
    }
    if (!ismultiply(f) && !isadd(f)) {
      return undefined;
    }
    // exactly one part oscillates, the others together have a limit
    const parts = f.tail();
    const waves = parts.filter((q) => onSide(q, side) !== undefined);
    if (waves.length !== 1) {
      return undefined;
    }
    const others = parts.filter((q) => q !== waves[0]);
    const L = limitOf(ismultiply(f) ? multiply_all(others) : others.reduce(add, Constants.zero), side);
    const keeps =
      L !== undefined &&
      (ismultiply(f) ? isInfinite(L) || isNonzero(L) === true : !Find(L, symbol(INF)));
    return keeps ? onSide(waves[0], side) : undefined;
  };
  for (const side of sides) {
    const wave = onSide(F, side);
    if (wave !== undefined) {
      return wave;
    }
  }
  return undefined;
}

// f^g with X in base and exponent (1^inf, inf^0, 0^0): exp(limit(g*log(f)))
function powerLimit(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (!ispower(F) || !Find(cadr(F), X) || !Find(caddr(F), X)) {
    return undefined;
  }
  try {
    const L = limit(multiply(caddr(F), logarithm(cadr(F))), X, A, sides);
    if (L === symbol(INF)) {
      return L;
    }
    return isInfinite(L) ? Constants.zero : exponential(L);
  } catch (e) {
    return undefined;
  }
}

// bounded on the whole real line
function isBounded(f: U, X: U): boolean {
  if (!iscons(f) || !Find(f, X)) {
    return !Find(f, X);
  }
  const head = car(f);
  if ([SIN, COS, SGN, ARCTAN, TANH, ERF].some((name) => head === symbol(name))) {
    return true;
  }
  if (head === symbol(MOD)) {
    return !Find(caddr(f), X);
  }
  if (isJumpFunction(head) || isadd(f) || ismultiply(f)) {
    return f.tail().every((q) => isBounded(q, X));
  }
  return ispower(f) && isposint(caddr(f)) && isBounded(cadr(f), X);
}

// bounded factors times a rest that goes to 0: sin(x)/x at inf, x*sin(1/x)
// at 0. Among bounded factors alone one that goes to 0 is enough:
// sin(x)*sin(1/x) at 0.
function squeeze(F: U, X: U, A: U, sides: number[]): U | undefined {
  const factors = ismultiply(F) ? F.tail() : [F];
  const bounded = factors.filter((f) => Find(f, X) && isBounded(f, X));
  if (bounded.length === 0) {
    return undefined;
  }
  const goesToZero = (f: U): boolean => {
    try {
      return isZeroAtomOrTensor(limit(f, X, A, sides));
    } catch (e) {
      return false;
    }
  };
  const rest = factors.filter((f) => !bounded.includes(f));
  const squeezed = rest.some((f) => Find(f, X))
    ? goesToZero(multiply_all(rest))
    : bounded.length > 1 && bounded.some(goesToZero);
  return squeezed ? Constants.zero : undefined;
}

// inf-inf between logarithms: log(a)-log(b) is log(a/b), for a and b of the
// same sign; with a positive limit of a/b that was the case.
function combineLogs(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (!isadd(F)) {
    return undefined;
  }
  // [n, g] of a term n*log(g) with a rational n
  const logPart = (t: U): [U, U] | undefined => {
    if (car(t) === symbol(LOG)) {
      return [Constants.one, cadr(t)];
    }
    const isScaled =
      ismultiply(t) && t.tail().length === 2 && isrational(cadr(t)) && car(caddr(t)) === symbol(LOG);
    return isScaled ? [cadr(t), cadr(caddr(t))] : undefined;
  };
  const logs = F.tail().filter((t) => Find(t, X) && logPart(t) !== undefined);
  if (logs.length < 2) {
    return undefined;
  }
  // 1/5*log(a)+1/5*log(b), the antiderivative of 1/(2+tan(x)): the common
  // denominator d stays outside, the powers inside are integers
  const d = logs.map((t) => denominator(logPart(t)[0])).reduce(lcm, Constants.one);
  try {
    const inside = multiply_all(
      logs.map((t) => power(logPart(t)[1], multiply(logPart(t)[0], d)))
    );
    const rest = F.tail().filter((t) => !logs.includes(t)).reduce(add, Constants.zero);
    const L = limit(inside, X, A, sides);
    const R = limit(rest, X, A, sides);
    if (Find(R, symbol(INF))) {
      return undefined;
    }
    if (L === symbol(INF) || isZeroAtomOrTensor(L)) {
      return L === symbol(INF) ? L : negate(symbol(INF));
    }
    return isPositive(L) === true ? add(divide(logarithm(L), d), R) : undefined;
  } catch (e) {
    return undefined;
  }
}

// bounded terms plus a rest that goes to +-inf: sin(x)+x
function boundedPlusInfinite(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (!isadd(F)) {
    return undefined;
  }
  const rest = F.tail().filter((t) => !isBounded(t, X));
  if (rest.length === 0 || rest.length === F.tail().length) {
    return undefined;
  }
  try {
    const L = limit(rest.reduce(add, Constants.zero), X, A, sides);
    return isInfinite(L) ? L : undefined;
  } catch (e) {
    return undefined;
  }
}

// N/D at +-inf with a sum D: both divided by a term of D, so that the
// bounded and the smaller terms go to 0: (x+sin(x))/(x+cos(x)) by x
function leadingTerm(F: U, X: U, A: U, sides: number[]): U | undefined {
  const N = numerator(F);
  const D = denominator(F);
  if (!isInfinite(A) || !isadd(D) || D.tail().length > 4) {
    return undefined;
  }
  for (const T of D.tail().filter((t) => Find(t, X))) {
    try {
      const d = limit(divide(D, T), X, A, sides);
      if (Find(d, symbol(INF)) || isZeroAtomOrTensor(d)) {
        continue;
      }
      const q = signedInf(divide(limit(divide(N, T), X, A, sides), d));
      if (!Find(q, symbol(INF)) || isInfinite(q)) {
        return q;
      }
    } catch (e) {
      // the next term
    }
  }
  return undefined;
}

// a product of powers c^g with constant bases c > 0 is exp(sum of g*log(c)):
// 2^x/3^x at inf, where L'Hopital only reproduces the quotient
function expProduct(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (!ismultiply(F)) {
    return undefined;
  }
  const withX = F.tail().filter((f) => Find(f, X));
  const isExp = (f: U) =>
    ispower(f) &&
    !Find(cadr(f), X) &&
    (cadr(f) === symbol(E) || isPositive(cadr(f)) === true);
  if (withX.length < 2 || !withX.every(isExp)) {
    return undefined;
  }
  try {
    const exponent = withX
      .map((f) => multiply(caddr(f), logarithm(cadr(f))))
      .reduce(add, Constants.zero);
    const L = limit(Condense(exponent), X, A, sides);
    const rest = multiply_all(F.tail().filter((f) => !Find(f, X)));
    if (!isInfinite(L)) {
      return multiply(rest, exponential(L));
    }
    const r = L === symbol(INF) ? signedInf(multiply(rest, L)) : Constants.zero;
    return Find(r, symbol(INF)) && !isInfinite(r) ? undefined : r;
  } catch (e) {
    return undefined;
  }
}

// F(K(x)) with x only inside one function K: the limit of F(y) at the
// limit of K. exp(-tan(x))*tan(x) left of pi/2 is y*exp(-y) at inf.
function viaKernel(F: U, X: U, A: U, sides: number[]): U | undefined {
  const kernels: U[] = [];
  const collect = (p: U) => {
    if (!iscons(p) || !Find(p, X)) {
      return;
    }
    if (p !== F && !isadd(p) && !ismultiply(p) && !ispower(p)) {
      kernels.push(p);
    }
    p.tail().forEach(collect);
  };
  collect(F);
  const y = usr_symbol('limit_y');
  for (const K of kernels.slice(0, 3)) {
    const G = subst(F, K, y);
    if (Find(G, X)) {
      continue;
    }
    try {
      return limit(Eval(G), y, limit(K, X, A, sides));
    } catch (e) {
      // the next kernel
    }
  }
  return undefined;
}

// One round of L'Hopital at infinity with everything else behind it:
// log(2^x+3^x)/x becomes (2^x*log(2)+3^x*log(3))/(2^x+3^x), which L'Hopital
// only reproduces and leadingTerm resolves. Not nested.
let lhopitalOnceRunning = false;
function lhopitalOnce(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (lhopitalOnceRunning || !isInfinite(A) || hasJump(F, X)) {
    return undefined;
  }
  const sign = A === symbol(INF) ? Constants.one : Constants.negOne;
  const N = numerator(F);
  const D = denominator(F);
  lhopitalOnceRunning = true;
  try {
    const both = (test: (v: U) => boolean) =>
      [N, D].every((p) => {
        const v = withSign(X, isnegativenumber(sign) ? 'negative' : 'positive', () =>
          atInfinity(p, X, sign)
        );
        return v !== undefined && test(v);
      });
    if (!both(isInfinite) && !both(isZeroAtomOrTensor)) {
      return undefined;
    }
    return limit(divide(derivative(N, X), derivative(D, X)), X, A, sides);
  } catch (e) {
    return undefined;
  } finally {
    lhopitalOnceRunning = false;
  }
}

// guards invert() against the way back: limitAtInfinity puts x = 1/t
let inverting = false;

// One side of a finite point as a limit at infinity, x = A +- 1/u: there
// the values 0 and inf of the parts are known (at the point they are only
// "division by zero"), and exp(-1/x)/x^3 becomes u^3/exp(u).
function invert(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (inverting || isInfinite(A) || sides.length !== 1) {
    return undefined;
  }
  inverting = true;
  try {
    return withSign(X, 'positive', () => {
      const G = Eval(subst(F, X, add(A, divide(integer(sides[0]), X))));
      // log(x) left of 0 is not real
      if (Find(G, Constants.imaginaryunit)) {
        return undefined;
      }
      return limit(G, X, symbol(INF));
    });
  } catch (e) {
    return undefined;
  } finally {
    inverting = false;
  }
}

// the sum of the limits of the expanded terms, when each one exists
function termwise(F: U, X: U, A: U, sides: number[]): U | undefined {
  const expanded = yyexpand(F);
  if (!isadd(expanded)) {
    return undefined;
  }
  try {
    const parts = expanded.tail().map((t) => limit(t, X, A, sides));
    const infinite = parts.filter(isInfinite);
    if (infinite.some((p) => !equal(p, infinite[0]))) {
      return undefined; // inf - inf
    }
    return infinite.length > 0 ? infinite[0] : parts.reduce(add, Constants.zero);
  } catch (e) {
    return undefined;
  }
}

// the product of the limits of the factors, when all are finite
function factorwise(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (!ismultiply(F)) {
    return undefined;
  }
  try {
    const parts = F.tail().map((f) => (Find(f, X) ? limit(f, X, A, sides) : f));
    return parts.some((p) => Find(p, symbol(INF))) ? undefined : multiply_all(parts);
  } catch (e) {
    return undefined;
  }
}

// f(g(x)) for a function f of one argument: f at the limit of g, itself
// taken as a limit so that log(0), arctan(inf) and the like are resolved
// The same for a power with X only in the base or only in the exponent.
function compose(F: U, X: U, A: U, sides: number[]): U | undefined {
  if (!iscons(F) || !issymbol(car(F))) {
    return undefined;
  }
  const args = F.tail();
  const withX = args.filter((a) => Find(a, X));
  if (withX.length !== 1 || (args.length !== 1 && !ispower(F))) {
    return undefined;
  }
  try {
    const inner = limit(withX[0], X, A, sides);
    if (Find(inner, X) || equal(inner, withX[0])) {
      return undefined;
    }
    const y = usr_symbol('limit_y');
    const outer = makeList(car(F), ...args.map((a) => (a === withX[0] ? y : a)));
    return limitCore(outer, y, inner, [-1, 1]);
  } catch (e) {
    return undefined;
  }
}

function limitCore(F: U, X: U, A: U, sides: number[]): U {
  if (A === symbol(INF)) {
    return limitAtInfinity(F, X, Constants.one);
  }
  if (equal(A, negate(symbol(INF)))) {
    return limitAtInfinity(F, X, Constants.negOne);
  }
  return limitAt(F, X, A, sides);
}

// x -> +-inf becomes t -> 0 from the right with x = +-1/t (X is reused as t).
// Numerator and denominator are rationalized separately so the powers of t
// cancel; rationalizing the whole quotient leaves nested fractions behind.
// Near +inf, x is positive (near -inf negative), and t -> 0 from the right
// is positive: rules like log(1/t) = -log(t) need to know that.
function limitAtInfinity(F: U, X: U, sign: U): U {
  const near = isnegativenumber(sign) ? 'negative' : 'positive';
  return withSign(X, near, () => {
    const direct = atInfinity(F, X, sign);
    if (direct !== undefined) {
      return direct;
    }
    const lhopital = lhopitalAtInfinity(F, X, sign);
    if (lhopital !== undefined) {
      return lhopital;
    }
    return withSign(X, 'positive', () => {
      const at = (p: U) =>
        rationalize(splitRadicals(Eval(subst(p, X, divide(sign, X))), X));
      const G = divide(at(numerator(F)), at(denominator(F)));
      return limitAt(G, X, Constants.zero, [1]);
    });
  });
}

// (N/t^2)^(1/2) = N^(1/2)/t for t > 0: the radicand is put over one
// denominator, then the power splits over its positive factors
function splitRadicals(p: U, X: U): U {
  if (!iscons(p) || !Find(p, X)) {
    return p;
  }
  if (ispower(p) && isrational(caddr(p)) && !isinteger(caddr(p))) {
    // the denominator t^2 > 0 leaves the root whatever the sign of the
    // numerator: ((1-t^2)/t^2)^(1/2) = (1-t^2)^(1/2)/t
    const R = rationalize(splitRadicals(cadr(p), X));
    const d = denominator(R);
    return isPositive(d) === true
      ? divide(power(numerator(R), caddr(p)), power(d, caddr(p)))
      : power(R, caddr(p));
  }
  return Eval(makeList(car(p), ...p.tail().map((q) => splitRadicals(q, X))));
}

const isInfinite = (p: U) =>
  p === symbol(INF) || equal(p, negate(symbol(INF)));

// F at x = +-inf: substituted, with the functions that have a value at
// +-inf replaced by it. Returns undefined for an indeterminate form or when
// something of inf is left over (sin(inf) has no value).
function atInfinity(F: U, X: U, sign: U): U | undefined {
  try {
    // not evaluated as a whole first: that would turn (1+1/inf)^inf into 1
    const v = resolveInf(subst(F, X, multiply(sign, symbol(INF))));
    // log(1/inf) = log(0): the evaluator does not know that it is -inf
    if (hasPole(v)) {
      return undefined;
    }
    if (!Find(v, symbol(INF)) || isInfinite(v)) {
      return v;
    }
    // +-inf plus real terms without inf: in a limit the other symbols are
    // constants, so those terms are finite (log(a)+inf is inf for a > 0)
    if (isadd(v)) {
      const infinite = v.tail().filter(isInfinite);
      const rest = v.tail().filter((t) => !isInfinite(t));
      if (
        infinite.length === 1 &&
        rest.every((t) => !Find(t, symbol(INF)) && isReal(t) === true)
      ) {
        return infinite[0];
      }
    }
    // inf times a nonzero constant, e.g. inf*pi
    const f = zzfloat(v);
    if (isInfinite(f)) {
      return f;
    }
    if (isdouble(f) && Math.abs(f.d) === Infinity) {
      return f.d > 0 ? symbol(INF) : negate(symbol(INF));
    }
  } catch (e) {
    // indeterminate form, e.g. inf-inf or 0*inf
  }
  return undefined;
}

// Bottom-up: exp(-inf) = 0, 2^inf = inf, arctan(inf) = pi/2, erf(-inf) = -1,
// log(inf) = inf, ... Indeterminate forms stop (caught by the caller):
// arithmetic ones in Eval, the powers 1^inf, inf^0 and 0^0 here, since
// Eval would give 1 for them.
function resolveInf(p: U): U {
  if (!iscons(p)) {
    return p;
  }
  const head = car(p);
  const args = p.tail().map(resolveInf);
  // something of inf without a value (sin(inf)) could be anything, even
  // infinite: 0*sin(inf) or abs(inf)/inf must not evaluate to 0
  if (args.some((a) => Find(a, symbol(INF)) && !isInfinite(a))) {
    stop('limit: no value at inf');
  }
  const inf = symbol(INF);
  const [arg, exponent] = args;
  if (head === symbol(POWER)) {
    if (
      (isInfinite(exponent) && isplusone(arg)) ||
      (isZeroAtomOrTensor(exponent) &&
        (isInfinite(arg) || isZeroAtomOrTensor(arg)))
    ) {
      stop('limit: indeterminate power');
    }
    // inf^a for a of known sign
    if (arg === inf && !Find(exponent, inf)) {
      const e = facts(exponent);
      if (e.positive || e.negative) {
        return e.positive ? inf : Constants.zero;
      }
    }
    if (isInfinite(exponent)) {
      const base = arg === symbol(E) ? double(Math.E) : zzfloat(arg);
      if (isdouble(base) && base.d > 0) {
        return (base.d > 1) === (exponent === inf) ? inf : Constants.zero;
      }
    }
  }
  // A jump function whose argument arrives at the jump: sgn(1/inf) is not
  // sgn(0) = 0, 1/x comes from above. limitAt decides it beside the point.
  if (isJumpFunction(head) && head !== symbol(ABS) && Find(cadr(p), inf) && !isInfinite(arg)) {
    const atJump =
      head === symbol(MOD) ||
      (head === symbol(SGN)
        ? isZeroAtomOrTensor(arg)
        : isinteger(head === symbol(ROUND) ? add(arg, rational(1, 2)) : arg));
    if (atJump) {
      stop('limit: jump function at its jump');
    }
  }
  // before Eval, which would turn arctan(-inf) into -arctan(inf)
  if (args.length === 1 && isInfinite(arg)) {
    const s = arg === inf ? Constants.one : Constants.negOne;
    switch (head) {
      case symbol(ARCTAN):
        return multiply(s, divide(Constants.Pi(), integer(2)));
      case symbol(TANH):
      case symbol(ERF):
      case symbol(SGN):
        return s;
      case symbol(ERFC):
        return arg === inf ? Constants.zero : integer(2);
      case symbol(SINH):
        return arg;
      case symbol(COSH):
      case symbol(ABS):
        return inf;
      case symbol(LOG):
        if (arg === inf) {
          return inf;
        }
    }
    // Si(+-inf) = +-pi/2, the Fresnel integrals +-1/2, Ci(inf) = 0,
    // Ei(inf) = inf, Ei(-inf) = 0
    switch (issymbol(head) ? head.printname : '') {
      case 'Si':
        return multiply(s, divide(Constants.Pi(), integer(2)));
      case 'fresnels':
      case 'fresnelc':
        return multiply(s, rational(1, 2));
      case 'Ci':
        if (arg === inf) {
          return Constants.zero;
        }
        break;
      case 'Ei':
        return arg === inf ? inf : Constants.zero;
    }
  }
  return signedInf(Eval(makeList(head, ...args)));
}

// c*inf is inf or -inf when the sign of c is known (a*inf with a > 0,
// inf/a, pi*inf); otherwise it is left as it is
function signedInf(p: U): U {
  if (!ismultiply(p)) {
    return p;
  }
  const factors = p.tail();
  const rest = factors.filter((f) => f !== symbol(INF));
  if (rest.length !== factors.length - 1 || rest.some((f) => Find(f, symbol(INF)))) {
    return p;
  }
  const c = facts(multiply_all(rest));
  return c.positive ? symbol(INF) : c.negative ? negate(symbol(INF)) : p;
}

// The exponential beats every power: x^10/exp(x) needs 10 rounds, each one
// lowers the degree of the polynomial part.
function lhopitalBudget(parts: U[], X: U): number {
  const deg = (p: U) => (ispolyexpandedform(p, X) ? nativeInt(degree(p, X)) || 0 : 0);
  return Math.min(parts.map(deg).reduce((a, b) => a + b, MAX_LHOPITAL_ITERATIONS), 30);
}

// The value of a part of F at the point: 0, finite, inf or -inf (the sign
// of an infinity is not always known, see limitAt), undefined for none.
// `proper` says that the part is smaller than F, so that it may be given to
// limit() without coming back here with the same question.
type ValueOf = (part: U, proper: boolean) => U | undefined;

// L'Hopital for 0/0 and inf/inf; undefined when it does not come to a
// result. A product 0*inf is tried with its zero factors, then with its
// infinite factors, as the denominator: x*exp(x) at -inf is x/exp(-x),
// x*(pi/2-arctan(x)) is (pi/2-arctan(x))/(1/x). `infinite` is asked for the
// result when the numerator alone is infinite or the denominator alone 0.
function lhopital(
  F: U,
  X: U,
  valueOf: ValueOf,
  infinite: (n: U, d: U, D: U) => U | undefined,
  steps?: { left: number }
): U | undefined {
  if (hasJump(F, X)) {
    return undefined;
  }
  const splits: [U, U][] = [[numerator(F), denominator(F)]];
  const P = isadd(F) ? Condense(F) : F;
  const factors = ismultiply(P) ? P.tail() : [];
  // only the first round asks limit() for the value of a part: every round
  // of every split doing so would not end
  const top = steps === undefined;
  const values = factors.map((f) => valueOf(f, top));
  const going = (test: (v: U) => boolean) =>
    factors.filter((f, i) => values[i] !== undefined && test(values[i]));
  const zero = going(isZeroAtomOrTensor);
  const infiniteFactors = going(isInfinite);
  if (zero.length > 0 && infiniteFactors.length > 0) {
    for (const part of [zero, infiniteFactors]) {
      const d = multiply_all(part);
      splits.push([divide(P, d), inverse(d)]);
    }
  }
  // derivatives in total, over all splits: each round has up to three
  if (steps === undefined) {
    steps = { left: lhopitalBudget([...splits[0], ...factors], X) };
  }
  for (const [N, D] of splits) {
    const n = valueOf(N, top && Find(D, X));
    const d = valueOf(D, top && Find(N, X));
    if (n === undefined || d === undefined) {
      continue;
    }
    const bothZero = isZeroAtomOrTensor(n) && isZeroAtomOrTensor(d);
    if (!bothZero && !(isInfinite(n) && isInfinite(d))) {
      if (isInfinite(d)) {
        return Constants.zero;
      }
      const r = isInfinite(n) || isZeroAtomOrTensor(d) ? infinite(n, d, D) : divide(n, d);
      if (r !== undefined) {
        return r;
      }
      continue;
    }
    if (steps.left-- <= 0) {
      return undefined;
    }
    // the quotient of the derivatives is normalized before it is taken
    // apart again: 2*x/(x^2+1) / (1/x) is 2*x^2/(x^2+1); nested fractions
    // like 1/(x*(2*x/(x^3+x^2)+3*x^2/(x^3+x^2))) need more
    let G = divide(derivative(N, X), derivative(D, X));
    if ([numerator(G), denominator(G)].some((part) => valueOf(part, false) === undefined)) {
      G = divide(rationalize(numerator(G)), rationalize(denominator(G)));
    }
    const r = lhopital(G, X, valueOf, infinite, steps);
    if (r !== undefined) {
      return r;
    }
  }
  return undefined;
}

function lhopitalAtInfinity(F: U, X: U, sign: U): U | undefined {
  const A = multiply(sign, symbol(INF));
  const valueOf: ValueOf = (part, proper) => {
    const v = atInfinity(part, X, sign);
    return v !== undefined || !proper ? v : finiteOrInfinite(() => limit(part, X, A));
  };
  return lhopital(F, X, valueOf, (n, d, D) => {
    if (!isZeroAtomOrTensor(d)) {
      return signedInf(divide(n, d));
    }
    // n/0: the side from which D comes to 0 is known for exp(x) at -inf
    const side = facts(D);
    if (isZeroAtomOrTensor(n) || !(side.positive || side.negative)) {
      return undefined;
    }
    const q = signedInf(multiply(side.positive ? n : negate(n), symbol(INF)));
    return isInfinite(q) ? q : undefined;
  });
}

// The limit of a part of F for lhopital, or undefined for none and for
// something like inf/a. Not nested: a part of a part is only substituted,
// otherwise every round of every L'Hopital would start new ones.
let probing = false;
function finiteOrInfinite(f: () => U): U | undefined {
  if (probing) {
    return undefined;
  }
  probing = true;
  try {
    const L = f();
    return Find(L, symbol(INF)) && !isInfinite(L) ? undefined : L;
  } catch (e) {
    return undefined;
  } finally {
    probing = false;
  }
}

// An infinite limit: the sign of F just beside A, on each requested side.
// ponytail: numeric probe at a fixed relative distance, needs a numeric A;
// a symbolic sign analysis would lift both restrictions
function infiniteLimit(F: U, X: U, A: U, sides: number[]): U {
  const a = zzfloat(A);
  if (!isdouble(a)) {
    stop(VANISHING_DENOMINATOR);
  }
  const eps = 1e-6 * Math.max(1, Math.abs(a.d));
  const positive = sides.map((side) => {
    const v = zzfloat(subst(F, X, double(a.d + side * eps)));
    // symbolic: the sign may be known from the assumptions (a/x, a > 0)
    const known = isdouble(v) ? undefined : facts(v);
    if (known?.positive || known?.negative) {
      return known.positive;
    }
    if (!isdouble(v)) {
      stop(
        'limit: could not determine a real sign beside the point — try a one-sided limit'
      );
    }
    return v.d > 0;
  });
  if (positive.some((p) => p !== positive[0])) {
    stop('limit: left and right limits differ — limit does not exist');
  }
  return positive[0] ? symbol(INF) : negate(symbol(INF));
}

// not a module-level list: this file is loaded inside a circular import,
// before the names in defs are initialised
function isRounding(head: U): boolean {
  return [FLOOR, CEILING, ROUND].some((f) => head === symbol(f));
}

function isJumpFunction(head: U): boolean {
  return isRounding(head) || [SGN, ABS, MOD].some((f) => head === symbol(f));
}

// a jump function of X (abs(a) is a constant)
function hasJump(p: U, X: U): boolean {
  return (
    iscons(p) &&
    Find(p, X) &&
    (isJumpFunction(car(p)) || isPiecewise(p) || p.tail().some((q) => hasJump(q, X)))
  );
}

// floor(g), ceiling(g) and round(g) with g -> +-inf are g plus a bounded
// part, the fractional part mod(g,1): floor(g) = g - mod(g,1). Then
// floor(x)/x is 1 - mod(x,1)/x, and the squeeze argument applies. The
// exponent of (-1)^floor(x) stays as it is, see oscillating.
function unboundFloors(F: U, X: U, A: U, sides: number[]): U {
  if (![FLOOR, CEILING, ROUND].some((f) => Find(F, symbol(f)))) {
    return F;
  }
  const toInfinity = (g: U): boolean => {
    try {
      return (isInfinite(A) ? [1] : sides).every((s) => isInfinite(limit(g, X, A, [s])));
    } catch (e) {
      return false;
    }
  };
  const frac = (g: U) => makeList(symbol(MOD), g, Constants.one);
  const half = rational(1, 2);
  const walk = (p: U): U => {
    if (!iscons(p) || !Find(p, X) || (ispower(p) && isnegativenumber(cadr(p)))) {
      return p;
    }
    const head = car(p);
    if (isRounding(head) && toInfinity(cadr(p))) {
      const g = walk(cadr(p));
      return head === symbol(FLOOR)
        ? subtract(g, frac(g))
        : head === symbol(CEILING)
        ? add(g, frac(negate(g)))
        : subtract(add(g, half), frac(add(g, half)));
    }
    return makeList(head, ...p.tail().map(walk));
  };
  const G = walk(F);
  return equal(G, F) ? F : Eval(G);
}

// tan, gamma and digamma stop at their poles like 1/0, and L'Hopital has
// nothing to work with. With a pole at the point they are rewritten with
// the pole in a plain denominator: tan = sin/cos, at g = -n
// Gamma(g) = Gamma(g+n+2)/(g*(g+1)*...*(g+n+1)) (the evaluator turns
// Gamma(x+1) into x*Gamma(x) again, Gamma(x+2) it leaves alone) and
// digamma(g) = digamma(g+n+1) - 1/g - ... - 1/(g+n).
function regularizePoles(F: U, X: U, A: U): U {
  const digamma = usr_symbol('digamma');
  if (![symbol(TAN), symbol(GAMMA), digamma].some((f) => Find(F, f))) {
    return F;
  }
  const walk = (p: U): U => {
    if (!iscons(p) || !Find(p, X)) {
      return p;
    }
    const head = car(p);
    const args = p.tail().map(walk);
    const g = args[0];
    const at = args.length === 1 ? tryEvalAt(g, X, A) : INDETERMINATE;
    if (at !== INDETERMINATE) {
      if (head === symbol(TAN) && isZeroAtomOrTensor(cosine(at))) {
        return divide(sine(g), cosine(g));
      }
      const n = isinteger(at) && !isposint(at) ? -nativeInt(at) : NaN;
      const shifted = (k: number) => Eval(makeList(head, add(g, integer(k))));
      const steps = (count: number) =>
        [...Array(count).keys()].map((k) => add(g, integer(k)));
      if (head === symbol(GAMMA) && n <= 20) {
        return divide(shifted(n + 2), multiply_all(steps(n + 2)));
      }
      if (head === digamma && n <= 20) {
        return steps(n + 1).map(inverse).reduce(subtract, shifted(n + 1));
      }
    }
    return makeList(head, ...args);
  };
  const G = walk(F);
  return equal(G, F) ? F : Eval(G);
}

// sin or cos of something that goes to infinity, anywhere inside
function hasWave(p: U, X: U, A: U, side: number): boolean {
  if (!iscons(p) || !Find(p, X)) {
    return false;
  }
  if (car(p) === symbol(SIN) || car(p) === symbol(COS)) {
    try {
      if (isInfinite(limit(cadr(p), X, A, [side]))) {
        return true;
      }
    } catch (e) {
      return true;
    }
  }
  return p.tail().some((q) => hasWave(q, X, A, side));
}

// The value of g at one point beside A decides a jump function of g only
// if g settles there: it has a limit on that side (sgn(sin(x)) at inf has
// none), a finite one for floor, ceiling and round (floor(x) at inf is not
// the constant floor(1000000)), and where the limit is a jump of the
// function itself, g must come from one side (sgn(x*sin(1/x)) does not).
// mod is never decided: the evaluator's mod is the one of integers.
function probeHolds(head: U, g: U, X: U, A: U, side: number): boolean {
  let L: U;
  try {
    L = limit(g, X, A, [side]);
  } catch (e) {
    return false;
  }
  if (head === symbol(MOD)) {
    return false;
  }
  const signOnly = head === symbol(SGN) || head === symbol(ABS);
  if (Find(L, symbol(INF))) {
    return signOnly && isInfinite(L);
  }
  const atJump = signOnly
    ? isZeroAtomOrTensor(L)
    : isinteger(head === symbol(ROUND) ? add(L, rational(1, 2)) : L);
  return !atJump || !hasWave(g, X, A, side);
}

// On one side of the point a jump function is smooth: sgn(g) is a constant,
// abs(g) is g or -g, floor(g), ceiling(g) and round(g) are constants. The
// value of g just beside the point says which, see probeHolds. Nodes whose g
// cannot be evaluated numerically there (symbolic coefficients) are left as
// they are.
function resolveJumps(p: U, X: U, A: U, side: number, beside: number): U {
  if (!iscons(p) || !Find(p, X)) {
    return p;
  }
  const head = car(p);
  if (isPiecewise(p)) {
    const branch = activeBranch(p, X, double(beside));
    if (branch !== undefined) {
      return resolveJumps(branch, X, A, side, beside);
    }
  }
  if (isJumpFunction(head)) {
    const g = cadr(p);
    let v: U;
    try {
      v = zzfloat(subst(g, X, double(beside)));
    } catch (e) {
      v = g;
    }
    if (isdouble(v) && probeHolds(head, g, X, A, side)) {
      const inner = resolveJumps(g, X, A, side, beside);
      switch (head) {
        case symbol(SGN):
          return integer(Math.sign(v.d));
        case symbol(ABS):
          return v.d < 0 ? negate(inner) : inner;
        case symbol(FLOOR):
          return integer(Math.floor(v.d));
        case symbol(ROUND):
          return integer(Math.round(v.d));
        default:
          return integer(Math.ceil(v.d));
      }
    }
  }
  return makeList(head, ...p.tail().map((q) => resolveJumps(q, X, A, side, beside)));
}

// With jump functions present the value at the point says nothing about the
// limit, and L'Hopital does not apply. Each side is solved on its own, with
// the jumps resolved for that side, and the sides must agree. Returns
// undefined for a symbolic point; jumps that could not be resolved stop.
function limitWithJumps(F: U, X: U, A: U, sides: number[]): U | undefined {
  const a = zzfloat(A);
  if (!isdouble(a)) {
    return undefined;
  }
  const eps = 1e-6 * Math.max(1, Math.abs(a.d));
  const results: U[] = [];
  for (const side of sides) {
    const smooth = Eval(resolveJumps(F, X, A, side, a.d + side * eps));
    if (hasJump(smooth, X)) {
      stop('limit: could not resolve a jump function');
    }
    results.push(limit(smooth, X, A, [side]));
  }
  if (results.some((r) => !equal(r, results[0]))) {
    stop('limit: left and right limits differ — limit does not exist');
  }
  return results[0];
}

// sides: -1 for the left of A, 1 for the right
function limitAt(F: U, X: U, A: U, sides: number[]): U {
  F = regularizePoles(F, X, A);
  if (hasJump(F, X)) {
    const resolved = limitWithJumps(F, X, A, sides);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  let result = tryEvalAt(F, X, A);
  if (result !== INDETERMINATE) {
    if (!hasPole(result)) {
      return result;
    }
    if (isInfiniteAtPole(result)) {
      return infiniteLimit(F, X, A, sides);
    }
    // sin(log(0)), arctan(log(0)), 1/log(0): the fallbacks of limit() go on
    stop('limit: could not resolve a pole inside a function');
  }

  const simplified = simplify(F);
  result = tryEvalAt(simplified, X, A);
  if (result !== INDETERMINATE && !hasPole(result)) {
    return result;
  }

  // A part that cannot be substituted may still have a limit of its own:
  // log(sin(x)/x) in log(sin(x)/x)/x^2. log(0) counts as an infinity, of
  // unknown sign: log(0)/log(0) is inf/inf, not 1.
  const valueOf: ValueOf = (part, proper) => {
    const v = tryEvalAt(part, X, A);
    if (v !== INDETERMINATE) {
      return !hasPole(v) ? v : isInfiniteAtPole(v) ? symbol(INF) : undefined;
    }
    return proper ? finiteOrInfinite(() => limit(part, X, A, sides)) : undefined;
  };
  // no L'Hopital through a jump function (at a symbolic point): lhopital
  const viaLhopital = lhopital(F, X, valueOf, () => infiniteLimit(F, X, A, sides));
  if (viaLhopital !== undefined) {
    return viaLhopital;
  }

  stop("limit: could not resolve after repeated L'Hopital iterations");
}
