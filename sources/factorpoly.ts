import { lcm } from './lcm';
import bigInt from 'big-integer';
import {
  cadr,
  Constants,
  DEBUG,
  defs,
  isadd,
  ismultiply,
  isrational,
  issymbol,
  noexpand,
  Num,
  U,
} from '../runtime/defs';
import { factorZ } from './factor_zassenhaus';
import { factorKronecker } from './factor_multivariate';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { equal } from '../sources/misc';
import { add, subtract } from './add';
import { integer, nativeInt, rational } from './bignum';
import { coeff } from './coeff';
import { yycondense } from './condense';
import { conjugate } from './conj';
import { denominator } from './denominator';
import { ydivisors } from './divisors';
import {
  isfloating,
  isinteger,
  isimaginarynumber,
  isnegativeterm,
  ispolyexpandedform,
  isZeroAtomOrTensor,
} from './is';
import {
  divide,
  multiply,
  multiply_noexpand,
  negate,
  negate_noexpand,
  reciprocate,
} from './multiply';
import { power } from './power';
import { print_list } from './print';
import { divpoly } from './quotient';
import { rect } from './rect';

// Factor a polynomial

//define POLY p1
//define X p2
//define Z p3
//define A p4
//define B p5
//define Q p6
//define RESULT p7
//define FACTOR p8

export function factorpoly(POLY: U, X: U): U {
  if (!Find(POLY, X)) {
    return POLY;
  }

  if (!ispolyexpandedform(POLY, X)) {
    return POLY;
  }

  if (!issymbol(X)) {
    return POLY;
  }

  // i * (real polynomial): the rational root search needs real
  // coefficients, so factor the real polynomial and put i back in front
  const cs = coeff(POLY, X);
  if (cs.every((c) => isZeroAtomOrTensor(c) || isimaginarynumber(c))) {
    const minusI = negate(Constants.imaginaryunit);
    const realPoly = cs.reduce(
      (acc: U, c: U, k: number) =>
        add(acc, multiply(multiply(c, minusI), power(X, integer(k)))),
      Constants.zero
    );
    return multiply_noexpand(
      Constants.imaginaryunit,
      yyfactorpoly(realPoly, X)
    );
  }

  return yyfactorpoly(POLY, X);
}

