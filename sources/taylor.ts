import { car, cdr, Constants, NIL, TAYLOR, U } from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { add, subtract } from './add';
import { integer, nativeInt } from './bignum';
import { derivative } from './derivative';
import { Eval } from './eval';
import { factorial } from './factorial';
import { guess } from './guess';
import { isone, isZeroAtomOrTensor } from './is';
import { denominator } from './denominator';
import { numerator } from './numerator';
import { power } from './power';
import { makeList } from './list';
import { divide, multiply } from './multiply';
import { subst } from './subst';
import { checkArgCount } from './misc';

/*
Taylor expansion of a function

  push(F)
  push(X)
  push(N)
  push(A)
  taylor()
*/
export function Eval_taylor(p1: U) {
  checkArgCount(p1, 1, 4);
  // 1st arg
  p1 = cdr(p1);
  const F = Eval(car(p1));

  // 2nd arg
  p1 = cdr(p1);
  let p2 = Eval(car(p1));
  const X = p2 === symbol(NIL) ? guess(F) : p2;

  // 3rd arg
  p1 = cdr(p1);
  p2 = Eval(car(p1));
  const N = p2 === symbol(NIL) ? integer(24) : p2; // 24: default number of terms

  // 4th arg
  p1 = cdr(p1);
  p2 = Eval(car(p1));
  const A = p2 === symbol(NIL) ? Constants.zero : p2; // 0: default expansion point

  return taylor(F, X, N, A);
}

function taylor(F: U, X: U, N: U, A: U): U {
  const k = nativeInt(N);
  if (isNaN(k)) {
    return makeList(symbol(TAYLOR), F, X, N, A);
  }
  try {
    return regularTaylor(F, X, k, A);
  } catch (e) {
    // not analytic at A: a removable singularity or a pole still has a
    // (Laurent) series, from dividing numerator and denominator series
    const q = quotientSeries(F, X, k, A);
    if (q === undefined) {
      throw e;
    }
    return q;
  }
}

function regularTaylor(F: U, X: U, k: number, A: U): U {
  let p5: U = Constants.one;
  let temp = Eval(subst(F, X, A)); // F: f(a)
  for (let i = 1; i <= k; i++) {
    F = derivative(F, X); // F: f = f'

    if (isZeroAtomOrTensor(F)) {
      break;
    }

    // c = c * (x - a)
    p5 = multiply(p5, subtract(X, A));

    const arg1a = Eval(subst(F, X, A)); // F: f(a)
    temp = add(temp, divide(multiply(arg1a, p5), factorial(integer(i))));
  }
  return temp;
}

// the Taylor coefficients of F at A, one per call
function coefficients(F: U, X: U, A: U): () => U {
  let i = 0;
  return () => {
    const c = divide(Eval(subst(F, X, A)), factorial(integer(i)));
    F = derivative(F, X);
    i++;
    return c;
  };
}

// F = num/den with num = (X-A)^n0 * (n_0 + n_1 (X-A) + ...) and the same for
// den with d0: the quotient series q_j = (n_j - sum_{i=1..j} d_i q_(j-i)) / d_0
// times (X-A)^(n0-d0), up to the power k. undefined when F is no quotient or
// a series does not start within MAX_ORDER terms.
const MAX_ORDER = 12;

function quotientSeries(F: U, X: U, k: number, A: U): U | undefined {
  const den = denominator(F);
  if (isone(den)) {
    return undefined;
  }
  let nextN: () => U;
  let nextD: () => U;
  let n: U[];
  let d: U[];
  let n0 = 0;
  let d0 = 0;
  try {
    nextN = coefficients(numerator(F), X, A);
    nextD = coefficients(den, X, A);
    n = [nextN()];
    d = [nextD()];
    for (; isZeroAtomOrTensor(n[0]); n0++) {
      if (n0 === MAX_ORDER) {
        return undefined;
      }
      n = [nextN()];
    }
    for (; isZeroAtomOrTensor(d[0]); d0++) {
      if (d0 === MAX_ORDER) {
        return undefined;
      }
      d = [nextD()];
    }
    const shift = n0 - d0;
    const q: U[] = [];
    let result: U = Constants.zero;
    let pow: U = Constants.one; // (X-A)^j, expanded like regularTaylor does
    for (let j = 0; j + shift <= k; j++) {
      if (j > 0) {
        n.push(nextN());
        d.push(nextD());
        pow = multiply(pow, subtract(X, A));
      }
      let c = n[j];
      for (let i = 1; i <= j; i++) {
        c = subtract(c, multiply(d[i], q[j - i]));
      }
      q.push(divide(c, d[0]));
      const e = j + shift;
      const term =
        e >= 0
          ? multiply(q[j], e === j ? pow : power(subtract(X, A), integer(e)))
          : multiply(q[j], power(subtract(X, A), integer(e)));
      result = add(result, e >= 0 && e !== j ? Eval(term) : term);
    }
    return result;
  } catch (e) {
    return undefined;
  }
}
