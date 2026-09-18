import { BERNOULLI, cadr, Constants, isdouble, U, ZETA } from '../runtime/defs';
import { stop } from '../runtime/run';
import { usr_symbol } from '../runtime/symbol';
import { add } from './add';
import { double, integer, nativeInt, rational } from './bignum';
import { Eval } from './eval';
import { factorial } from './factorial';
import { zzfloat } from './float';
import { lanczos } from './gamma';
import { isinteger } from './is';
import { makeList } from './list';
import { checkArgCount } from './misc';
import { divide, multiply, negate } from './multiply';
import { power } from './power';

// bernoulli(n): the Bernoulli numbers with B1 = -1/2, from
// B_m = -1/(m+1) * sum_{j<m} C(m+1,j) B_j
// filled on first use: Constants is not there yet when this module loads
const bernoulliCache: U[] = [];

export function bernoulliNumber(n: number): U {
  if (bernoulliCache.length === 0) {
    bernoulliCache.push(Constants.one);
  }
  for (let m = bernoulliCache.length; m <= n; m++) {
    let acc: U = Constants.zero;
    let binom: U = Constants.one; // C(m+1, j)
    for (let j = 0; j < m; j++) {
      acc = add(acc, multiply(binom, bernoulliCache[j]));
      binom = divide(multiply(binom, integer(m + 1 - j)), integer(j + 1));
    }
    bernoulliCache.push(negate(divide(acc, integer(m + 1))));
  }
  return bernoulliCache[n];
}

export function Eval_bernoulli(p1: U) {
  checkArgCount(p1, 1);
  const arg = Eval(cadr(p1));
  const n = nativeInt(arg);
  if (isNaN(n) || n < 0) {
    return makeList(usr_symbol(BERNOULLI), arg);
  }
  return bernoulliNumber(n);
}

export function Eval_zeta(p1: U) {
  checkArgCount(p1, 1);
  return zeta(Eval(cadr(p1)));
}

// Riemann zeta: exact at the even positive integers, zeta(2n) =
// (-1)^(n+1) B_2n (2 pi)^(2n) / (2 (2n)!), at 0 and at the negative integers,
// zeta(-n) = -B_(n+1)/(n+1); numeric for a float; otherwise left as it is.
export function zeta(s: U): U {
  if (isdouble(s)) {
    // the exact values where there are some: the trivial zeros would come
    // out of the numeric formula as rounding noise
    if (Number.isInteger(s.d) && (s.d <= 0 || s.d % 2 === 0) && Math.abs(s.d) < 100) {
      return zzfloat(zeta(integer(s.d)));
    }
    return double(zetaFloat(s.d));
  }
  if (!isinteger(s)) {
    return makeList(usr_symbol(ZETA), s);
  }
  const n = nativeInt(s);
  if (n === 1) {
    stop('zeta: pole at 1');
  }
  if (n === 0) {
    return rational(-1, 2);
  }
  if (n < 0) {
    return negate(divide(bernoulliNumber(1 - n), integer(1 - n)));
  }
  if (n % 2 === 1 || isNaN(n)) {
    return makeList(usr_symbol(ZETA), s);
  }
  const sign = (n / 2) % 2 === 1 ? Constants.one : Constants.negOne;
  return divide(
    multiply(
      multiply(sign, bernoulliNumber(n)),
      power(multiply(integer(2), Constants.Pi()), s)
    ),
    multiply(integer(2), factorial(s))
  );
}

// Euler-Maclaurin: sum_{k<N} k^-s + N^(1-s)/(s-1) + N^-s/2
//   + sum_j B_2j/(2j)! * s(s+1)...(s+2j-2) * N^(-s-2j+1)
function zetaFloat(s: number): number {
  if (s === 1) {
    stop('zeta: pole at 1');
  }
  // reflection: zeta(s) = 2^s pi^(s-1) sin(pi s/2) Gamma(1-s) zeta(1-s),
  // Euler-Maclaurin with a fixed number of terms degrades for s << 0
  if (s < 0) {
    return (
      Math.pow(2, s) *
      Math.pow(Math.PI, s - 1) *
      Math.sin((Math.PI * s) / 2) *
      lanczos(1 - s) *
      zetaFloat(1 - s)
    );
  }
  const N = 20;
  let sum = 0;
  for (let k = 1; k < N; k++) {
    sum += Math.pow(k, -s);
  }
  sum += Math.pow(N, 1 - s) / (s - 1) + Math.pow(N, -s) / 2;
  const B2 = [1 / 6, -1 / 30, 1 / 42, -1 / 30, 5 / 66, -691 / 2730, 7 / 6, -3617 / 510];
  let rising = s; // s(s+1)...(s+2j-2)
  let fact = 2; // (2j)!
  for (let j = 1; j <= B2.length; j++) {
    sum += (B2[j - 1] / fact) * rising * Math.pow(N, -s - 2 * j + 1);
    rising *= (s + 2 * j - 1) * (s + 2 * j);
    fact *= (2 * j + 1) * (2 * j + 2);
  }
  return sum;
}