//-----------------------------------------------------------------------------
//
//  Input:    p1    true polynomial
//            p2    free variable
//
//  Output:    factored polynomial
//
//-----------------------------------------------------------------------------
function yyfactorpoly(p1: U, p2: U): U {
  let p4: U, p5: U, p8: U;
  let prev_expanding: boolean;

  if (isfloating(p1)) {
    stop('floating point numbers in polynomial');
  }

  // 2*x*y+2*x*z: the number comes out first, the root search would put it
  // into a factor 2*y+2*z
  const content = numericContent(p1);
  if (content) {
    p1 = divide(p1, content);
  }

  const polycoeff = coeff(p1, p2);

  let factpoly_expo = polycoeff.length - 1;

  let p7 = rationalize_coefficients(polycoeff);
  if (content) {
    p7 = multiply(p7, content);
  }

  // integer coefficients: the complete algorithm, and much faster than the
  // searches below, which stay for symbolic coefficients
  const complete = factorRemainder(p1, p2, polycoeff);
  if (complete) {
    return complete.reduce(multiply_noexpand, p7);
  }

  // for univariate polynomials we could do factpoly_expo > 1
  let whichRootsAreWeFinding = 'real';
  let remainingPoly: U = null;
  let quadratic: U;
  // the searches need the divisors of the first and the last coefficient:
  // beyond 2^31 they stop with "number too big to factor"
  const tooBig = (c: U) => isinteger(c) && !isFinite(nativeInt(c));
  while (factpoly_expo > 0) {
    var foundComplexRoot: boolean, foundRealRoot: boolean;
    if (
      !isZeroAtomOrTensor(polycoeff[0]) &&
      (tooBig(polycoeff[0]) || tooBig(polycoeff[factpoly_expo]))
    ) {
      break;
    }
    if (isZeroAtomOrTensor(polycoeff[0])) {
      p4 = Constants.one;
      p5 = Constants.zero;
    } else {
      //console.log("trying to find a " + whichRootsAreWeFinding + " root")
      if (whichRootsAreWeFinding === 'real') {
        [foundRealRoot, p4, p5] = get_factor_from_real_root(
          polycoeff,
          factpoly_expo,
          p2,
          p4,
          p5
        );
      } else if (whichRootsAreWeFinding === 'complex') {
        [foundComplexRoot, p4] = get_factor_from_complex_root(
          remainingPoly,
          polycoeff,
          factpoly_expo
        );
        quadratic = foundComplexRoot
          ? multiply(subtract(p4, p2), subtract(conjugate(p4), p2))
          : get_quadratic_factor(polycoeff, factpoly_expo, p2);
        foundComplexRoot = quadratic !== undefined;
      }
    }

    if (whichRootsAreWeFinding === 'real') {
      if (foundRealRoot === false) {
        whichRootsAreWeFinding = 'complex';
        continue;
      } else {
        p8 = add(multiply(p4, p2), p5); // A, x, B

        if (DEBUG) {
          console.log(`success\nFACTOR=${p8}`);
        }

        // factor out negative sign (not req'd because p4 > 1)
        //if 0
        /*
        if (isnegativeterm(p4))
          push(p8)
          negate()
          p8 = pop()
          push(p7)
          negate_noexpand()
          p7 = pop()
        */
        //endif

        // p7 is the part of the polynomial that was factored so far,
        // add the newly found factor to it. Note that we are not actually
        // multiplying the polynomials fully, we are just leaving them
        // expressed as (P1)*(P2), we are not expanding the product.
        p7 = multiply_noexpand(p7, p8);

        // ok now on stack we have the coefficients of the
        // remaining part of the polynomial still to factor.
        // Divide it by the newly-found factor so that
        // the stack then contains the coefficients of the
        // polynomial part still left to factor.
        yydivpoly(p4, p5, polycoeff, factpoly_expo);

        while (factpoly_expo && isZeroAtomOrTensor(polycoeff[factpoly_expo])) {
          factpoly_expo--;
        }

        let temp: U = Constants.zero;
        for (let i = 0; i <= factpoly_expo; i++) {
          // p2: the free variable
          temp = add(temp, multiply(polycoeff[i], power(p2, integer(i))));
        }
        remainingPoly = temp;
      }
      //console.log("real branch remainingPoly: " + remainingPoly)
    } else if (whichRootsAreWeFinding === 'complex') {
      if (foundComplexRoot === false) {
        break;
      } else {
        p8 = quadratic;

        //if (factpoly_expo > 0 && isnegativeterm(polycoeff[factpoly_expo]))
        //  negate()
        //  negate_noexpand()

        if (DEBUG) {
          console.log(`success\nFACTOR=${p8}`);
        }

        // factor out negative sign (not req'd because p4 > 1)
        //if 0
        /*
        if (isnegativeterm(p4))
          push(p8)
          negate()
          p8 = pop()
          push(p7)
          negate_noexpand()
          p7 = pop()
        */
        //endif

        // p7 is the part of the polynomial that was factored so far,
        // add the newly found factor to it. Note that we are not actually
        // multiplying the polynomials fully, we are just leaving them
        // expressed as (P1)*(P2), we are not expanding the product.

        const previousFactorisation = p7;

        //console.log("previousFactorisation: " + previousFactorisation)

        p7 = multiply_noexpand(p7, p8);

        //console.log("new prospective factorisation: " + p7)

        // build the polynomial of the unfactored part
        //console.log("build the polynomial of the unfactored part factpoly_expo: " + factpoly_expo)

        if (remainingPoly == null) {
          let temp: U = Constants.zero;
          for (let i = 0; i <= factpoly_expo; i++) {
            // p2: the free variable
            temp = add(temp, multiply(polycoeff[i], power(p2, integer(i))));
          }
          remainingPoly = temp;
        }
        //console.log("original polynomial (dividend): " + remainingPoly)

        //push(dividend)
        //degree()
        //startingDegree = pop()

        //console.log("dividing " + stack[tos-1].toString() + " by " + p8)
        const X = p2;
        const divisor = p8;
        const dividend = remainingPoly;
        remainingPoly = divpoly(dividend, divisor, X);

        const checkingTheDivision = multiply(remainingPoly, p8);

        if (!equal(checkingTheDivision, dividend)) {
          //push(dividend)
          //gcd_sum()
          //console.log("gcd top of stack: " + stack[tos-1].toString())

          if (DEBUG) {
            console.log(
              "we found a polynomial based on complex root and its conj but it doesn't divide the poly, quitting"
            );
            console.log(
              `so just returning previousFactorisation times dividend: ${previousFactorisation} * ${dividend}`
            );
          }
          return multiply_noexpand(previousFactorisation, noexpand(yycondense, dividend));
        }

        //console.log("result: (still to be factored) " + remainingPoly)

        //push(remainingPoly)
        //degree()
        //remainingDegree = pop()

        /*
        if compare_numbers(startingDegree, remainingDegree)
          * ok even if we found a complex root that
          * together with the conjugate generates a poly in Z,
          * that doesn't mean that the division would end up in Z.
          * Example: 1+x^2+x^4+x^6 has +i and -i as one of its roots
          * so a factor is 1+x^2 ( = (x+i)*(x-i))
          * BUT 
        */
        // replace all coefficients: after a real factor was divided out,
        // polycoeff is longer than factpoly_expo + 1, and popping only that
        // many left a stale coefficient in front
        polycoeff.splice(0, polycoeff.length, ...coeff(remainingPoly, p2));

        factpoly_expo -= 2;
      }
    }
  }
  //console.log("factpoly_expo: " + factpoly_expo)

  // build the remaining unfactored part of the polynomial

  let temp: U = Constants.zero;
  for (let i = 0; i <= factpoly_expo; i++) {
    // p2: the free variable
    temp = add(temp, multiply(polycoeff[i], power(p2, integer(i))));
  }
  p1 = temp;

  if (DEBUG) {
    console.log(`POLY=${p1}`);
  }

  // factor out negative sign, before condensing: negate() would expand
  // a condensed -2*(x^2+x+1) back into 2*x^2+2*x+2

  if (factpoly_expo > 0 && isnegativeterm(polycoeff[factpoly_expo])) {
    p1 = negate(p1);
    p7 = negate_noexpand(p7);
  }

  // the complete algorithm gave up on the whole polynomial (too many
  // modular factors): with the small factors gone it may succeed
  const again =
    factpoly_expo >= 2
      ? factorRemainder(p1, p2, coeff(p1, p2)) // p1 may have changed sign
      : undefined;
  if (again && again.length > 2) {
    return again.reduce(multiply_noexpand, p7);
  }

  // several variables: the searches above miss x+y+z in x^2+2*x*y+y^2-z^2
  const multivariate =
    factpoly_expo > 0 ? factorKronecker(p1, p2) : undefined;
  if (multivariate) {
    return multivariate.reduce(multiply_noexpand, p7);
  }

  p1 = noexpand(yycondense, p1);

  p7 = multiply_noexpand(p7, p1);

  if (DEBUG) {
    console.log(`RESULT=${p7}`);
  }

  return p7;
}

