"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rationalize = exports.Eval_rationalize = void 0;
const defs_1 = require("../runtime/defs");
const add_1 = require("./add");
const condense_1 = require("./condense");
const eval_1 = require("./eval");
const gcd_1 = require("./gcd");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const misc_1 = require("./misc");
const tensor_1 = require("./tensor");
function Eval_rationalize(p1) {
    return rationalize(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_rationalize = Eval_rationalize;
function rationalize(p) {
    const prev_expanding = defs_1.defs.expanding;
    const result = yyrationalize(p);
    defs_1.defs.expanding = prev_expanding;
    return result;
}
exports.rationalize = rationalize;
function yyrationalize(arg) {
    if (defs_1.istensor(arg)) {
        return __rationalize_tensor(arg);
    }
    defs_1.defs.expanding = false;
    if (!defs_1.isadd(arg)) {
        return arg;
    }
    // get common denominator
    const commonDenominator = multiply_denominators(arg);
    // multiply each term by common denominator
    let temp = defs_1.Constants.zero;
    if (defs_1.iscons(arg)) {
        temp = arg
            .tail()
            .reduce((acc, term) => add_1.add(acc, multiply_1.multiply(commonDenominator, term)), temp);
    }
    // collect common factors
    // divide by common denominator
    return multiply_1.divide(condense_1.Condense(temp), commonDenominator);
}
function multiply_denominators(p) {
    if (defs_1.isadd(p)) {
        return p
            .tail()
            .reduce((acc, el) => multiply_denominators_term(el, acc), defs_1.Constants.one);
    }
    return multiply_denominators_term(p, defs_1.Constants.one);
}
function multiply_denominators_term(p, p2) {
    if (defs_1.ismultiply(p)) {
        return p
            .tail()
            .reduce((acc, el) => multiply_denominators_factor(el, acc), p2);
    }
    return multiply_denominators_factor(p, p2);
}
function multiply_denominators_factor(p, p2) {
    if (!defs_1.ispower(p)) {
        return p2;
    }
    const arg2 = p;
    p = defs_1.caddr(p);
    // like x^(-2) ?
    if (is_1.isnegativenumber(p)) {
        return __lcm(p2, multiply_1.inverse(arg2));
    }
    // like x^(-a) ?
    if (defs_1.ismultiply(p) && is_1.isnegativenumber(defs_1.cadr(p))) {
        return __lcm(p2, multiply_1.inverse(arg2));
    }
    // no match
    return p2;
}
function __rationalize_tensor(p1) {
    p1 = eval_1.Eval(p1); // makes a copy
    if (!defs_1.istensor(p1)) {
        // might be zero
        return p1;
    }
    p1.tensor.elem = p1.tensor.elem.map(rationalize);
    tensor_1.check_tensor_dimensions(p1);
    return p1;
}
// Common denominator built from the denominators' own factors: each term
// is multiplied by it and must cancel its denominator syntactically. A true
// lcm can lose that, e.g. lcm(x^2+1,4*x^2+4) = 4*x^2+4 does not cancel
// 1/(x^2+1). So only factors with the same base are merged, x^2 and x^3
// into x^3; any other factor is multiplied in.
function __lcm(p1, p2) {
    const base = (f) => (defs_1.ispower(f) ? defs_1.cadr(f) : f);
    const factors = defs_1.ismultiply(p1) ? p1.tail() : [p1];
    const i = factors.findIndex((f) => misc_1.equal(base(f), base(p2)));
    if (i < 0) {
        return multiply_1.multiply(p1, p2);
    }
    factors[i] = multiply_1.divide(multiply_1.multiply(factors[i], p2), gcd_1.gcd(factors[i], p2));
    return factors.reduce((acc, f) => multiply_1.multiply(acc, f), defs_1.Constants.one);
}
