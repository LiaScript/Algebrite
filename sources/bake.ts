import {
  ADD,
  cadr,
  car,
  Cons,
  doexpand,
  FOR,
  FUNCTION,
  isadd,
  iscons,
  ismultiply,
  ispower,
  istensor,
  MULTIPLY,
  POWER,
  SYMBOL_S,
  SYMBOL_T,
  SYMBOL_X,
  SYMBOL_Y,
  SYMBOL_Z,
  U,
} from '../runtime/defs';
import { integer } from './bignum';
import { coeff } from './coeff';
import { equaln, ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import {symbol} from "../runtime/symbol";

export function bake(p1: U): U {
  return doexpand(_bake, p1);
}

function _bake(p1: U): U {
  // x+[3,4]: a tensor among the terms is no polynomial coefficient
  if (isadd(p1) && p1.tail().some(istensor)) {
    return p1;
  }
  // A product with a sum in it, 4*z*(3*y-5)^2, is a polynomial in z with the
  // coefficient 4*(3*y-5)^2, which bake_poly would multiply out: the result
  // of factor came back as (100-120*y+36*y^2)*z. Each factor on its own.
  if (ismultiply(p1) && p1.tail().some((f) => isadd(f) || (ispower(f) && isadd(cadr(f))))) {
    return makeList(car(p1), ...p1.tail().map(bake));
  }
  const s = ispolyexpandedform(p1, symbol(SYMBOL_S));
  const t = ispolyexpandedform(p1, symbol(SYMBOL_T));
  const x = ispolyexpandedform(p1, symbol(SYMBOL_X));
  const y = ispolyexpandedform(p1, symbol(SYMBOL_Y));
  const z = ispolyexpandedform(p1, symbol(SYMBOL_Z));

  let result: U;
  if (s && !t && !x && !y && !z) {
    result = bake_poly(p1, symbol(SYMBOL_S));
  } else if (!s && t && !x && !y && !z) {
    result = bake_poly(p1, symbol(SYMBOL_T));
  } else if (!s && !t && x && !y && !z) {
    result = bake_poly(p1, symbol(SYMBOL_X));
  } else if (!s && !t && !x && y && !z) {
    result = bake_poly(p1, symbol(SYMBOL_Y));
  } else if (!s && !t && !x && !y && z) {
    result = bake_poly(p1, symbol(SYMBOL_Z));
    // don't bake the contents of some constructs such as "for"
    // because we don't want to evaluate the body of
    // such constructs "statically", i.e. without fully running
    // the loops. Same for the body of a user function: it is only
    // evaluated when the function is called.
  } else if (
    iscons(p1) &&
    car(p1) !== symbol(FOR) &&
    car(p1) !== symbol(FUNCTION)
  ) {
    result = makeList(car(p1), ...p1.tail().map(bake));
  } else {
    result = p1;
  }

  return result;
}

export function polyform(p1: U, p2: U): U {
  if (ispolyexpandedform(p1, p2)) {
    return bake_poly(p1, p2);
  }
  if (iscons(p1)) {
    return makeList(car(p1), ...p1.tail().map((el) => polyform(el, p2)));
  }

  return p1;
}

function bake_poly(poly: U, x: U): U {
  const k = coeff(poly, x);
  const result: U[] = [];
  for (let i = k.length - 1; i >= 0; i--) {
    const term = k[i];
    result.push(...bake_poly_term(i, term, x));
  }
  if (result.length > 1) {
    return new Cons(symbol(ADD), makeList(...result));
  }
  return result[0];
}

// p1 points to coefficient of p2 ^ k

// k is an int
function bake_poly_term(k: number, coefficient: U, term: U): U[] {
  if (isZeroAtomOrTensor(coefficient)) {
    return [];
  }

  // constant term?
  if (k === 0) {
    if (isadd(coefficient)) {
      return coefficient.tail();
    }
    return [coefficient];
  }

  const result: U[] = [];
  // coefficient
  if (ismultiply(coefficient)) {
    result.push(...coefficient.tail());
  } else if (!equaln(coefficient, 1)) {
    result.push(coefficient);
  }

  // x ^ k
  if (k === 1) {
    result.push(term);
  } else {
    result.push(makeList(symbol(POWER), term, integer(k)));
  }
  if (result.length > 1) {
    return [makeList(symbol(MULTIPLY), ...result)];
  }
  return result;
}
