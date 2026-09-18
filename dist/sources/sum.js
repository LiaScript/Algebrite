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
const factorpoly_1 = require("./factorpoly");
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
const list_1 = require("./list");
const misc_1 = require("./misc");
const assume_1 = require("./assume");
const binomial_1 = require("./binomial");
const limit_1 = require("./limit");
const rationalize_1 = require("./rationalize");
const sum_gosper_1 = require("./sum_gosper");
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
        if (hasIntegerPole(f, x, a)) {
            run_1.stop('divide by zero');
        }
        const row = binomialRow(f, x, a, b);
        if (row) {
            return row;
        }
        let terms = defs_1.isadd(f) ? f.tail() : [f];
        const isPoly = (t) => !find_1.Find(t, x) || is_1.ispolyexpandedform(t, x);
        if (b === symbol_1.symbol(defs_1.INF)) {
            return infiniteSum(p1, terms, x, a);
        }
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
        let result = polynomialSum(terms.filter(isPoly).reduce(add_1.add, defs_1.Constants.zero), x, a, b);
        // term by term, and the terms together when one has no closed form of
        // its own: (k+1)! - k!
        const rest = terms.filter((t) => !isPoly(t));
        const closed = rest.map((t) => geometricSum(t, x, a, b) || gosperSum(t, x, a, b));
        if (closed.every((g) => g)) {
            return closed.reduce(add_1.add, add_1.add(telescoped, result));
        }
        const together = rest.length > 1 && gosperSum(rest.reduce(add_1.add, defs_1.Constants.zero), x, a, b);
        return together ? add_1.add(add_1.add(telescoped, result), together) : p1;
    }
    finally {
        symbol_1.set_binding(x, saved);
    }
}
// A factorial over the index and a symbol of the limits, as in
// binomial(n,k) summed up to n: the antidifference of Gosper's algorithm has
// poles there, (-1)^k*binomial(n,k) would come out as 0 also for n = 0.
function mixesIndexAndLimits(t, x, limits) {
    const syms = [];
    limits.forEach((l) => symbol_1.collectUserSymbols(l, syms));
    const mixes = (p) => defs_1.iscons(p) &&
        ((defs_1.isfactorial(p) && find_1.Find(p, x) && syms.some((v) => find_1.Find(p, v))) ||
            p.tail().some(mixes));
    return mixes(t);
}
function hasFactorial(p) {
    return defs_1.iscons(p) && (defs_1.isfactorial(p) || p.tail().some(hasFactorial));
}
// Gosper's antidifference; a summand that stops somewhere on the way has none
function antidifference(t, x, limits) {
    if (mixesIndexAndLimits(t, x, limits)) {
        return null;
    }
    try {
        return sum_gosper_1.gosper(t, x);
    }
    catch (e) {
        return null;
    }
}
// sum_{x=a}^{b} t = z(b+1) - z(a) for the antidifference z of Gosper
function gosperSum(t, x, a, b) {
    const z = antidifference(t, x, [a, b]);
    const lower = z && lowerValue(z, t, x, a);
    return (lower &&
        add_1.subtract(simplify_1.simplify(eval_1.Eval(subst_1.subst(z, x, add_1.add(b, defs_1.Constants.one)))), lower));
}
// z(a), or z(a+1) - t(a) where z(a) runs into the factorial of a negative
// integer: x!/(6*(x-3)!) at x = 2 is 0, but not for the evaluator
function lowerValue(z, t, x, a) {
    const at = (p, v) => simplify_1.simplify(eval_1.Eval(subst_1.subst(p, x, v)));
    const hasPole = (p) => defs_1.iscons(p) &&
        ((defs_1.isfactorial(p) && is_1.isnegativenumber(defs_1.cadr(p))) || p.tail().some(hasPole));
    const direct = at(z, a);
    if (!hasPole(direct)) {
        return direct;
    }
    const next = add_1.subtract(at(z, add_1.add(a, defs_1.Constants.one)), at(t, a));
    return hasPole(next) ? null : next;
}
// sum_{x=a}^{inf} t = lim z - z(a). With t(x+1)/t(x) -> rho, abs(rho) < 1,
// t decays geometrically and so does z, a rational multiple of t; for
// rho = 1 the limit of z is tried, a symbolic rho (x^k) is left alone.
function gosperSeries(t, x, a) {
    const z = antidifference(t, x, [a]);
    if (!z) {
        return null;
    }
    const next = eval_1.Eval(subst_1.subst(t, x, add_1.add(x, defs_1.Constants.one)));
    // limit() does not come back from quotients of factorials
    const atInf = (p) => {
        try {
            return hasFactorial(p) ? null : limit_1.limit(p, x, symbol_1.symbol(defs_1.INF));
        }
        catch (e) {
            return null; // no limit found
        }
    };
    const rho = atInf(simplify_1.simplify(multiply_1.divide(next, t)));
    const size = !rho
        ? NaN
        : find_1.Find(rho, symbol_1.symbol(defs_1.INF))
            ? Infinity
            : Math.abs(toNumber(rho));
    if (size > 1) {
        return DIVERGES;
    }
    const end = size < 1 ? defs_1.Constants.zero : size === 1 ? atInf(z) : null;
    if (!end || find_1.Find(end, symbol_1.symbol(defs_1.INF)) || find_1.Find(end, x)) {
        return null;
    }
    const lower = lowerValue(z, t, x, a);
    return lower && add_1.subtract(end, lower);
}
// The whole row of binomial coefficients, from the binomial theorem
//   sum_{x=0}^{b} binomial(b,x)*y^x = (1+y)^b
// and theta = y*d/dy, which multiplies the summand by x:
//   sum p(x)*r^x*binomial(b,x) = p(theta) (1+y)^b at y = r,
// and sum binomial(b,x)^2 = binomial(2*b,b). For r = -1 the row adds up to
// 0^b, which is 0 only for an integer b >= 1. Terms that a lower limit
// above 0 skips are subtracted.
function binomialRow(f, x, a, b) {
    const from = bignum_1.nativeInt(a);
    if (b === symbol_1.symbol(defs_1.INF) ||
        defs_1.isNumericAtom(b) ||
        !(from >= 0 && from <= MAX_SKIPPED) ||
        !hasFactorial(f)) {
        return null;
    }
    // only for a summand of the right shape: 1/x has no value at 0
    const head = () => {
        let acc = defs_1.Constants.zero;
        for (let j = 0; j < from; j++) {
            acc = add_1.add(acc, eval_1.Eval(subst_1.subst(f, x, bignum_1.integer(j))));
        }
        return acc;
    };
    const row = binomial_1.binomial(b, x);
    const q = simplify_1.simplify(multiply_1.divide(f, row));
    const square = simplify_1.simplify(multiply_1.divide(q, row));
    if (!find_1.Find(square, x)) {
        return add_1.subtract(multiply_1.multiply(square, binomial_1.binomial(multiply_1.multiply(bignum_1.integer(2), b), b)), head());
    }
    // q = p(x)*r^x: r is the limit of q(x+1)/q(x)
    const ratio = rationalize_1.rationalize(simplify_1.simplify(multiply_1.divide(eval_1.Eval(subst_1.subst(q, x, add_1.add(x, defs_1.Constants.one))), q)));
    const parts = [numerator_1.numerator(ratio), denominator_1.denominator(ratio)].map(misc_1.yyexpand);
    if (parts.some((p) => find_1.Find(p, x) && !is_1.ispolyexpandedform(p, x))) {
        return null;
    }
    const [cn, cd] = parts.map((p) => coeff_1.coeff(p, x));
    if (cn.length !== cd.length) {
        return null;
    }
    const r = simplify_1.simplify(multiply_1.divide(cn[cn.length - 1], cd[cd.length - 1]));
    // (1/2)^x is not combined with 2^x: r^x is also divided out as n^x/d^x
    const p = [
        power_1.power(r, x),
        multiply_1.divide(power_1.power(numerator_1.numerator(r), x), power_1.power(denominator_1.denominator(r), x))
    ]
        .map((rx) => misc_1.yyexpand(simplify_1.simplify(multiply_1.divide(q, rx))))
        .find((p) => !find_1.Find(p, x) || is_1.ispolyexpandedform(p, x));
    if (!p) {
        return null;
    }
    if (is_1.isZeroAtomOrTensor(simplify_1.simplify(add_1.add(r, defs_1.Constants.one)))) {
        return !find_1.Find(p, x) && assume_1.isPositive(b) && assume_1.isInteger(b) ? multiply_1.negate(head()) : null;
    }
    const y = symbol_1.symbol(defs_1.SECRETX);
    let g = power_1.power(add_1.add(defs_1.Constants.one, y), b);
    let total = defs_1.Constants.zero;
    for (const c of coeff_1.coeff(p, x)) {
        total = add_1.add(total, multiply_1.multiply(c, g));
        g = multiply_1.multiply(y, derivative_1.derivative(g, y));
    }
    return add_1.subtract(simplify_1.simplify(eval_1.Eval(subst_1.subst(total, y, r))), head());
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
// a value, null when there is no closed form, or the series diverges
const DIVERGES = 'diverges';
// sum_{x=a}^{inf}: the polynomial and rational terms are summed together,
// each other term must be geometric (t(a)/(1-r)), an exponential series
// c*r^x/x! (c*exp(r)) or have an antidifference. Divergence is judged on the
// whole summand: one divergent part among convergent ones makes the series
// diverge, next to a part without closed form it says nothing, 1/x and
// -log(1+1/x) add up to Euler's constant.
function infiniteSum(p1, terms, x, a) {
    const isRational = (t) => !find_1.Find(t, x) || is_1.ispolyexpandedform(t, x) || isRationalIn(t, x);
    const parts = terms
        .filter((t) => !isRational(t) && !is_1.isZeroAtomOrTensor(t))
        .map((t) => ({ t, g: infiniteTerm(t, x, a) || gosperSeries(t, x, a) }));
    const R = terms.filter(isRational).reduce(add_1.add, defs_1.Constants.zero);
    if (!is_1.isZeroAtomOrTensor(R)) {
        parts.push(...rationalSeries(R, x, a));
    }
    if (parts.some((p) => p.g === null)) {
        return p1;
    }
    const result = parts.reduce((acc, p) => (p.g === DIVERGES ? acc : add_1.add(acc, p.g)), defs_1.Constants.zero);
    const divergent = parts.filter((p) => p.g === DIVERGES).map((p) => p.t);
    if (divergent.length > 1) {
        // 2^x - 2^(x+1)/2: parts the evaluator did not combine may cancel.
        // ponytail: parts that simplify keeps apart are taken to grow differently
        // (x, 1/x, 2^x, x!), so their sum diverges as well
        const D = simplify_1.simplify(divergent.reduce(add_1.add, defs_1.Constants.zero));
        const left = defs_1.isadd(D) ? D.tail() : [D];
        if (is_1.isZeroAtomOrTensor(D)) {
            return result;
        }
        if (left.length < divergent.length) {
            const rest = infiniteSum(p1, left, x, a);
            return rest === p1 ? p1 : add_1.add(result, rest);
        }
    }
    if (divergent.length > 0) {
        run_1.stop('sum: the series diverges');
    }
    return result;
}
// A rational summand converges when the degree of its denominator exceeds
// the degree of the numerator by 2 or more, whatever its partial fractions
// do one by one: 1/(x*(2*x+1)) = 1/x - 2/(2*x+1). Then the partial fractions
// with a simple pole are summed together, the others one by one as p-series
// c/x^s through zeta.
function rationalSeries(R, x, a) {
    const q = rationalize_1.rationalize(R);
    const degree = (p) => coeff_1.coeff(misc_1.yyexpand(p), x).length - 1;
    if (degree(denominator_1.denominator(q)) - degree(numerator_1.numerator(q)) < 2) {
        return [{ t: R, g: DIVERGES }];
    }
    const P = expand_1.apart(R, x);
    const fractions = defs_1.isadd(P) ? P.tail() : [P];
    const simple = fractions.filter((t) => degree(denominator_1.denominator(t)) === 1);
    const parts = fractions
        .filter((t) => !simple.includes(t))
        .map((t) => {
        const g = find_1.Find(t, x) ? infiniteTerm(t, x, a) || gosperSeries(t, x, a) : null;
        return { t, g: g === DIVERGES ? null : g };
    });
    if (simple.length > 0) {
        const t = simple.reduce(add_1.add, defs_1.Constants.zero);
        parts.push({ t, g: telescope(t, x, a, symbol_1.symbol(defs_1.INF)) });
    }
    return parts;
}
// more terms than this are not subtracted from a known series
const MAX_SKIPPED = 1000;
function infiniteTerm(t, x, a) {
    const at = (v) => eval_1.Eval(subst_1.subst(t, x, v));
    const next = at(add_1.add(x, defs_1.Constants.one));
    // the terms below the lower bound, for series known from 0 or 1 on
    const skipped = (from) => {
        const n = bignum_1.nativeInt(a);
        if (isNaN(n) || n < from || n - from > MAX_SKIPPED) {
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
            return DIVERGES;
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
        if (findSign(u, x) === undefined && defs_1.isNumericAtom(shift) && find_1.Find(cu, x)) {
            const g = leibniz(misc_1.yyexpand(simplify_1.simplify(multiply_1.divide(defs_1.Constants.one, u))), x, a);
            return g && multiply_1.multiply(shift, g);
        }
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
            return DIVERGES;
        }
        const c = simplify_1.simplify(multiply_1.multiply(t, power_1.power(x, s)));
        const head = skipped(1);
        return head && !find_1.Find(c, x) ? add_1.subtract(multiply_1.multiply(c, zeta_1.zeta(s)), head) : null;
    }
    return null;
}
// sum_{x=a}^{inf} (-1)^x/(c1*x+c0) with 2*c0/c1 an integer, shifted to the
// alternating harmonic series -log(2) = sum_{j>=1} (-1)^j/j (c0/c1 = s) or to
// the Leibniz series pi/4 = sum_{j>=0} (-1)^j/(2*j+1) (c0/c1 = s + 1/2):
// j = x + s, and the terms below j = a + s are subtracted.
function leibniz(inverse, x, a) {
    if (!is_1.ispolyexpandedform(inverse, x)) {
        return null;
    }
    const c = coeff_1.coeff(inverse, x);
    const twice = c.length === 2 ? bignum_1.nativeInt(simplify_1.simplify(multiply_1.divide(multiply_1.multiply(bignum_1.integer(2), c[0]), c[1]))) : NaN;
    const from = bignum_1.nativeInt(a);
    if (isNaN(twice) || isNaN(from)) {
        return null;
    }
    const odd = twice % 2 !== 0;
    const s = Math.floor(twice / 2);
    const first = odd ? 0 : 1;
    if (from + s < first || from + s > MAX_SKIPPED) {
        return null;
    }
    const term = (j) => multiply_1.divide(bignum_1.integer(j % 2 === 0 ? 1 : -1), bignum_1.integer(odd ? 2 * j + 1 : j));
    let series = odd
        ? multiply_1.divide(symbol_1.symbol(defs_1.PI), bignum_1.integer(4))
        : multiply_1.negate(log_1.logarithm(bignum_1.integer(2)));
    for (let j = first; j < from + s; j++) {
        series = add_1.subtract(series, term(j));
    }
    return multiply_1.divide(multiply_1.multiply(bignum_1.integer((s % 2 === 0 ? 1 : -1) * (odd ? 2 : 1)), series), c[1]);
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
// 0 and a finite number of terms is left. With b = inf the terms in b vanish,
// and the groups that do not add up to 0 (the caller has checked that the
// series converges, so all of them together do) give
//   sum_{x>=a} sum_i c_i/(x+m_i) = -sum_i c_i*digamma(a+m_i),
// exactly where digamma is known up to Euler's constant, which drops out.
// null when R has another shape.
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
    const loose = [];
    for (const f of fractions) {
        const key = frac(f.m);
        if (done.some((d) => misc_1.equal(d, key))) {
            continue;
        }
        done.push(key);
        const group = fractions.filter((g) => misc_1.equal(frac(g.m), key));
        const total = group.reduce((acc, g) => add_1.add(acc, g.c), defs_1.Constants.zero);
        if (!is_1.isZeroAtomOrTensor(simplify_1.simplify(total))) {
            if (!infinite) {
                return null;
            }
            loose.push(...group);
            continue;
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
    if (loose.length === 0) {
        return result;
    }
    const total = loose.reduce((acc, g) => add_1.add(acc, g.c), defs_1.Constants.zero);
    if (!is_1.isZeroAtomOrTensor(simplify_1.simplify(total))) {
        return null;
    }
    const at = loose.map((g) => add_1.add(a, g.m));
    const exact = at.map(digammaPlusEuler);
    const psi = exact.every((v) => v !== null)
        ? exact
        : at.map((v) => list_1.makeList(symbol_1.usr_symbol('digamma'), v));
    return loose.reduce((acc, g, i) => add_1.subtract(acc, multiply_1.multiply(g.c, psi[i])), result);
}
// digamma(r) + Euler's constant for r = n + p/q with q = 1, 2, 3, 4 or 6,
// from Gauss's digamma theorem
//   digamma(p/q) = -gamma - log(2*q) - pi/2*cot(pi*p/q)
//                  + 2*sum_{j<q/2} cos(2*pi*j*p/q)*log(sin(pi*j/q))
// and digamma(r+1) = digamma(r) + 1/r. null for other r and at the poles.
function digammaPlusEuler(r) {
    if (!defs_1.isrational(r)) {
        return null;
    }
    const q = bignum_1.nativeInt(denominator_1.denominator(r));
    let n = Math.floor(toNumber(r));
    let f = add_1.subtract(r, bignum_1.integer(n)); // 0 < f <= 1
    if (is_1.isZeroAtomOrTensor(f)) {
        f = defs_1.Constants.one;
        n--;
    }
    if (![1, 2, 3, 4, 6].includes(q) || (q === 1 && n < 0) || Math.abs(n) > MAX_SKIPPED) {
        return null;
    }
    const log = (k) => log_1.logarithm(bignum_1.integer(k));
    const root3Pi = multiply_1.multiply(power_1.power(bignum_1.integer(3), bignum_1.rational(1, 2)), symbol_1.symbol(defs_1.PI));
    const [piTerm, logs] = {
        1: [defs_1.Constants.zero, defs_1.Constants.zero],
        2: [defs_1.Constants.zero, multiply_1.multiply(bignum_1.integer(2), log(2))],
        3: [multiply_1.divide(root3Pi, bignum_1.integer(6)), multiply_1.multiply(bignum_1.rational(3, 2), log(3))],
        4: [multiply_1.divide(symbol_1.symbol(defs_1.PI), bignum_1.integer(2)), multiply_1.multiply(bignum_1.integer(3), log(2))],
        6: [
            multiply_1.divide(root3Pi, bignum_1.integer(2)),
            add_1.add(multiply_1.multiply(bignum_1.integer(2), log(2)), multiply_1.multiply(bignum_1.rational(3, 2), log(3)))
        ]
    }[q];
    let value = add_1.subtract(2 * toNumber(f) < 1 ? multiply_1.negate(piTerm) : piTerm, logs);
    for (let j = 0; j < n; j++) {
        value = add_1.add(value, multiply_1.divide(defs_1.Constants.one, add_1.add(f, bignum_1.integer(j))));
    }
    for (let j = 1; j <= -n; j++) {
        value = add_1.subtract(value, multiply_1.divide(defs_1.Constants.one, add_1.subtract(f, bignum_1.integer(j))));
    }
    return value;
}
// a pole of the summand at an integer from the lower limit on: the closed
// forms would step over it, 1/(x*(x+1)) from -5 on has no sum
function hasIntegerPole(f, x, a) {
    const from = bignum_1.nativeInt(a);
    if (isNaN(from)) {
        return false;
    }
    // the factors of p without their numeric exponents; x^s is left alone
    const bases = (p) => (defs_1.ismultiply(p) ? p.tail() : [p])
        .filter((q) => !defs_1.ispower(q) || defs_1.isNumericAtom(defs_1.caddr(q)))
        .map((q) => (defs_1.ispower(q) ? defs_1.cadr(q) : q));
    const isPole = (p) => {
        const c = find_1.Find(p, x) && is_1.ispolyexpandedform(p, x) ? coeff_1.coeff(p, x) : [];
        const root = c.length === 2 && multiply_1.negate(multiply_1.divide(c[0], c[1]));
        return root && defs_1.isrational(root) && is_1.isinteger(root) && toNumber(root) >= from;
    };
    return bases(denominator_1.denominator(f)).some((p) => {
        if (!find_1.Find(p, x) || !is_1.ispolyexpandedform(p, x)) {
            return false;
        }
        const c = coeff_1.coeff(p, x);
        // rational roots are linear factors; symbolic coefficients are left alone
        return c.length > 2 && c.every((k) => defs_1.isrational(k))
            ? bases(factorpoly_1.factorpoly(p, x)).some(isPole)
            : isPole(p);
    });
}
function toNumber(p) {
    const f = float_1.zzfloat(p);
    return defs_1.isdouble(f) ? f.d : NaN;
}
