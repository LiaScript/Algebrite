import {
  car,
  cdr,
  Constants,
  doexpand,
  iscons,
  isrational,
  U,
} from '../runtime/defs';
import { absval } from './abs';
import { guess } from './guess';
import { ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { equal } from './misc';
import { divpoly } from './quotient';
import { Eval } from './eval';
import { gcd } from './gcd';
import { divide, multiply } from './multiply';

// Find the least common multiple of two expressions.
export function Eval_lcm(p1: U) {
  p1 = cdr(p1);
  let result = Eval(car(p1));
  if (iscons(p1)) {
    result = p1.tail().reduce((a: U, b: U) => lcm(a, Eval(b)), result);
  }
  return result;
}

export function lcm(p1: U, p2: U): U {
  return doexpand(yylcm, p1, p2);
}

// lcm = p1 * p2 / gcd. For polynomials the division is done by divpoly,
// divide() would leave the quotient of two sums uncancelled.
function yylcm(p1: U, p2: U): U {
  const g = gcd(p1, p2);
  if (isZeroAtomOrTensor(g)) {
    return Constants.zero;
  }
  if (isrational(p1) && isrational(p2)) {
    return absval(divide(multiply(p1, p2), g));
  }
  const X = guess(g);
  if (ispolyexpandedform(g, X) && ispolyexpandedform(p2, X)) {
    const q = divpoly(p2, g, X);
    if (equal(multiply(q, g), p2)) {
      return multiply(p1, q);
    }
  }
  return divide(multiply(p1, p2), g);
}
