import {
  caddr,
  cadr,
  Constants,
  iscons,
  ismultiply,
  isNumericAtom,
  ispower,
  issymbol,
  NIL,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { equal, lessp } from '../sources/misc';
import { Eval } from './eval';
import { guess } from './guess';
import { isposint, ispolyfactoredorexpandedform } from './is';
import { add } from './add';
import { multiply } from './multiply';
import { stop } from '../runtime/run';

/* deg =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
p,x

General description
-------------------
Returns the degree of polynomial p(x).

*/
export function Eval_degree(p1: U) {
  const poly = Eval(cadr(p1));
  p1 = Eval(caddr(p1));
  const variable = p1 === symbol(NIL) ? guess(poly) : p1;
  checkpoly('deg', poly, variable);
  return degree(poly, variable);
}

// degree and leading coefficient only make sense for polynomials
export function checkpoly(name: string, poly: U, variable: U) {
  if (!issymbol(variable) || !ispolyfactoredorexpandedform(poly, variable)) {
    stop(`${name}: 1st argument is not a polynomial in the variable ${variable}`);
  }
}

//-----------------------------------------------------------------------------
//
//  Find the degree of a polynomial
//
//  Input:    POLY    p(x)
//            X       x
//
//  Output:    Result
//
//  Note: Also works on factored forms, (x+1)^2*(x-1) has degree 3. For
//  anything else, e.g. sin(x), it is the largest numerical power of x
//  found in it.
//
//-----------------------------------------------------------------------------
export function degree(POLY: U, X: U): U {
  if (equal(POLY, X)) {
    return Constants.one;
  }
  if (ispower(POLY) && isNumericAtom(caddr(POLY))) {
    if (equal(cadr(POLY), X)) {
      return lessp(Constants.zero, caddr(POLY)) ? caddr(POLY) : Constants.zero;
    }
    if (isposint(caddr(POLY))) {
      return multiply(degree(cadr(POLY), X), caddr(POLY));
    }
  }
  if (ismultiply(POLY)) {
    return POLY.tail().reduce((a: U, b: U) => add(a, degree(b, X)), Constants.zero);
  }
  if (iscons(POLY)) {
    return POLY.tail().reduce((a: U, b: U) => {
      const d = degree(b, X);
      return lessp(a, d) ? d : a;
    }, Constants.zero);
  }
  return Constants.zero;
}
