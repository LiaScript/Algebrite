"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_sum = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const eval_1 = require("./eval");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
// 'sum' function
//define A p3
//define B p4
//define I p5
//define X p6
// leaves the sum at the top of the stack
function Eval_sum(p1) {
    // 1st arg
    const body = defs_1.cadr(p1);
    // 2nd arg (index)
    const indexVariable = defs_1.caddr(p1);
    if (!defs_1.issymbol(indexVariable)) {
        run_1.stop('sum: 2nd arg?');
    }
    // 3rd arg (lower limit), 4th arg (upper limit)
    const j = eval_1.evaluate_integer(defs_1.cadddr(p1));
    const k = eval_1.evaluate_integer(defs_1.caddddr(p1));
    if (isNaN(j) || isNaN(k)) {
        return symbolicSum(p1, body, indexVariable);
    }
    // remember contents of the index
    // variable so we can put it back after the loop
    const p4 = symbol_1.get_binding(indexVariable);
    let temp = defs_1.Constants.zero;
    for (let i = j; i <= k; i++) {
        symbol_1.set_binding(indexVariable, bignum_1.integer(i));
        temp = add_1.add(temp, eval_1.Eval(body));
    }
    // put back the index variable to original content
    symbol_1.set_binding(indexVariable, p4);
    return temp;
}
exports.Eval_sum = Eval_sum;
// Closed form for a symbolic bound. The summand is split into its additive
// terms: the polynomial ones (in the index) are summed with power sums, every
// other term must be geometric. Anything else is returned unevaluated. As in
// other CAS, the formula is given without knowing whether b >= a.
function symbolicSum(p1, body, x) {
    // the index must be unbound while the summand is taken apart
    const saved = symbol_1.get_binding(x);
    symbol_1.set_binding(x, x);
    try {
        const f = eval_1.Eval(body);
        const a = eval_1.Eval(defs_1.cadddr(p1));
        const b = eval_1.Eval(defs_1.caddddr(p1));
        const terms = defs_1.isadd(f) ? f.tail() : [f];
        const isPoly = (t) => !find_1.Find(t, x) || is_1.ispolyexpandedform(t, x);
        let result = polynomialSum(terms.filter(isPoly).reduce(add_1.add, defs_1.Constants.zero), x, a, b);
        for (const t of terms.filter((t) => !isPoly(t))) {
            const g = geometricSum(t, x, a, b);
            if (!g) {
                return p1;
            }
            result = add_1.add(result, g);
        }
        return result;
    }
    finally {
        symbol_1.set_binding(x, saved);
    }
}
// sum_{i=a}^{b} f(i) = F(b) - F(a-1), with F built from power sums.
function polynomialSum(f, x, a, b) {
    const c = coeff_1.coeff(f, x);
    const upper = powerSums(b, c.length - 1);
    const lower = powerSums(add_1.subtract(a, defs_1.Constants.one), c.length - 1);
    return c.reduce((acc, cp, p) => add_1.add(acc, multiply_1.multiply(cp, add_1.subtract(upper[p], lower[p]))), defs_1.Constants.zero);
}
// A term is geometric when t(x+1)/t(x) is free of x; the sum is then
// t(a) * (r^(b-a+1) - 1) / (r - 1). Returns null for any other term.
function geometricSum(t, x, a, b) {
    const next = eval_1.Eval(subst_1.subst(t, x, add_1.add(x, defs_1.Constants.one)));
    const r = simplify_1.simplify(multiply_1.divide(next, t));
    if (find_1.Find(r, x) || is_1.equaln(r, 1)) {
        return null;
    }
    const count = add_1.add(add_1.subtract(b, a), defs_1.Constants.one);
    return simplify_1.simplify(multiply_1.divide(multiply_1.multiply(eval_1.Eval(subst_1.subst(t, x, a)), add_1.subtract(power_1.power(r, count), defs_1.Constants.one)), add_1.subtract(r, defs_1.Constants.one)));
}
// S[p] = sum_{i=1}^{n} i^p for p = 0..maxP, from the telescoping identity
// (n+1)^(p+1) - 1 = sum_{j=0}^{p} C(p+1,j) * S[j].
// ponytail: binomials as JS numbers, exact up to degree ~50; bigint if needed
function powerSums(n, maxP) {
    const S = [];
    for (let p = 0; p <= maxP; p++) {
        let t = add_1.subtract(power_1.power(add_1.add(n, defs_1.Constants.one), bignum_1.integer(p + 1)), defs_1.Constants.one);
        let binom = 1; // C(p+1, j)
        for (let j = 0; j < p; j++) {
            t = add_1.subtract(t, multiply_1.multiply(bignum_1.integer(binom), S[j]));
            binom = (binom * (p + 1 - j)) / (j + 1);
        }
        S.push(multiply_1.divide(t, bignum_1.integer(p + 1)));
    }
    return S;
}
