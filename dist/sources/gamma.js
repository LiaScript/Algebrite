"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lanczos = exports.Eval_gamma = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const factorial_1 = require("./factorial");
const is_1 = require("./is");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const sin_1 = require("./sin");
const misc_1 = require("./misc");
//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  Gamma function gamma(x)
//
//-----------------------------------------------------------------------------
function Eval_gamma(p1) {
    misc_1.checkArgCount(p1, 1);
    return gamma(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_gamma = Eval_gamma;
function gamma(p1) {
    return gammaf(p1);
}
function gammaf(p1) {
    if (defs_1.isrational(p1) && defs_1.MEQUAL(p1.q.a, 1) && defs_1.MEQUAL(p1.q.b, 2)) {
        return power_1.power(defs_1.Constants.Pi(), bignum_1.rational(1, 2));
    }
    // Gamma(n) = (n-1)!, Gamma(n+1/2) = (n-1/2)*Gamma(n-1/2)
    if (is_1.isposint(p1)) {
        return factorial_1.factorial(add_1.subtract(p1, defs_1.Constants.one));
    }
    if (defs_1.isrational(p1) && defs_1.MEQUAL(p1.q.b, 2) && is_1.ispositivenumber(p1)) {
        const p = add_1.subtract(p1, defs_1.Constants.one);
        return multiply_1.multiply(p, gamma(p));
    }
    if (defs_1.isdouble(p1)) {
        if (p1.d <= 0 && Number.isInteger(p1.d)) {
            run_1.stop('divide by zero');
        }
        return bignum_1.double(lanczos(p1.d));
    }
    if (is_1.isnegativeterm(p1)) {
        return multiply_1.divide(multiply_1.multiply(defs_1.Constants.Pi(), defs_1.Constants.negOne), multiply_1.multiply(multiply_1.multiply(sin_1.sine(multiply_1.multiply(defs_1.Constants.Pi(), p1)), p1), gamma(multiply_1.negate(p1))));
    }
    if (defs_1.isadd(p1)) {
        return gamma_of_sum(p1);
    }
    return list_1.makeList(symbol_1.symbol(defs_1.GAMMA), p1);
}
function gamma_of_sum(p1) {
    const p3 = defs_1.cdr(p1);
    if (defs_1.isrational(defs_1.car(p3)) &&
        defs_1.MEQUAL(defs_1.car(p3).q.a, 1) &&
        defs_1.MEQUAL(defs_1.car(p3).q.b, 1)) {
        return multiply_1.multiply(defs_1.cadr(p3), gamma(defs_1.cadr(p3)));
    }
    if (defs_1.isrational(defs_1.car(p3)) &&
        defs_1.MEQUAL(defs_1.car(p3).q.a, -1) &&
        defs_1.MEQUAL(defs_1.car(p3).q.b, 1)) {
        return multiply_1.divide(gamma(defs_1.cadr(p3)), add_1.add(defs_1.cadr(p3), defs_1.Constants.negOne));
    }
    return list_1.makeList(symbol_1.symbol(defs_1.GAMMA), p1);
}
// Lanczos approximation (g = 7, 9 terms), about 15 significant digits
const LANCZOS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];
function lanczos(x) {
    if (Number.isInteger(x) && x > 0 && x < 172) {
        let f = 1;
        for (let i = 2; i < x; i++) {
            f *= i;
        }
        return f;
    }
    if (x < 0.5) {
        return Math.PI / (Math.sin(Math.PI * x) * lanczos(1 - x));
    }
    x -= 1;
    let a = LANCZOS[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) {
        a += LANCZOS[i] / (x + i);
    }
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
exports.lanczos = lanczos;
