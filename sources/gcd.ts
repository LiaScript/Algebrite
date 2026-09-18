import {
  caddr,
  cadr,
  car,
  cdr,
  Constants, defs,
  doexpand,
  isadd,
  iscons,
  ismultiply,
  isNumericAtom,
  ispower,
  isrational, MULTIPLY, Num, U
} from '../runtime/defs';
import { symbol } from '../runtime/symbol';
import { equal, lessp } from '../sources/misc';
import { subtract } from './add';
import { gcd_numbers } from './bignum';
import { Eval } from './eval';
import { factorpoly } from './factorpoly';
import { gcdMultivariate } from './gcd_multivariate';
import {
  isnegativenumber,
  isplusone,
  ispolyexpandedform,
  isunivarpolyfactoredorexpandedform,
  isZeroAtomOrTensor,
} from './is';
import { Find } from '../runtime/find';
import { collectUserSymbols } from '../runtime/symbol';
import { coeff } from './coeff';
import { guess } from './guess';
import { divpoly } from './quotient';
import { makeList } from './list';
import { divide, multiply } from './multiply';
import { power } from './power';

// Greatest common denominator
// Polynomials with rational coefficients go through Euclid's algorithm
// (gcd_rational_polys in one variable, gcd_multivariate.ts in several),
// everything else is compared term by term and factor by factor.
export function Eval_gcd(p1: U) {
  p1 = cdr(p1);
  let result = Eval(car(p1));

  if (iscons(p1)) {
    result = p1.tail().reduce((acc: U, p: U) => gcd(acc, Eval(p)), result);
  }
  return result;
}

export function gcd(p1: U, p2: U): U {
  return doexpand(gcd_main, p1, p2);
}

function gcd_main(p1: U, p2: U): U {
  let polyVar: U | false;

  if (equal(p1, p2)) {
    return p1;
  }

  if (isrational(p1) && isrational(p2)) {
    return gcd_numbers(p1, p2);
  }

  if (isZeroAtomOrTensor(p1)) {
    return p2;
  }

  if (isZeroAtomOrTensor(p2)) {
    return p1;
  }

  const euclid = gcd_rational_polys(p1, p2) || gcdMultivariate(p1, p2);
  if (euclid) {
    return euclid;
  }

  if (polyVar = areunivarpolysfactoredorexpandedform(p1, p2)) {
    return gcd_polys(p1, p2, polyVar)
  }

  if (isadd(p1) && isadd(p2)) {
    return gcd_sum_sum(p1, p2);
  }

  // a sum against a power of the same sum, gcd(x+y,(x+y)^2): the content
  // reduction below would lose the sum
  if (ispower(p1) || ispower(p2)) {
    const g = gcd_powers_with_same_base(p1, p2);
    if (!isplusone(g)) {
      return g;
    }
  }

  if (isadd(p1)) {
    p1 = gcd_sum(p1);
  }

  if (isadd(p2)) {
    p2 = gcd_sum(p2);
  }

  if (ismultiply(p1)) {
    return gcd_sum_product(p1, p2);
  }

  if (ismultiply(p2)) {
    return gcd_product_sum(p1, p2);
  }

  if (ismultiply(p1) && ismultiply(p2)) {
    return gcd_product_product(p1, p2);
  }

  return gcd_powers_with_same_base(p1, p2);
}

// TODO this should probably be in "is"?
export function areunivarpolysfactoredorexpandedform(p1:U, p2:U):U {
 let polyVar: U|false;
  if (polyVar = isunivarpolyfactoredorexpandedform(p1)){
    if (isunivarpolyfactoredorexpandedform(p2, polyVar)){
      return polyVar;
    }
  }
}

function gcd_polys (p1:U, p2:U, polyVar:U) {
  p1 = factorpoly(p1, polyVar);
  p2 = factorpoly(p2, polyVar);

  if (ismultiply(p1)  || ismultiply(p2)) {
    if (!ismultiply(p1)) {
      p1 = makeList(
          symbol(MULTIPLY),
          p1,
          Constants.one
      );
    }
    if (!ismultiply(p2)) {
      p2 = makeList(
          symbol(MULTIPLY),
          p2,
          Constants.one
      );
    }
  }
  if (ismultiply(p1) && ismultiply(p2)) {
    return gcd_product_product(p1,p2);
  }
  return gcd_powers_with_same_base(p1, p2);
}

function gcd_product_product(p1:U, p2:U) {

  let p3: U = cdr(p1)
  let p4: U = cdr(p2)
  if (iscons(p3)) {
    return [...p3].reduce(
        (acc: U, pOuter: U) => {
              if (iscons(p4)) {
                return multiply(acc, [...p4].reduce(
                    (innerAcc: U, pInner: U) =>
                        multiply(innerAcc, gcd(pOuter, pInner))
                    , Constants.one
                ));
              }
        }
        , Constants.one
    );
  }

  // another, (maybe more readable?) version:

  /*
  let totalProduct:U = Constants.one;
  let p3 = cdr(p1)
  while (iscons(p3)) {

    let p4: U = cdr(p2)

    if (iscons(p4)) {
      totalProduct = [...p4].reduce(
          ((acc: U, p: U) =>
              multiply(gcd(car(p3), p), acc))
          , totalProduct
      );
    }

    p3 = cdr(p3);
  }

  return totalProduct;
  */


}

