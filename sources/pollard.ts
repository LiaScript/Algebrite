import bigInt from 'big-integer';
import {Constants, MULTIPLY, Num, POWER, primetab, U,} from '../runtime/defs';
import {mcmp} from '../runtime/mcmp';
import {check_esc_flag} from '../runtime/run';
import {symbol} from '../runtime/symbol';
import {mint, setSignTo} from './bignum';
import {equaln} from './is';
import { makeList } from './list';
import {mdivrem} from './mmul';
import {mprime} from './mprime';

// Factor using the Pollard rho method

let n_factor_number = bigInt(0);

export function factor_number(p1: Num): U {
  // 0 or 1?
  if (equaln(p1, 0) || equaln(p1, 1) || equaln(p1, -1)) {
    return p1;
  }
  n_factor_number = p1.q.a;

  const factors = factor_a();
  if (factors.length == 1) {
    return factors[0];
  }
  return makeList(symbol(MULTIPLY), ...factors);
}

// factor using table look-up, then switch to rho method if necessary
// From TAOCP Vol. 2 by Knuth, p. 380 (Algorithm A)
function factor_a(): U[] {
  const result: U[] = [];

  if (n_factor_number.isNegative()) {
    n_factor_number = setSignTo(n_factor_number, 1);
    result.push(Constants.negOne);
  }

  for (let k = 0; k < 10000; k++) {
    result.push(...try_kth_prime(k));
    // if n_factor_number is 1 then we're done
    if (n_factor_number.compare(1) === 0) {
      return result;
    }
  }

  result.push(...factor_b());
  return result;
}

function try_kth_prime(k: number): U[] {
  const result: U[] = [];
  let q: bigInt.BigInteger;

  const d = mint(primetab[k]);

  let count = 0;
  while (true) {
    // if n_factor_number is 1 then we're done
    if (n_factor_number.compare(1) === 0) {
      if (count) {
        result.push(_factor(d, count));
      }
      return result;
    }

    let r: bigInt.BigInteger;
    [q, r] = Array.from(mdivrem(n_factor_number, d));

    // continue looping while remainder is zero
    if (r.isZero()) {
      count++;
      n_factor_number = q;
    } else {
      break;
    }
  }

  if (count) {
    result.push(_factor(d, count));
  }

  // q = n_factor_number/d, hence if q < d then
  // n_factor_number < d^2 so n_factor_number is prime
  if (mcmp(q, d) === -1) {
    result.push(_factor(n_factor_number, 1));
    n_factor_number = mint(1);
  }
  return result;
}

// What the prime table left over: split with Pollard's rho until only primes
// remain, ascending, equal primes as a power.
function factor_b(): U[] {
  const primes: bigInt.BigInteger[] = [];
  const split = (n: bigInt.BigInteger) => {
    if (n.equals(1)) {
      return;
    }
    if (mprime(n)) {
      primes.push(n);
      return;
    }
    const g = rho(n);
    split(g);
    split(n.divide(g));
  };
  split(n_factor_number);
  n_factor_number = mint(1);
  primes.sort((a, b) => a.compare(b));

  const result: U[] = [];
  for (let i = 0; i < primes.length; ) {
    let count = 1;
    while (i + count < primes.length && primes[i + count].equals(primes[i])) {
      count++;
    }
    result.push(_factor(primes[i], count));
    i += count;
  }
  return result;
}

// A proper factor of the composite n: Pollard's rho with Brent's cycle
// detection. The differences of 128 steps are multiplied up and go through
// one gcd; with a gcd in every step a 12 digit factor took 11 s. When the
// product hits n itself the steps are walked again one by one, and when even
// that fails the next constant c is tried.
function rho(n: bigInt.BigInteger): bigInt.BigInteger {
  for (let c = 1; ; c += 2) {
    const f = (v: bigInt.BigInteger) => v.multiply(v).add(c).mod(n);
    let y = bigInt(2);
    let x = y;
    let ys = y;
    let q = bigInt.one;
    let g = bigInt.one;
    for (let r = 1; g.equals(1); r *= 2) {
      x = y;
      for (let i = 0; i < r; i++) {
        y = f(y);
      }
      for (let k = 0; k < r && g.equals(1); k += 128) {
        check_esc_flag();
        ys = y;
        for (let i = 0; i < Math.min(128, r - k); i++) {
          y = f(y);
          q = q.multiply(x.subtract(y).abs()).mod(n);
        }
        g = bigInt.gcd(q, n);
      }
    }
    if (g.equals(n)) {
      do {
        ys = f(ys);
        g = bigInt.gcd(x.subtract(ys).abs(), n);
      } while (g.equals(1));
    }
    if (!g.equals(n)) {
      return g;
    }
  }
}

function _factor(d: bigInt.BigInteger, count: number): U {
  let factor: U = new Num(d);
  if (count > 1) {
    factor = makeList(symbol(POWER), factor, new Num(mint(count)));
  }
  return factor;
}
