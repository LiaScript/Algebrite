import {
  cadddr,
  caddr,
  cadr,
  Constants,
  INF,
  isdouble,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { double } from './bignum';
import { Eval } from './eval';
import { derivative } from './derivative';
import { denominator } from './denominator';
import { zzfloat } from './float';
import { isZeroAtomOrTensor } from './is';
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

// limit(expr, x, point): direct substitution, simplify-then-substitute, and
// a bounded L'Hopital fallback for 0/0 forms. The point may be inf or -inf,
// and the result may be inf or -inf. There is no direction argument, so
// user-facing one-sided limits and multivariable limits are out of scope.
export function Eval_limit(p1: U) {
  const F = Eval(cadr(p1));
  const X = Eval(caddr(p1));
  const A = Eval(cadddr(p1));
  return limit(F, X, A);
}

const VANISHING_DENOMINATOR =
  'limit: denominator vanishes while numerator does not — limit is infinite or does not exist';

export function limit(F: U, X: U, A: U): U {
  if (A === symbol(INF)) {
    return limitAtInfinity(F, X, Constants.one);
  }
  if (equal(A, negate(symbol(INF)))) {
    return limitAtInfinity(F, X, Constants.negOne);
  }
  return limitAt(F, X, A, [-1, 1]);
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
      stop(VANISHING_DENOMINATOR);
    }
    return v.d > 0;
  });
  if (positive.some((p) => p !== positive[0])) {
    stop('limit: left and right limits differ — limit does not exist');
  }
  return positive[0] ? symbol(INF) : negate(symbol(INF));
}

// sides: -1 for the left of A, 1 for the right; only used for infinite limits
function limitAt(F: U, X: U, A: U, sides: number[]): U {
  let result = tryEvalAt(F, X, A);
  if (result !== INDETERMINATE) {
    return result;
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
