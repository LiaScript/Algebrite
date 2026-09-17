import {
  caddddr,
  cadddr,
  caddr,
  cadr,
  Constants,
  issymbol,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { get_binding, set_binding } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, nativeInt } from './bignum';
import { coeff } from './coeff';
import { Eval, evaluate_integer } from './eval';
import { ispolyexpandedform } from './is';
import { divide, multiply } from './multiply';
import { power } from './power';

// 'sum' function

//define A p3
//define B p4
//define I p5
//define X p6

// leaves the sum at the top of the stack
export function Eval_sum(p1: U) {
  // 1st arg
  const body = cadr(p1);

  // 2nd arg (index)
  const indexVariable = caddr(p1);
  if (!issymbol(indexVariable)) {
    stop('sum: 2nd arg?');
  }

  // 3rd arg (lower limit), 4th arg (upper limit)
  const j = evaluate_integer(cadddr(p1));
  const k = evaluate_integer(caddddr(p1));
  if (isNaN(j) || isNaN(k)) {
    return symbolicSum(p1, body, indexVariable);
  }

  // remember contents of the index
  // variable so we can put it back after the loop
  const p4 = get_binding(indexVariable);

  let temp: U = Constants.zero;
  for (let i = j; i <= k; i++) {
    set_binding(indexVariable, integer(i));
    temp = add(temp, Eval(body));
  }

  // put back the index variable to original content
  set_binding(indexVariable, p4);
  return temp;
}

// Closed form for a symbolic bound when the summand is a polynomial in the
// index: sum_{i=a}^{b} f(i) = F(b) - F(a-1) with F built from power sums.
// Anything else is returned unevaluated. As in other CAS, the formula is
// given without knowing whether b >= a.
function symbolicSum(p1: U, body: U, x: U): U {
  // the index must be unbound while the summand is taken apart
  const saved = get_binding(x);
  set_binding(x, x);
  try {
    const f = Eval(body);
    if (Find(f, x) && !ispolyexpandedform(f, x)) {
      return p1;
    }
    const c = coeff(f, x);
    const upper = powerSums(Eval(caddddr(p1)), c.length - 1);
    const lower = powerSums(
      subtract(Eval(cadddr(p1)), Constants.one),
      c.length - 1
    );
    return c.reduce(
      (acc: U, cp, p) =>
        add(acc, multiply(cp, subtract(upper[p], lower[p]))),
      Constants.zero
    );
  } finally {
    set_binding(x, saved);
  }
}

// S[p] = sum_{i=1}^{n} i^p for p = 0..maxP, from the telescoping identity
// (n+1)^(p+1) - 1 = sum_{j=0}^{p} C(p+1,j) * S[j].
// ponytail: binomials as JS numbers, exact up to degree ~50; bigint if needed
function powerSums(n: U, maxP: number): U[] {
  const S: U[] = [];
  for (let p = 0; p <= maxP; p++) {
    let t = subtract(
      power(add(n, Constants.one), integer(p + 1)),
      Constants.one
    );
    let binom = 1; // C(p+1, j)
    for (let j = 0; j < p; j++) {
      t = subtract(t, multiply(integer(binom), S[j]));
      binom = (binom * (p + 1 - j)) / (j + 1);
    }
    S.push(divide(t, integer(p + 1)));
  }
  return S;
}
