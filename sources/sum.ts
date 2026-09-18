import {
  caddddr,
  cadddr,
  caddr,
  cadr,
  Constants,
  isadd,
  isNumericAtom,
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
import { equaln, ispolyexpandedform } from './is';
import { divide, multiply } from './multiply';
import { power } from './power';
import { simplify } from './simplify';
import { subst } from './subst';
import { checkArgCount } from './misc';

// 'sum' function

//define A p3
//define B p4
//define I p5
//define X p6

// leaves the sum at the top of the stack
export function Eval_sum(p1: U) {
  checkArgCount(p1, 4);
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
  try {
    for (let i = j; i <= k; i++) {
      set_binding(indexVariable, integer(i));
      temp = add(temp, Eval(body));
    }
  } finally {
    // put back the index variable to original content,
    // also when the body stops with an error
    set_binding(indexVariable, p4);
  }
  return temp;
}

// Closed form for a symbolic bound. The summand is split into its additive
// terms: the polynomial ones (in the index) are summed with power sums, every
// other term must be geometric. Anything else is returned unevaluated. As in
// other CAS, the formula is given without knowing whether b >= a.
function symbolicSum(p1: U, body: U, x: U): U {
  // the index must be unbound while the summand is taken apart
  const saved = get_binding(x);
  set_binding(x, x);
  try {
    const f = Eval(body);
    const a = Eval(cadddr(p1));
    const b = Eval(caddddr(p1));
    // numeric bounds that are not integers: the closed forms below assume
    // integer steps from a to b, sum(k,k,1/2,3) is not F(3) - F(-1/2)
    if ([a, b].some((p) => isNumericAtom(p) && isNaN(nativeInt(p)))) {
      return p1;
    }
    const terms = isadd(f) ? f.tail() : [f];
    const isPoly = (t: U) => !Find(t, x) || ispolyexpandedform(t, x);

    let result = polynomialSum(
      terms.filter(isPoly).reduce(add, Constants.zero),
      x,
      a,
      b
    );
    for (const t of terms.filter((t) => !isPoly(t))) {
      const g = geometricSum(t, x, a, b);
      if (!g) {
        return p1;
      }
      result = add(result, g);
    }
    return result;
  } finally {
    set_binding(x, saved);
  }
}

// sum_{i=a}^{b} f(i) = F(b) - F(a-1), with F built from power sums.
function polynomialSum(f: U, x: U, a: U, b: U): U {
  const c = coeff(f, x);
  const upper = powerSums(b, c.length - 1);
  const lower = powerSums(subtract(a, Constants.one), c.length - 1);
  return c.reduce(
    (acc: U, cp, p) => add(acc, multiply(cp, subtract(upper[p], lower[p]))),
    Constants.zero
  );
}

// A term is geometric when t(x+1)/t(x) is free of x; the sum is then
// t(a) * (r^(b-a+1) - 1) / (r - 1). Returns null for any other term.
function geometricSum(t: U, x: U, a: U, b: U): U | null {
  const next = Eval(subst(t, x, add(x, Constants.one)));
  const r = simplify(divide(next, t));
  if (Find(r, x) || equaln(r, 1)) {
    return null;
  }
  const count = add(subtract(b, a), Constants.one);
  return simplify(
    divide(
      multiply(
        Eval(subst(t, x, a)),
        subtract(power(r, count), Constants.one)
      ),
      subtract(r, Constants.one)
    )
  );
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
