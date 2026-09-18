"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clockform = exports.Eval_clock = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const abs_1 = require("./abs");
const arg_1 = require("./arg");
const eval_1 = require("./eval");
const is_1 = require("./is");
const power_1 = require("./power");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const tensor_1 = require("./tensor");
/*
 Convert complex z to clock form

  Input:    push  z

  Output:    Result on stack

  clock(z) = abs(z) * (-1) ^ (arg(z) / pi)

  For example, clock(exp(i pi/3)) gives the result (-1)^(1/3)
*/
// P.S. I couldn't find independent definition/aknowledgment
// of the naming "clock form" anywhere on the web, seems like a
// naming specific to eigenmath.
// Clock form is another way to express a complex number, and
// it has three advantages
//   1) it's uniform with how for example
//      i is expressed i.e. (-1)^(1/2)
//   2) it's very compact
//   3) it's a straighforward notation for roots of 1 and -1
const DEBUG_CLOCKFORM = false;
function Eval_clock(p1) {
    return clockform(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_clock = Eval_clock;
function clockform(p1) {
    if (defs_1.istensor(p1)) {
        const t = tensor_1.copy_tensor(p1);
        t.tensor.elem = t.tensor.elem.map(clockform);
        return t;
    }
    // pushing the expression (-1)^... but note
    // that we can't use "power", as "power" evaluates
    // clock forms into rectangular form (see "-1 ^ rational"
    // section in power); an integer exponent is just a sign
    const n = multiply_1.divide(arg_1.arg(p1), defs_1.Constants.Pi());
    const l = is_1.isintegerorintegerfloat(n)
        ? power_1.power(defs_1.Constants.negOne, n)
        : list_1.makeList(symbol_1.symbol(defs_1.POWER), defs_1.Constants.negOne, n);
    const multiplied = multiply_1.multiply(abs_1.abs(p1), l);
    if (DEBUG_CLOCKFORM) {
        console.log(`clockform: abs of ${p1} : ${abs_1.abs(p1)}`);
        console.log(`clockform: arg of ${p1} : ${arg_1.arg(p1)}`);
        console.log(`clockform: divide : ${multiply_1.divide(arg_1.arg(p1), defs_1.Constants.Pi())}`);
        console.log(`clockform: power : ${l}`);
        console.log(`clockform: multiply : ${multiplied}`);
    }
    return multiplied;
}
exports.clockform = clockform;
