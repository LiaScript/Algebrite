import { cadddr, caddr, cadr, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { Eval } from './eval';
import { derivative } from './derivative';
import { denominator } from './denominator';
import { isZeroAtomOrTensor } from './is';
import { divide } from './multiply';
import { numerator } from './numerator';
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

// limit(expr, x, point): only the point form (no direction argument),
// covering direct substitution, simplify-then-substitute, and a bounded
// L'Hopital fallback for 0/0 forms. Limits at infinity, multivariable
// limits, and one-sided limits are out of scope.
export function Eval_limit(p1: U) {
  const F = Eval(cadr(p1));
  const X = Eval(caddr(p1));
  const A = Eval(cadddr(p1));
  return limit(F, X, A);
}

export function limit(F: U, X: U, A: U): U {
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

    if (dAtA !== INDETERMINATE && !isZeroAtomOrTensor(dAtA) && nAtA !== INDETERMINATE) {
      return divide(nAtA, dAtA);
    }
    if (dAtA !== INDETERMINATE && isZeroAtomOrTensor(dAtA) && nAtA !== INDETERMINATE && !isZeroAtomOrTensor(nAtA)) {
      stop('limit: denominator vanishes while numerator does not — limit is infinite or does not exist');
    }

    N = derivative(N, X);
    D = derivative(D, X);
  }

  stop("limit: could not resolve after repeated L'Hopital iterations");
}
