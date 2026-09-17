import {
  caddr,
  cadr,
  cddr,
  Constants,
  E,
  isdouble,
  iscons,
  ismultiply,
  ispower,
  isrational,
  LOG,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { add, subtract } from './add';
import { double, integer, nativeDouble } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { equaln, isfraction, isnegativenumber } from './is';
import { makeList } from './list';
import { equal } from './misc';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { power } from './power';

// Natural logarithm.
//
// Note that we use the mathematics / Javascript / Mathematica
// convention that "log" is indeed the natural logarithm.
//
// In engineering, biology, astronomy, "log" can stand instead
// for the "common" logarithm i.e. base 10. Also note that Google
// calculations use log for the common logarithm.
// log(x) is the natural logarithm; log(x, base) = log(x)/log(base).
export function Eval_log(p1: U) {
  const x = Eval(cadr(p1));
  if (!iscons(cddr(p1))) {
    return logarithm(x);
  }
  const base = Eval(caddr(p1));
  return exactLog(x, base) || divide(logarithm(x), logarithm(base));
}

// The integer n with base^n = x, for rational x and base: the exponent is
// guessed in floating point and then verified exactly.
function exactLog(x: U, base: U): U | undefined {
  if (!isrational(x) || !isrational(base)) {
    return undefined;
  }
  const n = Math.round(
    Math.log(nativeDouble(x)) / Math.log(nativeDouble(base))
  );
  if (Number.isFinite(n) && equal(power(base, integer(n)), x)) {
    return integer(n);
  }
  return undefined;
}

export function logarithm(p1: U): U {
  if (p1 === symbol(E)) {
    return Constants.one;
  }

  if (equaln(p1, 1)) {
    return Constants.zero;
  }

  if (isnegativenumber(p1)) {
    return add(
      logarithm(negate(p1)),
      multiply(Constants.imaginaryunit, Constants.Pi())
    );
  }

  if (isdouble(p1)) {
    return double(Math.log(p1.d));
  }

  // rational number and not an integer?
  if (isfraction(p1)) {
    return subtract(logarithm(numerator(p1)), logarithm(denominator(p1)));
  }

  // log(a ^ b) --> b log(a)
  if (ispower(p1)) {
    return multiply(caddr(p1), logarithm(cadr(p1)));
  }

  // log(a * b) --> log(a) + log(b)
  if (ismultiply(p1)) {
    return p1.tail().map(logarithm).reduce(add, Constants.zero);
  }

  return makeList(symbol(LOG), p1);
}
