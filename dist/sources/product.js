"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_product = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const float_1 = require("./float");
const multiply_1 = require("./multiply");
const find_1 = require("../runtime/find");
const add_1 = require("./add");
const factorial_1 = require("./factorial");
const power_1 = require("./power");
const misc_1 = require("./misc");
// 'product' function
//define A p3
//define B p4
//define I p5
//define X p6
// leaves the product at the top of the stack
function Eval_product(p1) {
    return float_1.evalExactly(evalProduct, p1);
}
exports.Eval_product = Eval_product;
function evalProduct(p1) {
    misc_1.checkArgCount(p1, 4);
    // 1st arg
    const body = defs_1.cadr(p1);
    // 2nd arg (index)
    const indexVariable = defs_1.caddr(p1);
    if (!defs_1.issymbol(indexVariable)) {
        run_1.stop('product: 2nd arg?');
    }
    // 3rd arg (lower limit), 4th arg (upper limit)
    const j = eval_1.evaluate_integer(defs_1.cadddr(p1));
    const k = eval_1.evaluate_integer(defs_1.caddddr(p1));
    if (isNaN(j) || isNaN(k)) {
        return symbolicProduct(p1, body, indexVariable);
    }
    // remember contents of the index
    // variable so we can put it back after the loop
    const oldIndexVariableValue = symbol_1.get_binding(indexVariable);
    let temp = defs_1.Constants.one;
    try {
        for (let i = j; i <= k; i++) {
            symbol_1.set_binding(indexVariable, bignum_1.integer(i));
            const arg2 = eval_1.Eval(body);
            const temp2 = multiply_1.multiply(temp, arg2);
            if (defs_1.DEBUG) {
                console.log(`product - factor 1: ${arg2}`);
                console.log(`product - factor 2: ${temp}`);
                console.log(`product - result: ${temp2}`);
            }
            temp = temp2;
        }
    }
    finally {
        // put back the index variable to original content,
        // also when the body stops with an error
        symbol_1.set_binding(indexVariable, oldIndexVariableValue);
    }
    return temp;
}
// Closed form for a symbolic bound, factor by factor: a constant c gives
// c^(b-a+1), the index shifted by a constant m gives (b+m)!/(a-1+m)!, and a
// constant power of such a factor the power of its product. Any other factor
// leaves the product unevaluated. As with sum, b >= a is taken for granted.
function symbolicProduct(p1, body, x) {
    const saved = symbol_1.get_binding(x);
    symbol_1.set_binding(x, x);
    try {
        const f = eval_1.Eval(body);
        const a = eval_1.Eval(defs_1.cadddr(p1));
        const b = eval_1.Eval(defs_1.caddddr(p1));
        // numeric bounds that are not integers: no integer steps from a to b
        if ([a, b].some((p) => defs_1.isNumericAtom(p) && isNaN(bignum_1.nativeInt(p)))) {
            return p1;
        }
        const count = add_1.add(add_1.subtract(b, a), defs_1.Constants.one);
        const one = (g) => {
            if (!find_1.Find(g, x)) {
                return power_1.power(g, count);
            }
            if (defs_1.ispower(g) && !find_1.Find(defs_1.caddr(g), x)) {
                const base = one(defs_1.cadr(g));
                return base && power_1.power(base, defs_1.caddr(g));
            }
            const m = add_1.subtract(g, x);
            if (find_1.Find(m, x)) {
                return null;
            }
            return multiply_1.divide(factorial_1.factorial(add_1.add(b, m)), factorial_1.factorial(add_1.add(add_1.subtract(a, defs_1.Constants.one), m)));
        };
        let result = defs_1.Constants.one;
        for (const g of defs_1.ismultiply(f) ? f.tail() : [f]) {
            const r = one(g);
            if (!r) {
                return p1;
            }
            result = multiply_1.multiply(result, r);
        }
        return result;
    }
    finally {
        symbol_1.set_binding(x, saved);
    }
}
