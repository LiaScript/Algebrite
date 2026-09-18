import bigInt from 'big-integer';
import { stop } from '../runtime/run';

// Bignum power
const MAX_POWER_DIGITS = 1000000;

export function mpow(
  a: bigInt.BigInteger,
  n: number | bigInt.BigInteger
): bigInt.BigInteger {
  // one library call that nothing can interrupt: 2^(10^8) took 28 s
  const digits = a.abs().toString(2).length * 0.30103 * Number(n);
  if (digits > MAX_POWER_DIGITS) {
    stop(`power: the result would have more than ${MAX_POWER_DIGITS} digits`);
  }
  return a.pow(n);
}

//if SELFTEST
