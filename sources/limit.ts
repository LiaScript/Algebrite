import {
  ABS,
  caddddr,
  cadddr,
  caddr,
  cadr,
  car,
  CEILING,
  Constants,
  FLOOR,
  INF,
  iscons,
  isdouble,
  isNumericAtom,
  LOG,
  NIL,
  SGN,
  TAN,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { double, integer } from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { derivative } from './derivative';
import { denominator } from './denominator';
import { zzfloat } from './float';
import { isnegativenumber, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { equal } from './misc';
import { divide, negate } from './multiply';
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

// limit(expr, x, point): direct substitution, simplify-then-substitute, and
// a bounded L'Hopital fallback for 0/0 forms. The point may be inf or -inf,
// and the result may be inf or -inf. There is no direction argument, so
// user-facing one-sided limits and multivariable limits are out of scope.
export function Eval_limit(p1: U) {
  const F = Eval(cadr(p1));
  const X = Eval(caddr(p1));
  const A = Eval(cadddr(p1));

  // optional 4th arg: a positive number for the limit from the right,
  // a negative one for the limit from the left
  let sides = [-1, 1];
  if (caddddr(p1) !== symbol(NIL)) {
    const direction = Eval(caddddr(p1));
    if (!isNumericAtom(direction) || isZeroAtomOrTensor(direction)) {
      stop('limit: 4th argument must be a positive or negative number');
    }
    sides = [isnegativenumber(direction) ? -1 : 1];
  }
  return limit(F, X, A, sides);
}

const VANISHING_DENOMINATOR =
  'limit: denominator vanishes while numerator does not — limit is infinite or does not exist';

export function limit(F: U, X: U, A: U, sides: number[] = [-1, 1]): U {
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
function limitAtInfinity(F: U, X: U, sign: U): U {
  const at = (p: U) => rationalize(Eval(subst(p, X, divide(sign, X))));
  const G = divide(at(numerator(F)), at(denominator(F)));
  return limitAt(G, X, Constants.zero, [1]);
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
  return iscons(p) && (isJumpFunction(car(p)) || p.tail().some(hasJump));
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
    return hasPole(result) ? infiniteLimit(F, X, A, sides) : result;
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

    N = derivative(N, X);
    D = derivative(D, X);
  }

  stop("limit: could not resolve after repeated L'Hopital iterations");
}
