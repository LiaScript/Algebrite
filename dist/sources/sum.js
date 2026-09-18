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
const expand_1 = require("./expand");
const denominator_1 = require("./denominator");
const numerator_1 = require("./numerator");
const log_1 = require("./log");
const derivative_1 = require("./derivative");
const float_1 = require("./float");
const zeta_1 = require("./zeta");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
const misc_1 = require("./misc");
// 'sum' function
//define A p3
//define B p4
//define I p5
//define X p6
// leaves the sum at the top of the stack
function Eval_sum(p1) {
    // exact even inside float(): a float inf bound would never end the loop
    return float_1.evalExactly(evalSum, p1);
}
exports.Eval_sum = Eval_sum;
function evalSum(p1) {
    misc_1.checkArgCount(p1, 4);
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
    try {
        for (let i = j; i <= k; i++) {
            symbol_1.set_binding(indexVariable, bignum_1.integer(i));
            temp = add_1.add(temp, eval_1.Eval(body));
        }
    }
    finally {
        // put back the index variable to original content,
        // also when the body stops with an error
        symbol_1.set_binding(indexVariable, p4);
    }
    return temp;
}
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
        // numeric bounds that are not integers: the closed forms below assume
        // integer steps from a to b, sum(k,k,1/2,3) is not F(3) - F(-1/2)
        if ([a, b].some((p) => defs_1.isNumericAtom(p) && isNaN(bignum_1.nativeInt(p)))) {
            return p1;
        }
        let terms = defs_1.isadd(f) ? f.tail() : [f];
        const isPoly = (t) => !find_1.Find(t, x) || is_1.ispolyexpandedform(t, x);
        // rational terms are summed together: their partial fractions may telescope
        const rationalTerms = terms.filter((t) => !isPoly(t) && isRationalIn(t, x));
        let telescoped = defs_1.Constants.zero;
        if (rationalTerms.length > 0) {
            const r = telescope(rationalTerms.reduce(add_1.add, defs_1.Constants.zero), x, a, b);
            if (r !== null) {
                telescoped = r;
                terms = terms.filter((t) => !rationalTerms.includes(t));
                if (terms.length === 0) {
                    return telescoped;
                }
            }
        }
        if (b === symbol_1.symbol(defs_1.INF)) {
            const rest = infiniteSum(p1, terms, x, a);
            return rest === p1 ? p1 : add_1.add(telescoped, rest);
        }
        let result = polynomialSum(terms.filter(isPoly).reduce(add_1.add, defs_1.Constants.zero), x, a, b);
        for (const t of terms.filter((t) => !isPoly(t))) {
            const g = geometricSum(t, x, a, b);
            if (!g) {
                return p1;
            }
            result = add_1.add(result, g);
        }
        return add_1.add(telescoped, result);
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
// sum_{x=a}^{inf}: each term must be geometric (t(a)/(1-r)), a p-series
// c/x^s (through zeta) or an exponential series c*r^x/x! (c*exp(r)); the
// first terms a lower bound skips are subtracted. A term that does not go to
// 0 makes the series diverge; anything else is returned unevaluated.
function infiniteSum(p1, terms, x, a) {
    let result = defs_1.Constants.zero;
    for (const t of terms) {
        if (is_1.isZeroAtomOrTensor(t)) {
            continue;
        }
        if (!find_1.Find(t, x) || is_1.ispolyexpandedform(t, x)) {
            run_1.stop('sum: the series diverges');
        }
        const g = infiniteTerm(t, x, a);
        if (!g) {
            return p1;
        }
        result = add_1.add(result, g);
    }
    return result;
}
function infiniteTerm(t, x, a) {
    const at = (v) => eval_1.Eval(subst_1.subst(t, x, v));
    const next = at(add_1.add(x, defs_1.Constants.one));
    // the terms below the lower bound, for series known from 0 or 1 on
    const skipped = (from) => {
        const n = bignum_1.nativeInt(a);
        if (isNaN(n) || n < from) {
            return null;
        }
        let acc = defs_1.Constants.zero;
        for (let j = from; j < n; j++) {
            acc = add_1.add(acc, at(bignum_1.integer(j)));
        }
        return acc;
    };
    const r = simplify_1.simplify(multiply_1.divide(next, t));
    if (!find_1.Find(r, x)) {
        const f = float_1.zzfloat(r);
        if (defs_1.isdouble(f) && Math.abs(f.d) >= 1) {
            run_1.stop('sum: the series diverges');
        }
        return simplify_1.simplify(multiply_1.divide(at(a), add_1.subtract(defs_1.Constants.one, r)));
    }
    // t(x+1)/t(x) = q/(x+1): c*q^x/x!
    const q = simplify_1.simplify(multiply_1.multiply(r, add_1.add(x, defs_1.Constants.one)));
    if (!find_1.Find(q, x)) {
        const head = skipped(0);
        return head && add_1.subtract(multiply_1.multiply(at(defs_1.Constants.zero), misc_1.exponential(q)), head);
    }
    // (-1)^x*c/x^s = -c*eta(s), eta(1) = log(2), eta(s) = (1-2^(1-s))*zeta(s)
    // the factor (-1)^(x+c), c an integer, is (-1)^c*(-1)^x
    const alternating = findSign(t, x);
    if (alternating !== undefined) {
        const u = simplify_1.simplify(multiply_1.divide(t, alternating));
        const su = simplify_1.simplify(multiply_1.negate(multiply_1.divide(multiply_1.multiply(x, derivative_1.derivative(u, x)), u)));
        const cu = is_1.isposint(su) ? simplify_1.simplify(multiply_1.multiply(u, power_1.power(x, su))) : x;
        const head = skipped(1);
        const shift = eval_1.Eval(power_1.power(defs_1.Constants.negOne, add_1.subtract(defs_1.caddr(alternating), x)));
        if (findSign(u, x) !== undefined || find_1.Find(cu, x) || !head || !defs_1.isNumericAtom(shift)) {
            return null;
        }
        const eta = is_1.equaln(su, 1)
            ? log_1.logarithm(bignum_1.integer(2))
            : multiply_1.multiply(add_1.subtract(defs_1.Constants.one, power_1.power(bignum_1.integer(2), add_1.subtract(defs_1.Constants.one, su))), zeta_1.zeta(su));
        return add_1.subtract(multiply_1.negate(multiply_1.multiply(multiply_1.multiply(shift, cu), eta)), head);
    }
    // c/x^s: s = -x*t'/t
    const s = simplify_1.simplify(multiply_1.negate(multiply_1.divide(multiply_1.multiply(x, derivative_1.derivative(t, x)), t)));
    if (is_1.isposint(s)) {
        if (is_1.equaln(s, 1)) {
            run_1.stop('sum: the series diverges');
        }
        const c = simplify_1.simplify(multiply_1.multiply(t, power_1.power(x, s)));
        const head = skipped(1);
        return head && !find_1.Find(c, x) ? add_1.subtract(multiply_1.multiply(c, zeta_1.zeta(s)), head) : null;
    }
    return null;
}
// the factor (-1)^g of t with g = x + constant
function findSign(t, x) {
    if (!defs_1.iscons(t)) {
        return undefined;
    }
    if (defs_1.ispower(t) &&
        misc_1.equal(defs_1.cadr(t), defs_1.Constants.negOne) &&
        is_1.equaln(derivative_1.derivative(defs_1.caddr(t), x), 1)) {
        return t;
    }
    for (const q of t.tail()) {
        const r = findSign(q, x);
        if (r !== undefined) {
            return r;
        }
    }
    return undefined;
}
function isRationalIn(t, x) {
    const isPoly = (p) => !find_1.Find(p, x) || is_1.ispolyfactoredorexpandedform(p, x);
    return find_1.Find(denominator_1.denominator(t), x) && isPoly(numerator_1.numerator(t)) && isPoly(denominator_1.denominator(t));
}
// sum_{x=a}^{b} R(x) for a rational R whose partial fractions are all
// c/(x+m) with numbers m: within a group of poles that differ by integers
//   sum 1/(x+m0+d) = H(b+m0) - H(a+m0-1)
//                    + sum_{j=1..d} 1/(b+m0+j) - sum_{j=1..d} 1/(a+m0-1+j),
// so the harmonic parts cancel when the coefficients of the group add up to
// 0 and a finite number of terms is left. With b = inf the terms in b vanish;
// a group that does not add up to 0 diverges there. null when R has another
// shape.
function telescope(R, x, a, b) {
    const infinite = b === symbol_1.symbol(defs_1.INF);
    const P = expand_1.apart(R, x);
    const fractions = [];
    for (const part of defs_1.isadd(P) ? P.tail() : [P]) {
        const k = coeff_1.coeff(denominator_1.denominator(part), x);
        const num = numerator_1.numerator(part);
        if (k.length !== 2 || find_1.Find(num, x)) {
            return null;
        }
        const m = multiply_1.divide(k[0], k[1]);
        if (!defs_1.isrational(m)) {
            return null;
        }
        fractions.push({ c: multiply_1.divide(num, k[1]), m });
    }
    const frac = (m) => add_1.subtract(m, bignum_1.integer(Math.floor(toNumber(m))));
    let result = defs_1.Constants.zero;
    const done = [];
    for (const f of fractions) {
        const key = frac(f.m);
        if (done.some((d) => misc_1.equal(d, key))) {
            continue;
        }
        done.push(key);
        const group = fractions.filter((g) => misc_1.equal(frac(g.m), key));
        const total = group.reduce((acc, g) => add_1.add(acc, g.c), defs_1.Constants.zero);
        if (!is_1.isZeroAtomOrTensor(simplify_1.simplify(total))) {
            if (infinite) {
                run_1.stop('sum: the series diverges');
            }
            return null;
        }
        const m0 = group.reduce((min, g) => (toNumber(g.m) < toNumber(min) ? g.m : min), group[0].m);
        for (const g of group) {
            const d = Math.round(toNumber(g.m) - toNumber(m0));
            for (let j = 1; j <= d; j++) {
                const lower = multiply_1.divide(g.c, add_1.add(add_1.add(add_1.subtract(a, defs_1.Constants.one), m0), bignum_1.integer(j)));
                const upper = infinite
                    ? defs_1.Constants.zero
                    : multiply_1.divide(g.c, add_1.add(add_1.add(b, m0), bignum_1.integer(j)));
                result = add_1.add(result, add_1.subtract(upper, lower));
            }
        }
    }
    return result;
}
function toNumber(p) {
    const f = float_1.zzfloat(p);
    return defs_1.isdouble(f) ? f.d : NaN;
}
