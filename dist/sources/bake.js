"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.polyform = exports.bake = void 0;
const defs_1 = require("../runtime/defs");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const is_1 = require("./is");
const list_1 = require("./list");
const symbol_1 = require("../runtime/symbol");
function bake(p1) {
    return defs_1.doexpand(_bake, p1);
}
exports.bake = bake;
function _bake(p1) {
    // x+[3,4]: a tensor among the terms is no polynomial coefficient
    if (defs_1.isadd(p1) && p1.tail().some(defs_1.istensor)) {
        return p1;
    }
    // A product with a sum in it, 4*z*(3*y-5)^2, is a polynomial in z with the
    // coefficient 4*(3*y-5)^2, which bake_poly would multiply out: the result
    // of factor came back as (100-120*y+36*y^2)*z. Each factor on its own.
    if (defs_1.ismultiply(p1) && p1.tail().some((f) => defs_1.isadd(f) || (defs_1.ispower(f) && defs_1.isadd(defs_1.cadr(f))))) {
        return list_1.makeList(defs_1.car(p1), ...p1.tail().map(bake));
    }
    const s = is_1.ispolyexpandedform(p1, symbol_1.symbol(defs_1.SYMBOL_S));
    const t = is_1.ispolyexpandedform(p1, symbol_1.symbol(defs_1.SYMBOL_T));
    const x = is_1.ispolyexpandedform(p1, symbol_1.symbol(defs_1.SYMBOL_X));
    const y = is_1.ispolyexpandedform(p1, symbol_1.symbol(defs_1.SYMBOL_Y));
    const z = is_1.ispolyexpandedform(p1, symbol_1.symbol(defs_1.SYMBOL_Z));
    let result;
    if (s && !t && !x && !y && !z) {
        result = bake_poly(p1, symbol_1.symbol(defs_1.SYMBOL_S));
    }
    else if (!s && t && !x && !y && !z) {
        result = bake_poly(p1, symbol_1.symbol(defs_1.SYMBOL_T));
    }
    else if (!s && !t && x && !y && !z) {
        result = bake_poly(p1, symbol_1.symbol(defs_1.SYMBOL_X));
    }
    else if (!s && !t && !x && y && !z) {
        result = bake_poly(p1, symbol_1.symbol(defs_1.SYMBOL_Y));
    }
    else if (!s && !t && !x && !y && z) {
        result = bake_poly(p1, symbol_1.symbol(defs_1.SYMBOL_Z));
        // don't bake the contents of some constructs such as "for"
        // because we don't want to evaluate the body of
        // such constructs "statically", i.e. without fully running
        // the loops. Same for the body of a user function: it is only
        // evaluated when the function is called.
    }
    else if (defs_1.iscons(p1) &&
        defs_1.car(p1) !== symbol_1.symbol(defs_1.FOR) &&
        defs_1.car(p1) !== symbol_1.symbol(defs_1.FUNCTION)) {
        result = list_1.makeList(defs_1.car(p1), ...p1.tail().map(bake));
    }
    else {
        result = p1;
    }
    return result;
}
function polyform(p1, p2) {
    if (is_1.ispolyexpandedform(p1, p2)) {
        return bake_poly(p1, p2);
    }
    if (defs_1.iscons(p1)) {
        return list_1.makeList(defs_1.car(p1), ...p1.tail().map((el) => polyform(el, p2)));
    }
    return p1;
}
exports.polyform = polyform;
function bake_poly(poly, x) {
    const k = coeff_1.coeff(poly, x);
    const result = [];
    for (let i = k.length - 1; i >= 0; i--) {
        const term = k[i];
        result.push(...bake_poly_term(i, term, x));
    }
    if (result.length > 1) {
        return new defs_1.Cons(symbol_1.symbol(defs_1.ADD), list_1.makeList(...result));
    }
    return result[0];
}
// p1 points to coefficient of p2 ^ k
// k is an int
function bake_poly_term(k, coefficient, term) {
    if (is_1.isZeroAtomOrTensor(coefficient)) {
        return [];
    }
    // constant term?
    if (k === 0) {
        if (defs_1.isadd(coefficient)) {
            return coefficient.tail();
        }
        return [coefficient];
    }
    const result = [];
    // coefficient
    if (defs_1.ismultiply(coefficient)) {
        result.push(...coefficient.tail());
    }
    else if (!is_1.equaln(coefficient, 1)) {
        result.push(coefficient);
    }
    // x ^ k
    if (k === 1) {
        result.push(term);
    }
    else {
        result.push(list_1.makeList(symbol_1.symbol(defs_1.POWER), term, bignum_1.integer(k)));
    }
    if (result.length > 1) {
        return [list_1.makeList(symbol_1.symbol(defs_1.MULTIPLY), ...result)];
    }
    return result;
}
