import {
  BINOMIAL,
  caddr,
  cadr,
  Constants,
  isNumericAtom,
  U
} from '../runtime/defs';
import { symbol } from '../runtime/symbol';
import { subtract } from './add';
import { integer, nativeInt } from './bignum';
import { Eval } from './eval';
import { factorial } from './factorial';
import { isinteger, isnegativenumber } from './is';
import { makeList } from './list';
import { divide, multiply } from './multiply';

//  Binomial coefficient
//
//  binomial(n, k) = n! / k! / (n - k)!
//
//  generalized as in Concrete Mathematics (5.1): for integer k >= 0 it is
//  n (n - 1) ... (n - k + 1) / k!, which also holds for negative and
//  fractional n, and it vanishes for integer k < 0.

export function Eval_binomial(p1: U) {
  const N = Eval(cadr(p1));
  const K = Eval(caddr(p1));
  return binomial(N, K);
}

export function binomial(N: U, K: U): U {
  const k = nativeInt(K);
  if (k < 0) {
    return Constants.zero;
  }

  if (isNumericAtom(N) && !isNaN(k)) {
    let result: U = Constants.one;
    for (let j = 0; j < k; j++) {
      result = divide(multiply(result, subtract(N, integer(j))), integer(j + 1));
    }
    return result;
  }

  // n! has a pole at negative integers, the factorial form is meaningless
  if (isinteger(N) && isnegativenumber(N)) {
    return makeList(symbol(BINOMIAL), N, K);
  }

  return divide(divide(factorial(N), factorial(K)), factorial(subtract(N, K)));
}
