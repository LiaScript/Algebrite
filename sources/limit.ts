import {
  ABS,
  ARCTAN,
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
  INF,
  iscons,
  isdouble,
  ismultiply,
  isNumericAtom,
  ispower,
  isrational,
  issymbol,
  LOG,
  NIL,
  POWER,
  SGN,
  SIN,
  SINH,
  TAN,
  TANH,
  U,
  isadd,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { facts, isNonzero, isReal, withSign } from './assume';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { double, integer, rational } from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { derivative } from './derivative';
import { denominator } from './denominator';
import { zzfloat } from './float';
import {
  isinteger,
  isnegativenumber,
  isplusone,
  isposint,
  ispositivenumber,
  isZeroAtomOrTensor
} from './is';
import { add } from './add';
import { logarithm } from './log';
import { activeBranch, hasPiecewise, isPiecewise, resolvePiecewise } from './piecewise';
import { power } from './power';
import { makeList } from './list';
import { checkArgCount, equal, exponential, yyexpand } from './misc';
import { divide, multiply, multiply_all, negate } from './multiply';
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
    return Eval(subst(expr, X, A));
  } catch (e) {
    return INDETERMINATE;
  }
}

// tan and log do not stop at their poles, they come back unevaluated as
// tan(1/2*pi) or log(0); substitution then looks like it succeeded.
function hasPole(p: U): boolean {
  if (!iscons(p)) {
    return false;
  }
  if (car(p) === symbol(TAN) && isZeroAtomOrTensor(cosine(cadr(p)))) {
    return true;
  }
  if (car(p) === symbol(LOG) && isZeroAtomOrTensor(cadr(p))) {
    return true;
  }
  return p.tail().some(hasPole);
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

export function limit(F: U, X: U, A: U, sides: number[] = [-1, 1]): U {
  if (isInfinite(A) && hasPiecewise(F)) {
    // ponytail: the branch at +-1e9 is taken for the one near +-inf
    const G = resolvePiecewise(F, X, double(A === symbol(INF) ? 1e9 : -1e9));
    F = G === undefined ? F : Eval(G);
  }
  const viaExp = powerLimit(F, X, A, sides);
  if (viaExp !== undefined) {
    return viaExp;
  }
  try {
    return limitCore(F, X, A, sides);
  } catch (e) {
    const r =
      squeeze(F, X, A, sides) ||
      termwise(F, X, A, sides) ||
      factorwise(F, X, A, sides) ||
      compose(F, X, A, sides);
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
    if (car(f) === symbol(SIN) || car(f) === symbol(COS)) {
      const g = Find(cadr(f), X) && !hasJump(cadr(f)) && limitOf(cadr(f), side);
      return g && isInfinite(g) ? f : undefined;
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

// a bounded factor (sin, cos or a positive power of one) times a rest that
// goes to 0: sin(x)/x at inf, x*sin(1/x) at 0
function squeeze(F: U, X: U, A: U, sides: number[]): U | undefined {
  const factors = ismultiply(F) ? F.tail() : [F];
  const isBounded = (f: U): boolean =>
    (car(f) === symbol(SIN) || car(f) === symbol(COS)) ||
    (ispower(f) && isposint(caddr(f)) && isBounded(cadr(f)));
  const bounded = factors.filter((f) => Find(f, X) && isBounded(f));
  if (bounded.length === 0 || bounded.length === factors.length) {
    return undefined;
  }
  try {
    const rest = multiply_all(factors.filter((f) => !bounded.includes(f)));
    return isZeroAtomOrTensor(limit(rest, X, A, sides)) ? Constants.zero : undefined;
  } catch (e) {
    return undefined;
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
    return power(rationalize(splitRadicals(cadr(p), X)), caddr(p));
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

// L'Hopital directly in x for inf/inf and 0/0 at infinity (x*exp(-x) is
// x/exp(x)); undefined when it does not come to a result.
function lhopitalAtInfinity(F: U, X: U, sign: U): U | undefined {
  let N = numerator(F);
  let D = denominator(F);
  for (let i = 0; i < MAX_LHOPITAL_ITERATIONS; i++) {
    const n = atInfinity(N, X, sign);
    const d = atInfinity(D, X, sign);
    if (n === undefined || d === undefined) {
      return undefined;
    }
    const bothZero = isZeroAtomOrTensor(n) && isZeroAtomOrTensor(d);
    if (!bothZero && !(isInfinite(n) && isInfinite(d))) {
      return isZeroAtomOrTensor(d) ? undefined : divide(n, d);
    }
    // the quotient of the derivatives is normalized before it is taken
    // apart again: 2*x/(x^2+1) / (1/x) is 2*x^2/(x^2+1)
    const G = divide(derivative(N, X), derivative(D, X));
    N = numerator(G);
    D = denominator(G);
  }
  return undefined;
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
function isJumpFunction(head: U): boolean {
  return [SGN, ABS, FLOOR, CEILING].some((f) => head === symbol(f));
}

function hasJump(p: U): boolean {
  return iscons(p) && (isJumpFunction(car(p)) || isPiecewise(p) || p.tail().some(hasJump));
}

// On one side of the point a jump function is smooth: sgn(g) is a constant,
// abs(g) is g or -g, floor(g) and ceiling(g) are constants. The value of g
// just beside the point says which. Nodes whose g cannot be evaluated
// numerically there (symbolic coefficients) are left as they are.
function resolveJumps(p: U, X: U, beside: number): U {
  if (!iscons(p)) {
    return p;
  }
  const head = car(p);
  if (isPiecewise(p)) {
    const branch = activeBranch(p, X, double(beside));
    if (branch !== undefined) {
      return resolveJumps(branch, X, beside);
    }
  }
  if (isJumpFunction(head)) {
    const g = cadr(p);
    const v = zzfloat(subst(g, X, double(beside)));
    if (isdouble(v)) {
      const inner = resolveJumps(g, X, beside);
      switch (head) {
        case symbol(SGN):
          return integer(Math.sign(v.d));
        case symbol(ABS):
          return v.d < 0 ? negate(inner) : inner;
        case symbol(FLOOR):
          return integer(Math.floor(v.d));
        default:
          return integer(Math.ceil(v.d));
      }
    }
  }
  return makeList(head, ...p.tail().map((q) => resolveJumps(q, X, beside)));
}

// With jump functions present the value at the point says nothing about the
// limit, and L'Hopital does not apply. Each side is solved on its own, with
// the jumps resolved for that side, and the sides must agree. Returns
// undefined when the jumps could not all be resolved.
function limitWithJumps(F: U, X: U, A: U, sides: number[]): U | undefined {
  const a = zzfloat(A);
  if (!isdouble(a)) {
    return undefined;
  }
  const eps = 1e-6 * Math.max(1, Math.abs(a.d));
  const results: U[] = [];
  for (const side of sides) {
    const smooth = Eval(resolveJumps(F, X, a.d + side * eps));
    if (hasJump(smooth)) {
      return undefined;
    }
    results.push(limitAt(smooth, X, A, [side]));
  }
  if (results.some((r) => !equal(r, results[0]))) {
    stop('limit: left and right limits differ — limit does not exist');
  }
  return results[0];
}

// sides: -1 for the left of A, 1 for the right
function limitAt(F: U, X: U, A: U, sides: number[]): U {
  if (hasJump(F)) {
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
  if (result !== INDETERMINATE) {
    return result;
  }

  let N = numerator(F);
  let D = denominator(F);
  for (let i = 0; i < MAX_LHOPITAL_ITERATIONS; i++) {
    const nAtA = tryEvalAt(N, X, A);
    const dAtA = tryEvalAt(D, X, A);

    // L'Hopital is only valid for 0/0: if either part cannot be evaluated
    // at A, differentiating on would produce a wrong answer
    if (nAtA === INDETERMINATE || dAtA === INDETERMINATE) {
      break;
    }
    if (!isZeroAtomOrTensor(dAtA)) {
      return divide(nAtA, dAtA);
    }
    if (!isZeroAtomOrTensor(nAtA)) {
      return infiniteLimit(F, X, A, sides);
    }

    const G = divide(derivative(N, X), derivative(D, X));
    N = numerator(G);
    D = denominator(G);
  }

  stop("limit: could not resolve after repeated L'Hopital iterations");
}