function rationalize_coefficients(coefficients: U[]): U {
  // LCM of all polynomial coefficients
  let p7: U = Constants.one;
  for (const coeff of coefficients) {
    p7 = lcm(denominator(coeff), p7);
  }

  // multiply each coefficient by RESULT
  for (let i = 0; i < coefficients.length; i++) {
    coefficients[i] = multiply(p7, coefficients[i]);
  }

  // reciprocate RESULT
  p7 = reciprocate(p7);
  if (DEBUG) {
    console.log('rationalize_coefficients result');
  }
  return p7;
}
//console.log print_list(p7)

function get_factor_from_real_root(
  polycoeff: U[],
  factpoly_expo: number,
  p2: U,
  p4: U,
  p5: U
): [boolean, U, U] {
  let p1: U, p3: U, p6: U;

  if (DEBUG) {
    let temp: U = Constants.zero;
    for (let i = 0; i <= factpoly_expo; i++) {
      temp = add(temp, multiply(polycoeff[i], power(p2, integer(i))));
    }
    p1 = temp;
    console.log(`POLY=${p1}`);
  }

  const an = ydivisors(polycoeff[factpoly_expo]);

  const a0 = ydivisors(polycoeff[0]);

  if (DEBUG) {
    console.log('divisors of base term');
    for (let i = 0; i < a0.length; i++) {
      console.log(`, ${a0[i]}`);
    }
    console.log('divisors of leading term');
    for (let i = 0; i < an.length; i++) {
      console.log(`, ${an[i]}`);
    }
  }

  // try roots
  for (let rootsTries_i = 0; rootsTries_i < an.length; rootsTries_i++) {
    for (let rootsTries_j = 0; rootsTries_j < a0.length; rootsTries_j++) {
      //if DEBUG then console.log "nan: " + nan + " na0: " + na0 + " i: " + rootsTries_i + " j: " + rootsTries_j
      p4 = an[rootsTries_i];
      p5 = a0[rootsTries_j];

      p3 = negate(divide(p5, p4));

      p6 = Evalpoly(p3, polycoeff, factpoly_expo);

      if (DEBUG) {
        console.log(
          `try A=${p4}\n, B=${p5}\n, root ${p2}\n=-B/A=${p3}\n, POLY(${p3}\n)=${p6}`
        );
      }

      if (isZeroAtomOrTensor(p6)) {
        if (DEBUG) {
          console.log('get_factor_from_real_root returning true');
        }
        return [true, p4, p5];
      }

      p5 = negate(p5);

      p3 = negate(p3);

      p6 = Evalpoly(p3, polycoeff, factpoly_expo);

      if (DEBUG) {
        console.log(
          `try A=${p4}\n, B=${p5}\n, root ${p2}\n=-B/A=${p3}\n, POLY(${p3}\n)=${p6}`
        );
      }

      if (isZeroAtomOrTensor(p6)) {
        if (DEBUG) {
          console.log('get_factor_from_real_root returning true');
        }
        return [true, p4, p5];
      }
    }
  }

  if (DEBUG) {
    console.log('get_factor_from_real_root returning false');
  }
  return [false, p4, p5];
}

