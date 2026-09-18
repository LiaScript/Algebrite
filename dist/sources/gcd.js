"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areunivarpolysfactoredorexpandedform = exports.gcd = exports.Eval_gcd = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const misc_1 = require("../sources/misc");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const factorpoly_1 = require("./factorpoly");
const gcd_multivariate_1 = require("./gcd_multivariate");
const is_1 = require("./is");
const find_1 = require("../runtime/find");
const symbol_2 = require("../runtime/symbol");
const coeff_1 = require("./coeff");
const guess_1 = require("./guess");
const quotient_1 = require("./quotient");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
// Greatest common denominator
// Polynomials with rational coefficients go through Euclid's algorithm
// (gcd_rational_polys in one variable, gcd_multivariate.ts in several),
// everything else is compared term by term and factor by factor.
function Eval_gcd(p1) {
    p1 = defs_1.cdr(p1);
    let result = eval_1.Eval(defs_1.car(p1));
    if (defs_1.iscons(p1)) {
        result = p1.tail().reduce((acc, p) => gcd(acc, eval_1.Eval(p)), result);
    }
    return result;
}
exports.Eval_gcd = Eval_gcd;
function gcd(p1, p2) {
    return defs_1.doexpand(gcd_main, p1, p2);
}
exports.gcd = gcd;
function gcd_main(p1, p2) {
    let polyVar;
    if (misc_1.equal(p1, p2)) {
        return p1;
    }
    if (defs_1.isrational(p1) && defs_1.isrational(p2)) {
        return bignum_1.gcd_numbers(p1, p2);
    }
    if (is_1.isZeroAtomOrTensor(p1)) {
        return p2;
    }
    if (is_1.isZeroAtomOrTensor(p2)) {
        return p1;
    }
    const euclid = gcd_rational_polys(p1, p2) || gcd_multivariate_1.gcdMultivariate(p1, p2);
    if (euclid) {
        return euclid;
    }
    if (polyVar = areunivarpolysfactoredorexpandedform(p1, p2)) {
        return gcd_polys(p1, p2, polyVar);
    }
    if (defs_1.isadd(p1) && defs_1.isadd(p2)) {
        return gcd_sum_sum(p1, p2);
    }
    // a sum against a power of the same sum, gcd(x+y,(x+y)^2): the content
    // reduction below would lose the sum
    if (defs_1.ispower(p1) || defs_1.ispower(p2)) {
        const g = gcd_powers_with_same_base(p1, p2);
        if (!is_1.isplusone(g)) {
            return g;
        }
    }
    if (defs_1.isadd(p1)) {
        p1 = gcd_sum(p1);
    }
    if (defs_1.isadd(p2)) {
        p2 = gcd_sum(p2);
    }
    if (defs_1.ismultiply(p1)) {
        return gcd_sum_product(p1, p2);
    }
    if (defs_1.ismultiply(p2)) {
        return gcd_product_sum(p1, p2);
    }
    if (defs_1.ismultiply(p1) && defs_1.ismultiply(p2)) {
        return gcd_product_product(p1, p2);
    }
    return gcd_powers_with_same_base(p1, p2);
}
// TODO this should probably be in "is"?
function areunivarpolysfactoredorexpandedform(p1, p2) {
    let polyVar;
    if (polyVar = is_1.isunivarpolyfactoredorexpandedform(p1)) {
        if (is_1.isunivarpolyfactoredorexpandedform(p2, polyVar)) {
            return polyVar;
        }
    }
}
exports.areunivarpolysfactoredorexpandedform = areunivarpolysfactoredorexpandedform;
function gcd_polys(p1, p2, polyVar) {
    p1 = factorpoly_1.factorpoly(p1, polyVar);
    p2 = factorpoly_1.factorpoly(p2, polyVar);
    if (defs_1.ismultiply(p1) || defs_1.ismultiply(p2)) {
        if (!defs_1.ismultiply(p1)) {
            p1 = list_1.makeList(symbol_1.symbol(defs_1.MULTIPLY), p1, defs_1.Constants.one);
        }
        if (!defs_1.ismultiply(p2)) {
            p2 = list_1.makeList(symbol_1.symbol(defs_1.MULTIPLY), p2, defs_1.Constants.one);
        }
    }
    if (defs_1.ismultiply(p1) && defs_1.ismultiply(p2)) {
        return gcd_product_product(p1, p2);
    }
    return gcd_powers_with_same_base(p1, p2);
}
function gcd_product_product(p1, p2) {
    let p3 = defs_1.cdr(p1);
    let p4 = defs_1.cdr(p2);
    if (defs_1.iscons(p3)) {
        return [...p3].reduce((acc, pOuter) => {
            if (defs_1.iscons(p4)) {
                return multiply_1.multiply(acc, [...p4].reduce((innerAcc, pInner) => multiply_1.multiply(innerAcc, gcd(pOuter, pInner)), defs_1.Constants.one));
            }
        }, defs_1.Constants.one);
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
function gcd_powers_with_same_base(base1, base2) {
    let exponent1, exponent2, p6;
    const ispow1 = defs_1.ispower(base1);
    const ispow2 = defs_1.ispower(base2);
    if (defs_1.ispower(base1)) {
        exponent1 = defs_1.caddr(base1); // exponent
        base1 = defs_1.cadr(base1); // base
    }
    else {
        exponent1 = defs_1.Constants.one;
    }
    if (defs_1.ispower(base2)) {
        exponent2 = defs_1.caddr(base2); // exponent
        base2 = defs_1.cadr(base2); // base
    }
    else {
        exponent2 = defs_1.Constants.one;
    }
    // a plain -1 is a sign, not a power of the base -1: taking it as one
    // made gcd(i, -1*i) = gcd(i,-1)*gcd(i,i) = i*i = -1
    // A number and a root of it have no common factor here: 3 and 3^(1/2)
    // stay two factors of a product, so the gcd of 3*3^(1/2)*z and
    // 3*3^(1/2)*a, the product of the gcds of all pairs, came out as
    // 9*3^(1/2). condense then left a fraction in the sum, and numerator and
    // denominator recursed forever between the two forms.
    if (!misc_1.equal(base1, base2) || (defs_1.isNumericAtom(base1) && ispow1 !== ispow2)) {
        return defs_1.Constants.one;
    }
    // are both exponents numerical?
    if (defs_1.isNumericAtom(exponent1) && defs_1.isNumericAtom(exponent2)) {
        const exponent = misc_1.lessp(exponent1, exponent2) ? exponent1 : exponent2;
        return power_1.power(base1, exponent);
    }
    // are the exponents multiples of eah other?
    let p5 = multiply_1.divide(exponent1, exponent2);
    if (defs_1.isNumericAtom(p5)) {
        // choose the smallest exponent
        p5 =
            defs_1.ismultiply(exponent1) && defs_1.isNumericAtom(defs_1.cadr(exponent1))
                ? defs_1.cadr(exponent1)
                : defs_1.Constants.one;
        p6 =
            defs_1.ismultiply(exponent2) && defs_1.isNumericAtom(defs_1.cadr(exponent2))
                ? defs_1.cadr(exponent2)
                : defs_1.Constants.one;
        const exponent = misc_1.lessp(p5, p6) ? exponent1 : exponent2;
        return power_1.power(base1, exponent);
    }
    p5 = add_1.subtract(exponent1, exponent2);
    if (!defs_1.isNumericAtom(p5)) {
        return defs_1.Constants.one;
    }
    // can't be equal because of test near beginning
    const exponent = is_1.isnegativenumber(p5) ? exponent1 : exponent2;
    return power_1.power(base1, exponent);
}
// Univariate polynomials with rational coefficients: Euclid's algorithm,
// which unlike factoring also finds irrational common factors such as x^2-2.
// The result is the primitive gcd times the gcd of the contents.
// Only for expanded sums: factored products go through gcd_polys, so that
// callers dividing by the gcd (rationalize) can cancel whole factors.
function gcd_rational_polys(p1, p2) {
    if (!defs_1.isadd(p1) || !defs_1.isadd(p2)) {
        return;
    }
    const syms = [];
    symbol_2.collectUserSymbols(p1, syms);
    symbol_2.collectUserSymbols(p2, syms);
    const X = syms[0];
    if (syms.length !== 1 ||
        !is_1.ispolyexpandedform(p1, X) ||
        !is_1.ispolyexpandedform(p2, X)) {
        return;
    }
    let a = p1;
    let b = p2;
    const ca = coeff_1.coeff(a, X);
    const cb = coeff_1.coeff(b, X);
    if (![...ca, ...cb].every(defs_1.isrational)) {
        return;
    }
    const content = (cs) => cs.reduce(bignum_1.gcd_numbers);
    while (!is_1.isZeroAtomOrTensor(b)) {
        [a, b] = [b, add_1.subtract(a, multiply_1.multiply(b, quotient_1.divpoly(a, b, X)))];
    }
    const cg = coeff_1.coeff(a, X);
    a = multiply_1.divide(a, cg[cg.length - 1]); // monic
    a = multiply_1.divide(a, content(coeff_1.coeff(a, X))); // primitive, leading term positive
    return multiply_1.multiply(bignum_1.gcd_numbers(content(ca), content(cb)), a);
}
// in this case gcd is used as a composite function, i.e. gcd(gcd(gcd...
function gcd_sum_sum(p1, p2) {
    const p3 = gcd_sum(p1);
    const p4 = gcd_sum(p2);
    const p5 = multiply_1.divide(p1, p3);
    const p6 = multiply_1.divide(p2, p4);
    if (misc_1.equal(p5, p6)) {
        return multiply_1.multiply(p5, gcd(p3, p4));
    }
    return multiply_1.multiply(gcd(p3, p4), gcd_by_factoring(p5, p6));
}
// Multivariate sums: factor both in one variable and compare the factors,
// e.g. gcd(x^2-y^2,x+y). Only used when a factorization splits something
// off, otherwise the recursion through gcd_polys would not shrink.
function gcd_by_factoring(p1, p2) {
    const X = guess_1.guess(p1);
    if (!is_1.ispolyexpandedform(p1, X) || !is_1.ispolyexpandedform(p2, X)) {
        return defs_1.Constants.one;
    }
    const f1 = factorpoly_1.factorpoly(p1, X);
    const f2 = factorpoly_1.factorpoly(p2, X);
    const splits = (f) => defs_1.ispower(f) ||
        (defs_1.ismultiply(f) &&
            (f.tail().some(defs_1.ispower) ||
                f.tail().filter((t) => find_1.Find(t, X)).length > 1));
    if (!splits(f1) && !splits(f2)) {
        return defs_1.Constants.one;
    }
    return gcd_polys(f1, f2, X);
}
function gcd_sum(p) {
    return defs_1.iscons(p) ? p.tail().reduce(gcd) : defs_1.car(defs_1.cdr(p));
}
function gcd_term_term(p1, p2) {
    if (!defs_1.iscons(p1) || !defs_1.iscons(p2)) {
        return defs_1.Constants.one;
    }
    return p1.tail().reduce((a, b) => {
        return p2.tail().reduce((x, y) => multiply_1.multiply(x, gcd(b, y)), a);
    }, defs_1.Constants.one);
}
function gcd_sum_product(p1, p2) {
    return defs_1.iscons(p1)
        ? p1.tail().reduce((a, b) => multiply_1.multiply(a, gcd(b, p2)), defs_1.Constants.one)
        : defs_1.Constants.one;
}
function gcd_product_sum(p1, p2) {
    return defs_1.iscons(p2)
        ? p2.tail().reduce((a, b) => multiply_1.multiply(a, gcd(p1, b)), defs_1.Constants.one)
        : defs_1.Constants.one;
}
