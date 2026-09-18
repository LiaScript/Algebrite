import { isInteger, isNegative, isPositive, isReal } from './assume';
import {
  ABS,
  ARCTAN,
  ASSUME_REAL_VARIABLES,
  avoidCalculatingPowersIntoArctans,
  breakpoint,
  caddr,
  cadr,
  car,
  cdr,
  Constants,
  COS,
  defs,
  Double,
  E,
  isadd,
  iscons,
  isdouble,
  INF,
  ismultiply,
  isNumericAtom,
  ispower,
  isrational,
  istensor,
  LOG,
  MULTIPLY,
  Num,
  PI,
  POWER,
  SIN,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { get_binding, symbol } from '../runtime/symbol';
import { equal, exponential, length, sign } from '../sources/misc';
import { abs } from './abs';
import { add, subtract } from './add';
import { arg } from './arg';
import {
  compare_numbers,
  double,
  integer,
  nativeDouble, nativeInt, rational
} from './bignum';
import { conjugate } from './conj';
import { cosine } from './cos';
import { dpow } from './dpow';
import { Eval } from './eval';
import { factorial } from './factorial';
import { imag } from './imag';
import {
  iscomplexnumber,
  iscomplexnumberdouble,
  iseveninteger,
  isinteger,
  isminusone,
  isminusoneovertwo,
  isnegativenumber,
  isone,
  isoneovertwo,
  ispositivenumber,
  isquarterturn,
  isZeroAtomOrTensor
} from './is';
import { makeList } from './list';
import { divide, multiply, negate } from './multiply';
import { qpow } from './qpow';
import { real } from './real';
import { powerUnitAware } from './quantity';
import { rect } from './rect';
import { sine } from './sin';
import { power_tensor } from './tensor';
import { requireDimensionless } from './quantity';

/* Power function

  Input:    push  Base
      push  Exponent

  Output:    Result on stack
*/
const DEBUG_POWER = false;

export function Eval_power(p1: U) {
  if (DEBUG_POWER) {
    breakpoint;
  }
  const base = Eval(cadr(p1));
  const exponent = Eval(caddr(p1));
  return power(base, exponent);
}

export function power(p1: U, p2: U): U {
  return yypower(p1, p2);
}

function yypower(base: U, exponent: U): U {
  if (DEBUG_POWER) {
    breakpoint;
  }

  const inputExp = exponent;
  const inputBase = base;
  //breakpoint

  if (DEBUG_POWER) {
    console.log(`POWER: ${base} ^ ${exponent}`);
  }

  // inf^n: inf for n > 0, 0 for n < 0, indeterminate for n = 0
  if (base === symbol(INF) && isNumericAtom(exponent)) {
    if (isZeroAtomOrTensor(exponent)) {
      stop('indeterminate form: inf^0');
    }
    return isnegativenumber(exponent) ? Constants.zero : base;
  }

  // first, some very basic simplifications right away

  //  1 ^ a    ->  1
  //  a ^ 0    ->  1
  if (equal(base, Constants.one) || isZeroAtomOrTensor(exponent)) {
    const one = Constants.One();
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${one}`);
    }
    return one;
  }

  // e^some_float
  if (base === symbol(E) && isdouble(exponent)) {
    const result = double(Math.exp(exponent.d));
    if (DEBUG_POWER) {
      console.log('   power: base == symbol(E) && isdouble(exponent) ');
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // positive float (or e) to a complex power with floats:
  // b^(x+iy) = b^x (cos(y log b) + i sin(y log b))
  if (
    iscomplexnumber(exponent) &&
    !defs.evaluatingPolar &&
    ((isdouble(base) && base.d > 0) ||
      (base === symbol(E) && iscomplexnumberdouble(exponent)))
  ) {
    const y = multiply(
      imag(exponent),
      isdouble(base) ? double(Math.log(base.d)) : Constants.one
    );
    return multiply(
      power(base, real(exponent)),
      add(cosine(y), multiply(Constants.imaginaryunit, sine(y)))
    );
  }

  //  a ^ 1    ->  a
  if (equal(exponent, Constants.one)) {
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${base}`);
    }
    return base;
  }

  // is the base a Quantity, or (with units() on) a bare unit symbol?
  requireDimensionless(exponent, 'power: exponent');
  const unitResult = powerUnitAware(base, exponent);
  if (unitResult !== undefined) {
    return unitResult;
  }

  //   -1 ^ -1    ->  -1
  if (isminusone(base) && isminusone(exponent)) {
    const negOne = negate(Constants.One());
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${negOne}`);
    }
    return negOne;
  }

  //   -1 ^ 1/2  ->  i
  if (isminusone(base) && isoneovertwo(exponent)) {
    const result = Constants.imaginaryunit;
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  //   -1 ^ -1/2  ->  -i
  if (isminusone(base) && isminusoneovertwo(exponent)) {
    const result = negate(Constants.imaginaryunit);
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  let tmp: U;
  //   -1 ^ rational
  if (
    isminusone(base) &&
    !isdouble(base) &&
    isrational(exponent) &&
    !isinteger(exponent) &&
    ispositivenumber(exponent) &&
    !defs.evaluatingAsFloats
  ) {
    if (DEBUG_POWER) {
      console.log('   power: -1 ^ rational');
      console.log(
        ` trick: exponent.q.a , exponent.q.b ${exponent.q.a} , ${exponent.q.b}`
      );
    }
    if (exponent.q.a < exponent.q.b) {
      tmp = makeList(symbol(POWER), base, exponent);
    } else {
      // (-1)^(a/b) = (-1)^floor(a/b) * (-1)^((a mod b)/b)
      tmp = makeList(
        symbol(POWER),
        base,
        rational(exponent.q.a.mod(exponent.q.b), exponent.q.b)
      );
      if (exponent.q.a.divide(exponent.q.b).isOdd()) {
        tmp = makeList(symbol(MULTIPLY), base, tmp);
      }
      if (DEBUG_POWER) {
        console.log(` trick applied : ${tmp}`);
      }
    }

    // evaluates clock form into
    // rectangular form. This seems to give
    // slightly better form to some test results.
    const result = rect(tmp);
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // both base and exponent are rational numbers?
  if (isrational(base) && isrational(exponent)) {
    if (DEBUG_POWER) {
      console.log('   power: isrational(base) && isrational(exponent)');
    }
    const result = qpow(base, exponent);
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // both base and exponent are either rational or double?
  if (isNumericAtom(base) && isNumericAtom(exponent)) {
    const result = dpow(nativeDouble(base), nativeDouble(exponent));
    if (DEBUG_POWER) {
      console.log(
        '   power: both base and exponent are either rational or double '
      );
      console.log('POWER - isNumericAtom(base) && isNumericAtom(exponent)');
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  if (istensor(base)) {
    const result = power_tensor(base, exponent);
    if (DEBUG_POWER) {
      console.log('   power: istensor(base) ');
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // (-1)^k for a symbolic integer k (from the assumptions): 1 when k is
  // even, -1 when k is odd
  if (isminusone(base) && !isdouble(base) && !isNumericAtom(exponent)) {
    if (isInteger(divide(exponent, integer(2)))) {
      return Constants.one;
    }
    if (isInteger(divide(subtract(exponent, Constants.one), integer(2)))) {
      return Constants.negOne;
    }
  }

  // if we only assume variables to be real, then |a|^2 = a^2
  // (if x is complex this doesn't hold e.g. i, which makes 1 and -1
  if (
    car(base) === symbol(ABS) &&
    iseveninteger(exponent) &&
    isReal(cadr(base))
  ) {
    const result = power(cadr(base), exponent);

    if (DEBUG_POWER) {
      console.log('   power: even power of absolute of real value ');
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // e^log(...)
  if (base === symbol(E) && car(exponent) === symbol(LOG)) {
    const result = cadr(exponent);
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // e^(k*log(m)+rest) = m^k*e^rest, valid for every k and m
  if (base === symbol(E) && Find(exponent, symbol(LOG))) {
    const result = expOfLogTerms(exponent);
    if (result !== undefined) {
      return result;
    }
  }

  // complex number in exponential form, get it to rectangular
  // but only if we are not in the process of calculating a polar form,
  // otherwise we'd just undo the work we want to do
  if (
    base === symbol(E) &&
    Find(exponent, Constants.imaginaryunit) &&
    Find(exponent, symbol(PI)) &&
    !defs.evaluatingPolar
  ) {
    let tmp = makeList(symbol(POWER), base, exponent);
    if (DEBUG_POWER) {
      console.log(`   power: turning complex exponential to rect: ${tmp}`);
    }

    const hopefullySimplified = rect(tmp); // put new (hopefully simplified expr) in exponent
    if (!Find(hopefullySimplified, symbol(PI))) {
      if (DEBUG_POWER) {
        console.log(
          `   power: turned complex exponential to rect: ${hopefullySimplified}`
        );
      }
      return hopefullySimplified;
    }
  }

  //  (a * b) ^ c  ->  (a ^ c) * (b ^ c)
  // note that we can't in general do this, for example
  // sqrt(x*y) != x^(1/2) y^(1/2) (counterexample" x = -1 and y = -1)
  // BUT we can carve-out here some cases where this
  // transformation is correct
  if (
    ismultiply(base) &&
    (isinteger(exponent) ||
      isInteger(exponent) ||
      base.tail().every((f) => isReal(f) && isNegative(f) === false))
  ) {
    base = cdr(base);
    let result = power(car(base), exponent);
    if (iscons(base)) {
      result = base
        .tail()
        .reduce((a: U, b: U) => multiply(a, power(b, exponent)), result);
    }
    if (DEBUG_POWER) {
      console.log('   power: (a * b) ^ c  ->  (a ^ c) * (b ^ c) ');
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // (-k * u) ^ c  ->  (-1) ^ c * (k * u) ^ c  for k > 0 and u known >= 0,
  // right on the principal branch: with a > 0, (-a)^(1/2) = i*a^(1/2)
  if (
    ismultiply(base) &&
    isrational(exponent) &&
    isnegativenumber(cadr(base)) &&
    base.tail().slice(1).every((f) => isReal(f) && isNegative(f) === false)
  ) {
    return multiply(
      power(Constants.negOne, exponent),
      power(negate(base), exponent)
    );
  }

  // (a ^ b) ^ c  ->  a ^ (b * c)
  // note that we can't in general do this, for example
  // sqrt(x^y) !=  x^(1/2 y) (counterexample x = -1)
  // BUT we can carve-out here some cases where this
  // transformation is correct
  // simple numeric check to see if a is a number > 0
  let is_a_moreThanZero = false;
  if (isNumericAtom(cadr(base))) {
    is_a_moreThanZero =
      sign(compare_numbers(cadr(base) as Num | Double, Constants.zero)) > 0;
  }

  // also when c is an integer by the assumptions, or when a > 0 and b is
  // real (then a^b > 0 and log(a^b) = b*log(a))
  if (
    ispower(base) && // when c is an integer
    (isinteger(exponent) ||
      is_a_moreThanZero || // when a is >= 0
      isInteger(exponent) ||
      (isPositive(cadr(base)) && isReal(caddr(base))))
  ) {
    const result = power(cadr(base), multiply(caddr(base), exponent));
    if (DEBUG_POWER) {
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // (a^b)^c with b even and b*c = +-1 is abs(a)^(b*c)
  let b_isEven_and_c_isItsInverse = false;
  let isThisOne: U;
  if (iseveninteger(caddr(base)) && isReal(cadr(base))) {
    isThisOne = multiply(caddr(base), exponent);
    if (isone(isThisOne)) {
      b_isEven_and_c_isItsInverse = true;
    }
  }

  if (ispower(base) && b_isEven_and_c_isItsInverse) {
    const result = power(abs(cadr(base)), isThisOne);
    if (DEBUG_POWER) {
      console.log(
        '   power: car(base) == symbol(POWER) && b_isEven_and_c_isItsInverse '
      );
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  //  when expanding,
  //  (a + b) ^ n  ->  (a + b) * (a + b) ...
  if (defs.expanding && isadd(base) && isNumericAtom(exponent)) {
    const n = nativeInt(exponent);
    if (n > 1 && !isNaN(n)) {
      if (DEBUG_POWER) {
        console.log(
          '   power: expanding && isadd(base) && isNumericAtom(exponent) '
        );
      }
      let result = power_sum(n, base);
      if (DEBUG_POWER) {
        console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
      }
      return result;
    }
  }

  //  sin(x) ^ 2n -> (1 - cos(x) ^ 2) ^ n
  if (
    defs.trigmode === 1 &&
    car(base) === symbol(SIN) &&
    iseveninteger(exponent)
  ) {
    const result = power(
      subtract(Constants.one, power(cosine(cadr(base)), integer(2))),
      multiply(exponent, rational(1, 2))
    );
    if (DEBUG_POWER) {
      console.log(
        '   power: trigmode == 1 && car(base) == symbol(SIN) && iseveninteger(exponent) '
      );
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  //  cos(x) ^ 2n -> (1 - sin(x) ^ 2) ^ n
  if (
    defs.trigmode === 2 &&
    car(base) === symbol(COS) &&
    iseveninteger(exponent)
  ) {
    const result = power(
      subtract(Constants.one, power(sine(cadr(base)), integer(2))),
      multiply(exponent, rational(1, 2))
    );
    if (DEBUG_POWER) {
      console.log(
        '   power: trigmode == 2 && car(base) == symbol(COS) && iseveninteger(exponent) '
      );
      console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
    }
    return result;
  }

  // complex number? (just number, not expression)
  if (iscomplexnumber(base)) {
    if (DEBUG_POWER) {
      console.log(' power - handling the case (a + ib) ^ n');
    }
    // integer power?
    // n will be negative here, positive n already handled
    if (isinteger(exponent)) {
      //               /        \  n
      //         -n   |  a - ib  |
      // (a + ib)   = | -------- |
      //              |   2   2  |
      //               \ a + b  /
      const p3 = conjugate(base);

      // gets the denominator
      let result = divide(p3, multiply(p3, base));

      if (!isone(exponent)) {
        result = power(result, negate(exponent));
      }

      if (DEBUG_POWER) {
        console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
      }
      return result;
    }

    // noninteger or floating power?
    if (isNumericAtom(exponent)) {
      // remember that the "double" type is
      // toxic, i.e. it propagates, so we do
      // need to evaluate PI to its actual double
      // value

      //console.log("power pushing PI when base is: " + base + " and exponent is:" + exponent)
      const pi =
        defs.evaluatingAsFloats ||
          (iscomplexnumberdouble(base) && isdouble(exponent))
          ? double(Math.PI)
          : symbol(PI);
      let tmp = multiply(
        power(abs(base), exponent),
        power(Constants.negOne, divide(multiply(arg(base), exponent), pi))
      );

      // if we calculate the power making use of arctan:
      //  * it prevents nested radicals from being simplified
      //  * results become really hard to manipulate afterwards
      //  * we can't go back to other forms.
      // so leave the power as it is.
      if (avoidCalculatingPowersIntoArctans && Find(tmp, symbol(ARCTAN))) {
        tmp = makeList(symbol(POWER), base, exponent);
      }

      if (DEBUG_POWER) {
        console.log(`   power of ${inputBase} ^ ${inputExp}: ${tmp}`);
      }
      return tmp;
    }
  }

  const polarResult = simplify_polar(exponent);
  if (polarResult !== undefined) {
    if (DEBUG_POWER) {
      console.log('   power: using simplify_polar');
    }
    return polarResult;
  }

  const result = makeList(symbol(POWER), base, exponent);
  if (DEBUG_POWER) {
    console.log('   power: nothing can be done ');
    console.log(`   power of ${inputBase} ^ ${inputExp}: ${result}`);
  }
  return result;
}

//-----------------------------------------------------------------------------
//
//  Compute the power of a sum
//
//  Input:    p1  sum
//
//      n  exponent
//
//  Output:    Result on stack
//
//  Note:
//
//  Uses the multinomial series (see Math World)
//
//                          n              n!          n1   n2       nk
//  (a1 + a2 + ... + ak)  = sum (--------------- a1   a2   ... ak  )
//                               n1! n2! ... nk!
//
//  The sum is over all n1 ... nk such that n1 + n2 + ... + nk = n.
//
//-----------------------------------------------------------------------------

// first index is the term number 0..k-1, second index is the exponent 0..n
//define A(i, j) frame[(i) * (n + 1) + (j)]
function power_sum(n: number, p1: U): U {
  const a: number[] = [];
  // number of terms in the sum
  const k = length(p1) - 1;

  // array of powers
  const powers: U[] = [];

  p1 = cdr(p1);
  for (let i = 0; i < k; i++) {
    for (let j = 0; j <= n; j++) {
      powers[i * (n + 1) + j] = power(car(p1), integer(j));
    }
    p1 = cdr(p1);
  }

  p1 = factorial(integer(n));

  for (let i = 0; i < k; i++) {
    a[i] = 0;
  }

  return multinomial_sum(k, n, a, 0, n, powers, p1, Constants.zero);
}

//-----------------------------------------------------------------------------
//
//  Compute multinomial sum
//
//  Input:    k  number of factors
//
//      n  overall exponent
//
//      a  partition array
//
//      i  partition array index
//
//      m  partition remainder
//
//      p1  n!
//
//      A  factor array
//
//  Output:    Result on stack
//
//  Note:
//
//  Uses recursive descent to fill the partition array.
//
//-----------------------------------------------------------------------------
function multinomial_sum(
  k: number,
  n: number,
  a: number[],
  i: number,
  m: number,
  A: U[],
  p1: U,
  p2: U
): U {
  if (i < k - 1) {
    for (let j = 0; j <= m; j++) {
      a[i] = j;
      p2 = multinomial_sum(k, n, a, i + 1, m - j, A, p1, p2);
    }
    return p2;
  }

  a[i] = m;

  // coefficient
  let temp = p1;
  for (let j = 0; j < k; j++) {
    temp = divide(temp, factorial(integer(a[j])));
  }

  // factors
  for (let j = 0; j < k; j++) {
    temp = multiply(temp, A[j * (n + 1) + a[j]]);
  }

  return add(p2, temp);
}

// exp(n/2 i pi) ?
// clobbers p3
function simplify_polar(exponent: U): U | undefined {
  let n = isquarterturn(exponent);
  switch (n) {
    case 0:
      // do nothing
      break;
    case 1:
      return Constants.one;
    case 2:
      return Constants.negOne;
    case 3:
      return Constants.imaginaryunit;
    case 4:
      return negate(Constants.imaginaryunit);
  }

  if (isadd(exponent)) {
    let p3 = cdr(exponent);
    while (iscons(p3)) {
      n = isquarterturn(car(p3));
      if (n) {
        break;
      }
      p3 = cdr(p3);
    }
    let arg1: U;
    switch (n) {
      case 0:
        return undefined;
      case 1:
        arg1 = Constants.one;
        break;
      case 2:
        arg1 = Constants.negOne;
        break;
      case 3:
        arg1 = Constants.imaginaryunit;
        break;
      case 4:
        arg1 = negate(Constants.imaginaryunit);
        break;
    }
    return multiply(arg1, exponential(subtract(exponent, car(p3))));
  }

  return undefined;
}

// exp(s) where terms of s of the shape k*log(m) (one log factor) turn into
// the factors m^k; undefined when s has no such term.
function expOfLogTerms(s: U): U | undefined {
  const terms = isadd(s) ? s.tail() : [s];
  let product: U = Constants.one;
  let rest: U = Constants.zero;
  let found = false;
  for (const t of terms) {
    const factors = ismultiply(t) ? t.tail() : [t];
    const logs = factors.filter((f) => car(f) === symbol(LOG));
    if (logs.length !== 1) {
      rest = add(rest, t);
      continue;
    }
    found = true;
    const k = factors
      .filter((f) => f !== logs[0])
      .reduce((acc: U, f: U) => multiply(acc, f), Constants.one);
    product = multiply(product, power(cadr(logs[0]), k));
  }
  if (!found) {
    return undefined;
  }
  return multiply(product, power(symbol(E), rest));
}