function get_factor_from_complex_root(
  remainingPoly: U,
  polycoeff: U[],
  factpoly_expo: number
): [boolean, U] {
  let p1: U, p4: U, p3: U, p6: U;

  if (factpoly_expo <= 2) {
    if (DEBUG) {
      console.log(
        'no more factoring via complex roots to be found in polynomial of degree <= 2'
      );
    }
    return [false, p4];
  }

  p1 = remainingPoly;
  if (DEBUG) {
    console.log(`complex root finding for POLY=${p1}`);
  }

  // trying -1^(2/3) which generates a polynomial in Z
  // generates x^2 + 2x + 1
  p4 = rect(power(Constants.negOne, rational(2, 3)));
  if (DEBUG) {
    console.log(`complex root finding: trying with ${p4}`);
  }
  p3 = p4;
  p6 = Evalpoly(p3, polycoeff, factpoly_expo);
  if (DEBUG) {
    console.log(`complex root finding result: ${p6}`);
  }
  if (isZeroAtomOrTensor(p6)) {
    if (DEBUG) {
      console.log('get_factor_from_complex_root returning true');
    }
    return [true, p4];
  }

  // trying 1^(2/3) which generates a polynomial in Z
  // http://www.wolframalpha.com/input/?i=(1)%5E(2%2F3)
  // generates x^2 - 2x + 1
  p4 = rect(power(Constants.one, rational(2, 3)));
  if (DEBUG) {
    console.log(`complex root finding: trying with ${p4}`);
  }
  p3 = p4;
  p6 = Evalpoly(p3, polycoeff, factpoly_expo);
  if (DEBUG) {
    console.log(`complex root finding result: ${p6}`);
  }
  if (isZeroAtomOrTensor(p6)) {
    if (DEBUG) {
      console.log('get_factor_from_complex_root returning true');
    }
    return [true, p4];
  }

  // trying some simple complex numbers. All of these
  // generate polynomials in Z
  for (let rootsTries_i = -10; rootsTries_i <= 10; rootsTries_i++) {
    for (let rootsTries_j = 1; rootsTries_j <= 5; rootsTries_j++) {
      p4 = rect(
        add(
          integer(rootsTries_i),
          multiply(integer(rootsTries_j), Constants.imaginaryunit)
        )
      );
      //console.log("complex root finding: trying simple complex combination: " + p4)

      const p3 = p4;

      const p6 = Evalpoly(p3, polycoeff, factpoly_expo);

      //console.log("complex root finding result: " + p6)
      if (isZeroAtomOrTensor(p6)) {
        if (DEBUG) {
          console.log(`found complex root: ${p6}`);
        }
        return [true, p4];
      }
    }
  }

  if (DEBUG) {
    console.log('get_factor_from_complex_root returning false');
  }
  return [false, p4];
}

