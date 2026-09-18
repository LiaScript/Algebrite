import {
  caddr,
  cadr,
  cdddr,
  Constants,
  isadd,
  iscons,
  ismultiply,
  ispower,
  MAXPRIMETAB,
  NIL,
  Num,
  primetab,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { Find } from '../runtime/find';
import { collectUserSymbols, symbol } from "../runtime/symbol";
import { integer, nativeInt } from './bignum';
import { Eval } from './eval';
import { factorpoly } from './factorpoly';
import { guess } from './guess';
import { isinteger, isposint } from './is';
import { factorKronecker } from './factor_multivariate';
import { multiply_all_noexpand, multiply_noexpand } from './multiply';
import { factor_number } from './pollard';

// factor a polynomial or integer
export function Eval_factor(p1: U) {
  const top = Eval(cadr(p1));
  const p2 = Eval(caddr(p1));
  let variable = p2 === symbol(NIL) ? guess(top) : p2;
  if (p2 === symbol(NIL) && !Find(top, variable)) {
    // none of x, y, z, t, s: factor(a^2-b^2) takes a
    const symbols: U[] = [];
    collectUserSymbols(top, symbols);
    variable = symbols[0] || variable;
  }
  let temp = factor(top, variable);

  // factor(p) is complete: what the main variable leaves over, 4*y^2-1 in
  // x*(4*y^2-1), is factored too
  if (p2 === symbol(NIL) && !isinteger(top)) {
    temp = completeFactors(temp, variable);
  }

  // more factoring?
  p1 = cdddr(p1);
  if (iscons(p1)) {
    temp = [...p1].reduce((acc: U, p: U) => factor_again(acc, Eval(p)), temp);
  }
  return temp;
}

// The factors of a product once more: one without the main variable X is
// factored in its own first symbol, one with X loses what Kronecker's
// substitution still finds in it (the z in 2*w*z+3*x*z^2). Factoring every
// factor again in every symbol would only turn signs, -(a+b)*(-a+b).
function completeFactors(p: U, X: U): U {
  const factors = ismultiply(p) ? p.tail() : [p];
  const out: U[] = [];
  for (const f of factors) {
    const [base, n] =
      ispower(f) && isposint(caddr(f)) ? [cadr(f), nativeInt(caddr(f))] : [f, 1];
    const symbols: U[] = [];
    collectUserSymbols(base, symbols);
    let parts: U[] | undefined;
    if (isadd(base) && symbols.length) {
      if (!Find(base, X)) {
        const again = completeFactors(factor(base, symbols[0]), symbols[0]);
        parts = ismultiply(again) ? again.tail() : [again];
      } else {
        parts = factorKronecker(base, X);
      }
    }
    for (let k = 0; k < n; k++) {
      out.push(...(parts || [base]));
    }
  }
  return out.length === 1 ? out[0] : out.reduce(multiply_noexpand);
}

function factor_again(p1: U, p2: U): U {
  if (ismultiply(p1)) {
    const arr: U[] = [];
    p1.tail().forEach((el) => factor_term(arr, el, p2));
    return multiply_all_noexpand(arr);
  }

  const arr: U[] = [];
  factor_term(arr, p1, p2);
  return arr[0];
}

function factor_term(arr: U[], arg1: U, arg2: U): void {
  const p1 = factorpoly(arg1, arg2);
  if (ismultiply(p1)) {
    arr.push(...p1.tail());
    return;
  }

  arr.push(p1);
}

export function factor(p1: U, p2: U): U {
  if (isinteger(p1)) {
    return factor_number(p1); // see pollard.cpp
  }

  return factorpoly(p1, p2);
}

// for factoring small integers (2^32 or less)
export function factor_small_number(n: number): Num[] {
  if (isNaN(n)) {
    stop('number too big to factor');
  }
  const arr: Num[] = [];
  if (n < 0) {
    n = -n;
  }

  for (let i = 0; i < MAXPRIMETAB; i++) {
    const d = primetab[i];

    if (d > n / d) {
      break;
    }

    let expo = 0;

    while (n % d === 0) {
      n /= d;
      expo++;
    }

    if (expo) {
      arr.push(integer(d));
      arr.push(integer(expo));
    }
  }

  if (n > 1) {
    arr.push(integer(n));
    arr.push(Constants.one);
  }
  return arr;
}
