import bigInt from 'big-integer';
import { caddr, cadddr, cadr, Constants, ismultiply, ispower, Num, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { usr_symbol } from '../runtime/symbol';
import { add } from './add';
import { integer, nativeInt, rational } from './bignum';
import { Eval } from './eval';
import { isinteger } from './is';
import { makeList } from './list';
import { checkArgCount } from './misc';
import { mprime } from './mprime';
import { divide, multiply } from './multiply';
import { factor_number } from './pollard';
import { build_tensor } from './scan';

// Number functions on integers; anything else is left as it is.

function integerArg(p: U): bigInt.BigInteger | undefined {
  return isinteger(p) ? (p as Num).a : undefined;
}

// fibonacci(n) by fast doubling: F(2k) = F(k)*(2*F(k+1)-F(k)),
// F(2k+1) = F(k)^2 + F(k+1)^2
export function Eval_fibonacci(p1: U) {
  checkArgCount(p1, 1);
  const arg = Eval(cadr(p1));
  const n = nativeInt(arg);
  if (isNaN(n) || n < 0) {
    return makeList(usr_symbol('fibonacci'), arg);
  }
  const fib = (k: number): [bigInt.BigInteger, bigInt.BigInteger] => {
    if (k === 0) {
      return [bigInt.zero, bigInt.one];
    }
    const [a, b] = fib(Math.floor(k / 2));
    const c = a.multiply(b.multiply(2).subtract(a));
    const d = a.multiply(a).add(b.multiply(b));
    return k % 2 === 0 ? [c, d] : [d, c.add(d)];
  };
  return new Num(fib(n)[0]);
}

// harmonic(n) = 1 + 1/2 + ... + 1/n
export function Eval_harmonic(p1: U) {
  checkArgCount(p1, 1);
  const arg = Eval(cadr(p1));
  const n = nativeInt(arg);
  if (isNaN(n) || n < 0) {
    return makeList(usr_symbol('harmonic'), arg);
  }
  let sum: U = Constants.zero;
  for (let k = 1; k <= n; k++) {
    sum = add(sum, rational(1, k));
  }
  return sum;
}

// totient(n) = n * prod (1 - 1/p) over the primes p dividing n
export function Eval_totient(p1: U) {
  checkArgCount(p1, 1);
  const arg = Eval(cadr(p1));
  const n = integerArg(arg);
  if (n === undefined || !n.isPositive()) {
    return makeList(usr_symbol('totient'), arg);
  }
  if (n.equals(1)) {
    return Constants.one;
  }
  const f = factor_number(arg as Num);
  const factors = ismultiply(f) ? f.tail() : [f];
  return factors.reduce((acc: U, t: U) => {
    const p = ispower(t) ? cadr(t) : t;
    return divide(multiply(acc, add(p, Constants.negOne)), p);
  }, arg);
}

// powermod(a, b, m) = a^b mod m, the modular inverse for negative b
export function Eval_powermod(p1: U) {
  checkArgCount(p1, 3);
  const args = [cadr(p1), caddr(p1), cadddr(p1)].map(Eval);
  const [a, b, m] = args.map(integerArg);
  if (a === undefined || b === undefined || m === undefined || !m.isPositive()) {
    return makeList(usr_symbol('powermod'), ...args);
  }
  let base = a;
  if (b.isNegative()) {
    if (!bigInt.gcd(a, m).equals(1)) {
      stop(`powermod: ${a} has no inverse modulo ${m}`);
    }
    base = a.modInv(m);
  }
  const r = base.modPow(b.abs(), m);
  return new Num(r.isNegative() ? r.add(m) : r);
}

// the smallest prime above n
export function Eval_nextprime(p1: U) {
  checkArgCount(p1, 1);
  const arg = Eval(cadr(p1));
  let n = integerArg(arg);
  if (n === undefined) {
    return makeList(usr_symbol('nextprime'), arg);
  }
  n = n.lesser(1) ? bigInt(2) : n.add(1);
  while (!mprime(n)) {
    n = n.add(1);
  }
  return new Num(n);
}

// primes(n): the primes up to n, by the sieve of Eratosthenes
export function Eval_primes(p1: U) {
  checkArgCount(p1, 1);
  const arg = Eval(cadr(p1));
  const n = nativeInt(arg);
  if (isNaN(n)) {
    return makeList(usr_symbol('primes'), arg);
  }
  if (n > 1e7) {
    stop('primes: at most up to 10^7');
  }
  const composite = new Uint8Array(Math.max(n + 1, 2));
  const result: U[] = [];
  for (let i = 2; i <= n; i++) {
    if (!composite[i]) {
      result.push(integer(i));
      for (let j = i * i; j <= n; j += i) {
        composite[j] = 1;
      }
    }
  }
  return build_tensor(result);
}