// The complex roots tried above only cover some quadratic factors: x^2+2,
// 3*x^2+1 or real ones like x^2-2 were missed. Searches all integer
// quadratic factors a*x^2+b*x+c instead: a divides the leading coefficient,
// c the constant term, and the factor's values at 1 and -1, a+b+c and
// a-b+c, divide P(1) and P(-1). These are not zero because the rational
// roots have been divided out already. Degree >= 4 only: a quadratic
// factor of a cubic would come with a rational root.
function get_quadratic_factor(
  polycoeff: U[],
  n: number,
  X: U
): U | undefined {
  if (n < 4) {
    return;
  }
  const cs = polycoeff.slice(0, n + 1);
  const P1 = nativeInt(Evalpoly(Constants.one, cs, n));
  const Pm1 = nativeInt(Evalpoly(Constants.negOne, cs, n));
  // big values: factor_small_number could not produce the divisors
  if (
    !cs.every(isinteger) ||
    !isFinite(P1) ||
    !isFinite(Pm1) ||
    P1 === 0 ||
    Pm1 === 0 ||
    [cs[0], cs[n]].some((c) => !isFinite(nativeInt(c)))
  ) {
    return;
  }
  const divs = (c: U) => ydivisors(c).map(nativeInt);
  for (const a of divs(cs[n])) {
    for (const c0 of divs(cs[0])) {
      for (const c of [c0, -c0]) {
        for (const d0 of divs(integer(P1))) {
          for (const d of [d0, -d0]) {
            const b = d - a - c;
            if (Pm1 % (a - b + c) !== 0) {
              continue;
            }
            const q = add(
              multiply(integer(a), power(X, integer(2))),
              add(multiply(integer(b), X), integer(c))
            );
            if (dividesExactly(cs, n, [c, b, a])) {
              return q;
            }
          }
        }
      }
    }
  }
}

// does the quadratic d[0]+d[1]*x+d[2]*x^2 divide the polynomial with
// integer coefficients cs, leaving an integer quotient?
function dividesExactly(cs: U[], n: number, d: number[]): boolean {
  const r = cs.slice(0, n + 1);
  for (let i = n; i >= 2; i--) {
    const q = divide(r[i], integer(d[2]));
    if (!isinteger(q)) {
      return false;
    }
    r[i] = Constants.zero;
    r[i - 1] = subtract(r[i - 1], multiply(q, integer(d[1])));
    r[i - 2] = subtract(r[i - 2], multiply(q, integer(d[0])));
  }
  return isZeroAtomOrTensor(r[0]) && isZeroAtomOrTensor(r[1]);
}

//-----------------------------------------------------------------------------
//
//  Divide a polynomial by Ax+B
//
//  Input:  on stack:  polycoeff  Dividend coefficients
//
//      factpoly_expo    Degree of dividend
//
//      A (p4)    As above
//
//      B (p5)    As above
//
//  Output:   on stack: polycoeff  Contains quotient coefficients
//
//-----------------------------------------------------------------------------
function yydivpoly(p4: U, p5: U, polycoeff: U[], factpoly_expo: number) {
  let p6: U = Constants.zero;
  for (let i = factpoly_expo; i > 0; i--) {
    const divided = divide(polycoeff[i], p4);
    polycoeff[i] = p6;
    p6 = divided;
    polycoeff[i - 1] = subtract(polycoeff[i - 1], multiply(p6, p5));
  }
  polycoeff[0] = p6;
  if (DEBUG) {
    console.log('yydivpoly Q:');
  }
}
//console.log print_list(p6)

function Evalpoly(p3: U, polycoeff: U[], factpoly_expo: number): U {
  let temp: U = Constants.zero;
  for (let i = factpoly_expo; i >= 0; i--) {
    if (DEBUG) {
      console.log('Evalpoly top of stack:');
      console.log(print_list(temp));
    }
    temp = add(multiply(temp, p3), polycoeff[i]);
  }
  return temp;
}

// Integer coefficients: irreducible factors from factor_zassenhaus.ts.
// undefined: symbolic coefficients, or the search was given up.
function factorRemainder(p: U, X: U, cs: U[]): U[] | undefined {
  if (!cs.every(isinteger)) {
    return;
  }
  const result = factorZ(cs.map((c) => (c as Num).q.a));
  if (!result) {
    return;
  }
  const out: U[] = [new Num(result.content)];
  for (const [f, mult] of result.factors) {
    const poly = f.reduce(
      (sum: U, c, i) =>
        add(sum, multiply(new Num(c), power(X, integer(i)))),
      Constants.zero
    );
    for (let k = 0; k < mult; k++) {
      out.push(poly);
    }
  }
  return out;
}

// gcd of the numerators over lcm of the denominators of the coefficients of
// a sum, undefined if that is 1 or a coefficient is not rational
function numericContent(p: U): U | undefined {
  if (!isadd(p)) {
    return;
  }
  let num = bigInt.zero;
  let den = bigInt.one;
  for (const t of p.tail()) {
    const c = ismultiply(t) ? cadr(t) : t;
    const q = isrational(c) ? c : Constants.one;
    num = bigInt.gcd(num, q.a);
    den = bigInt.lcm(den, q.b);
  }
  return num.equals(1) && den.equals(1) ? undefined : new Num(num, den);
}