function gcd_powers_with_same_base(base1: U, base2: U): U {
  let exponent1: U, exponent2: U, p6: U;
  const ispow1 = ispower(base1);
  const ispow2 = ispower(base2);
  if (ispower(base1)) {
    exponent1 = caddr(base1); // exponent
    base1 = cadr(base1); // base
  } else {
    exponent1 = Constants.one;
  }

  if (ispower(base2)) {
    exponent2 = caddr(base2); // exponent
    base2 = cadr(base2); // base
  } else {
    exponent2 = Constants.one;
  }

  // a plain -1 is a sign, not a power of the base -1: taking it as one
  // made gcd(i, -1*i) = gcd(i,-1)*gcd(i,i) = i*i = -1
  // A number and a root of it have no common factor here: 3 and 3^(1/2)
  // stay two factors of a product, so the gcd of 3*3^(1/2)*z and
  // 3*3^(1/2)*a, the product of the gcds of all pairs, came out as
  // 9*3^(1/2). condense then left a fraction in the sum, and numerator and
  // denominator recursed forever between the two forms.
  if (!equal(base1, base2) || (isNumericAtom(base1) && ispow1 !== ispow2)) {
    return Constants.one;
  }

  // are both exponents numerical?
  if (isNumericAtom(exponent1) && isNumericAtom(exponent2)) {
    const exponent = lessp(exponent1, exponent2) ? exponent1 : exponent2;
    return power(base1, exponent);
  }

  // are the exponents multiples of eah other?
  let p5 = divide(exponent1, exponent2);

  if (isNumericAtom(p5)) {
    // choose the smallest exponent
    p5 =
      ismultiply(exponent1) && isNumericAtom(cadr(exponent1))
        ? cadr(exponent1)
        : Constants.one;
    p6 =
      ismultiply(exponent2) && isNumericAtom(cadr(exponent2))
        ? cadr(exponent2)
        : Constants.one;
    const exponent = lessp(p5, p6) ? exponent1 : exponent2;
    return power(base1, exponent);
  }

  p5 = subtract(exponent1, exponent2);

  if (!isNumericAtom(p5)) {
    return Constants.one;
  }

  // can't be equal because of test near beginning
  const exponent = isnegativenumber(p5) ? exponent1 : exponent2;
  return power(base1, exponent);
}

// Univariate polynomials with rational coefficients: Euclid's algorithm,
// which unlike factoring also finds irrational common factors such as x^2-2.
// The result is the primitive gcd times the gcd of the contents.
// Only for expanded sums: factored products go through gcd_polys, so that
// callers dividing by the gcd (rationalize) can cancel whole factors.
function gcd_rational_polys(p1: U, p2: U): U | undefined {
  if (!isadd(p1) || !isadd(p2)) {
    return;
  }
  const syms: U[] = [];
  collectUserSymbols(p1, syms);
  collectUserSymbols(p2, syms);
  const X = syms[0];
  if (
    syms.length !== 1 ||
    !ispolyexpandedform(p1, X) ||
    !ispolyexpandedform(p2, X)
  ) {
    return;
  }
  let a: U = p1;
  let b: U = p2;
  const ca = coeff(a, X);
  const cb = coeff(b, X);
  if (![...ca, ...cb].every(isrational)) {
    return;
  }
  const content = (cs: U[]) => (cs as Num[]).reduce(gcd_numbers);
  while (!isZeroAtomOrTensor(b)) {
    [a, b] = [b, subtract(a, multiply(b, divpoly(a, b, X)))];
  }
  const cg = coeff(a, X);
  a = divide(a, cg[cg.length - 1]); // monic
  a = divide(a, content(coeff(a, X))); // primitive, leading term positive
  return multiply(gcd_numbers(content(ca), content(cb)), a);
}

// in this case gcd is used as a composite function, i.e. gcd(gcd(gcd...
function gcd_sum_sum(p1: U, p2: U): U {
  const p3 = gcd_sum(p1);
  const p4 = gcd_sum(p2);

  const p5 = divide(p1, p3);
  const p6 = divide(p2, p4);

  if (equal(p5, p6)) {
    return multiply(p5, gcd(p3, p4));
  }

  return multiply(gcd(p3, p4), gcd_by_factoring(p5, p6));
}

// Multivariate sums: factor both in one variable and compare the factors,
// e.g. gcd(x^2-y^2,x+y). Only used when a factorization splits something
// off, otherwise the recursion through gcd_polys would not shrink.
function gcd_by_factoring(p1: U, p2: U): U {
  const X = guess(p1);
  if (!ispolyexpandedform(p1, X) || !ispolyexpandedform(p2, X)) {
    return Constants.one;
  }
  const f1 = factorpoly(p1, X);
  const f2 = factorpoly(p2, X);
  const splits = (f: U) =>
    ispower(f) ||
    (ismultiply(f) &&
      (f.tail().some(ispower) ||
        f.tail().filter((t) => Find(t, X)).length > 1));
  if (!splits(f1) && !splits(f2)) {
    return Constants.one;
  }
  return gcd_polys(f1, f2, X);
}

function gcd_sum(p: U): U {
  return iscons(p) ? p.tail().reduce(gcd) : car(cdr(p));
}

function gcd_term_term(p1: U, p2:U): U {
  if (!iscons(p1) || !iscons(p2)) {
    return Constants.one;
  }
  return p1.tail().reduce((a: U, b: U) => {
    return p2.tail().reduce((x: U, y: U) => multiply(x, gcd(b, y)), a);
  }, Constants.one);
}

function gcd_sum_product(p1: U, p2: U): U {
  return iscons(p1)
    ? p1.tail().reduce((a: U, b: U) => multiply(a, gcd(b, p2)), Constants.one)
    : Constants.one;
}

function gcd_product_sum(p1: U, p2: U): U {
  return iscons(p2)
    ? p2.tail().reduce((a: U, b: U) => multiply(a, gcd(p1, b)), Constants.one)
    : Constants.one;
}
