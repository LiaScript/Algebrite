"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.real = exports.Eval_real = void 0;
const assume_1 = require("./assume");
const list_1 = require("./list");
const symbol_1 = require("../runtime/symbol");
const defs_1 = require("../runtime/defs");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const conj_1 = require("./conj");
const eval_1 = require("./eval");
const multiply_1 = require("./multiply");
const rect_1 = require("./rect");
/*
 Returns the real part of complex z

  z    real(z)
  -    -------

  a + i b    a

  exp(i a)  cos(a)
*/
function Eval_real(p1) {
    return real(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_real = Eval_real;
function real(p) {
    // with a symbol not known to be real, a + i b can't be separated
    if (!assume_1.allSymbolsReal(p)) {
        return list_1.makeList(symbol_1.symbol(defs_1.REAL), p);
    }
    const p1 = rect_1.rect(p);
    return multiply_1.divide(add_1.add(p1, conj_1.conjugate(p1)), bignum_1.integer(2));
}
exports.real = real;
