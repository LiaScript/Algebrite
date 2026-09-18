"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realRootLogs = exports.realTrigReciprocal = exports.heuristicIntegral = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const abs_1 = require("./abs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const denominator_1 = require("./denominator");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const float_1 = require("./float");
const gcd_1 = require("./gcd");
const integral_1 = require("./integral");
const misc_1 = require("./misc");
const assume_1 = require("./assume");
const is_1 = require("./is");
const list_1 = require("./list");
const log_1 = require("./log");
const multiply_1 = require("./multiply");
const sin_1 = require("./sin");
const cos_1 = require("./cos");
const numerator_1 = require("./numerator");
const partition_1 = require("./partition");
const power_1 = require("./power");
const quotient_1 = require("./quotient");
const rationalize_1 = require("./rationalize");
const subst_1 = require("./subst");
// Integration methods tried when the table (and partial fractions) fail:
// closed forms for exp(a*x)*sin(b*x), abs(linear) and 1/(quadratic with
// real roots), then tan^2 rewriting, u-substitution and integration by
// parts. Each returns undefined when it does not apply. Sub-integrals go
// back through integral(), so the methods combine; depth bounds the recursion.
// A quadratic with a linear term is shifted to the table forms, a rational
// function of sin, cos, tan becomes one of u = tan(x) or of t = tan(x/2).
// ponytail: no Risch; add a method here when a class of integrands keeps
// failing.
const MAX_DEPTH = 5;
function heuristicIntegral(F, X, depth) {
    if (depth > MAX_DEPTH) {
        return undefined;
    }
    // partition splits the factors of a product, anything else is one factor
    const [c, G] = defs_1.ismultiply(F) ? partition_1.partition(F, X) : [defs_1.Constants.one, F];
    const r = expTrig(G, X) ||
        absLinear(G, X) ||
        quadraticLog(G, X) ||
        completeSquare(G, X, depth) ||
        specialIntegral(G, X) ||
        sqrtTan(G, X) ||
        quarticReciprocal(G, X) ||
        hyperbolicToExp(G, X, depth) ||
        tanSquared(G, X, depth) ||
        bySubstitution(G, X, depth) ||
        tanWithSinCos(G, X, depth) ||
        tanSubstitution(G, X, depth) ||
        weierstrass(G, X, depth) ||
        byParts(G, X, depth);
    return r === undefined ? undefined : multiply_1.multiply(c, r);
}
exports.heuristicIntegral = heuristicIntegral;
function tryIntegral(F, X, depth) {
    try {
        return integral_1.integral(F, X, depth + 1);
    }
    catch (e) {
        return undefined;
    }
}
function factorsOf(F) {
    return defs_1.ismultiply(F) ? F.tail() : [F];
}
function isFn(p, name) {
    return defs_1.iscons(p) && defs_1.car(p) === symbol_1.symbol(name);
}
// the slope of an expression linear in X, undefined otherwise
function slope(p, X) {
    const a = derivative_1.derivative(p, X);
    return find_1.Find(a, X) || is_1.isZeroAtomOrTensor(a) ? undefined : a;
}
// exp(p)*sin(q) = exp(p)*(a*sin(q)-b*cos(q))/(a^2+b^2), p' = a, q' = b,
// and exp(p)*cos(q) = exp(p)*(a*cos(q)+b*sin(q))/(a^2+b^2)
function expTrig(F, X) {
    const fs = factorsOf(F);
    if (fs.length !== 2) {
        return undefined;
    }
    const ex = fs.find((f) => defs_1.ispower(f) && defs_1.cadr(f) === symbol_1.symbol(defs_1.E));
    const tr = fs.find((f) => isFn(f, defs_1.SIN) || isFn(f, defs_1.COS));
    if (!ex || !tr) {
        return undefined;
    }
    const a = slope(defs_1.caddr(ex), X);
    const b = slope(defs_1.cadr(tr), X);
    if (!a || !b) {
        return undefined;
    }
    const q = defs_1.cadr(tr);
    const other = list_1.makeList(symbol_1.symbol(isFn(tr, defs_1.SIN) ? defs_1.COS : defs_1.SIN), q);
    const num = isFn(tr, defs_1.SIN)
        ? add_1.subtract(multiply_1.multiply(a, tr), multiply_1.multiply(b, other))
        : add_1.add(multiply_1.multiply(a, tr), multiply_1.multiply(b, other));
    return eval_1.Eval(multiply_1.divide(multiply_1.multiply(ex, num), add_1.add(power_1.power(a, bignum_1.integer(2)), power_1.power(b, bignum_1.integer(2)))));
}
// abs(g) with g = a*X+b: g*abs(g)/(2*a)
function absLinear(F, X) {
    if (!isFn(F, defs_1.ABS)) {
        return undefined;
    }
    const g = defs_1.cadr(F);
    const a = slope(g, X);
    return a && multiply_1.divide(multiply_1.multiply(g, F), multiply_1.multiply(bignum_1.integer(2), a));
}
// 1/(c2*X^2+c1*X+c0) with D = c1^2-4*c0*c2 > 0:
// log|(2*c2*X+c1-sqrt(D))/(2*c2*X+c1+sqrt(D))|/sqrt(D)
function quadraticLog(F, X) {
    if (!defs_1.ispower(F) || !misc_1.equal(defs_1.caddr(F), defs_1.Constants.negOne) || !is_1.ispolyexpandedform(defs_1.cadr(F), X)) {
        return undefined;
    }
    const k = coeff_1.coeff(defs_1.cadr(F), X);
    if (k.length !== 3) {
        return undefined;
    }
    const [c0, c1, c2] = k;
    const D = add_1.subtract(power_1.power(c1, bignum_1.integer(2)), multiply_1.multiply(bignum_1.integer(4), multiply_1.multiply(c0, c2)));
    if (is_1.isZeroAtomOrTensor(D) || is_1.isnegativenumber(D) || assume_1.isPositive(D) !== true) {
        return undefined;
    }
    const s = power_1.power(D, bignum_1.rational(1, 2));
    const lin = add_1.add(multiply_1.multiply(bignum_1.integer(2), multiply_1.multiply(c2, X)), c1);
    const q = multiply_1.divide(list_1.makeList(symbol_1.symbol(defs_1.ABS), add_1.subtract(lin, s)), list_1.makeList(symbol_1.symbol(defs_1.ABS), add_1.add(lin, s)));
    return multiply_1.divide(list_1.makeList(symbol_1.symbol(defs_1.LOG), q), s);
}
// Integrals that are special functions by definition: sin(a*X)/X = Si,
// cos(a*X)/X = Ci, exp(a*X)/X = Ei, 1/log(X) = Ei(log(X)), and with
// k = sqrt(2*a/pi), a > 0: sin(a*X^2) = fresnels(k*X)/k, cos likewise
function specialIntegral(F, X) {
    const fn = (name, arg) => eval_1.Eval(list_1.makeList(symbol_1.usr_symbol(name), arg));
    const isInverseOf = (f, g) => defs_1.ispower(f) && misc_1.equal(defs_1.caddr(f), defs_1.Constants.negOne) && g(defs_1.cadr(f));
    if (isInverseOf(F, (b) => isFn(b, defs_1.LOG) && misc_1.equal(defs_1.cadr(b), X))) {
        return fn('Ei', defs_1.cadr(F));
    }
    const fs = factorsOf(F);
    const overX = fs.find((f) => isInverseOf(f, (b) => misc_1.equal(b, X)));
    if (fs.length === 2 && overX) {
        const g = fs.find((f) => f !== overX);
        const isExp = defs_1.ispower(g) && defs_1.cadr(g) === symbol_1.symbol(defs_1.E);
        if (isFn(g, defs_1.SIN) || isFn(g, defs_1.COS) || isExp) {
            const arg = isExp ? defs_1.caddr(g) : defs_1.cadr(g);
            if (!find_1.Find(multiply_1.divide(arg, X), X)) {
                return fn(isFn(g, defs_1.SIN) ? 'Si' : isFn(g, defs_1.COS) ? 'Ci' : 'Ei', arg);
            }
        }
    }
    if (isFn(F, defs_1.SIN) || isFn(F, defs_1.COS)) {
        const a = multiply_1.divide(defs_1.cadr(F), power_1.power(X, bignum_1.integer(2)));
        if (!find_1.Find(a, X) && assume_1.isPositive(a) === true) {
            const k = power_1.power(multiply_1.divide(multiply_1.multiply(bignum_1.integer(2), a), defs_1.Constants.Pi()), bignum_1.rational(1, 2));
            return multiply_1.divide(fn(isFn(F, defs_1.SIN) ? 'fresnels' : 'fresnelc', multiply_1.multiply(k, X)), k);
        }
    }
    return undefined;
}
// 1/(c4*X^4+c0) with c = c0/c4 > 0 and a = c^(1/4):
// log((X^2+sqrt(2)*a*X+a^2)/(X^2-sqrt(2)*a*X+a^2))/(4*sqrt(2)*a^3)
// + (arctan(sqrt(2)*X/a+1)+arctan(sqrt(2)*X/a-1))/(2*sqrt(2)*a^3), over c4
function quarticReciprocal(F, X) {
    if (!defs_1.ispower(F) || !misc_1.equal(defs_1.caddr(F), defs_1.Constants.negOne) || !is_1.ispolyexpandedform(defs_1.cadr(F), X)) {
        return undefined;
    }
    const k = coeff_1.coeff(defs_1.cadr(F), X);
    if (k.length !== 5 || !k.slice(1, 4).every((c) => is_1.isZeroAtomOrTensor(c))) {
        return undefined;
    }
    const c = multiply_1.divide(k[0], k[4]);
    if (assume_1.isPositive(c) !== true) {
        return undefined;
    }
    const a = power_1.power(c, bignum_1.rational(1, 4));
    const r2 = power_1.power(bignum_1.integer(2), bignum_1.rational(1, 2));
    const a2 = power_1.power(a, bignum_1.integer(2));
    const mid = multiply_1.multiply(multiply_1.multiply(r2, a), X);
    const x2 = power_1.power(X, bignum_1.integer(2));
    const log = list_1.makeList(symbol_1.symbol(defs_1.LOG), multiply_1.divide(add_1.add(add_1.add(x2, mid), a2), add_1.add(add_1.subtract(x2, mid), a2)));
    const u = multiply_1.divide(multiply_1.multiply(r2, X), a);
    const atan = add_1.add(list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), add_1.add(u, defs_1.Constants.one)), list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), add_1.subtract(u, defs_1.Constants.one)));
    const a3 = power_1.power(a, bignum_1.integer(3));
    return eval_1.Eval(multiply_1.divide(add_1.add(multiply_1.divide(log, multiply_1.multiply(multiply_1.multiply(bignum_1.integer(4), r2), a3)), multiply_1.divide(atan, multiply_1.multiply(multiply_1.multiply(bignum_1.integer(2), r2), a3))), k[4]));
}
// exp together with sinh or cosh: the hyperbolic functions in exp form
function hyperbolicToExp(F, X, depth) {
    const hasExp = findWhere(F, (p) => defs_1.ispower(p) && defs_1.cadr(p) === symbol_1.symbol(defs_1.E) && find_1.Find(defs_1.caddr(p), X));
    const hyp = findWhere(F, (p) => (isFn(p, defs_1.SINH) || isFn(p, defs_1.COSH)) && find_1.Find(defs_1.cadr(p), X));
    if (!hasExp || !hyp) {
        return undefined;
    }
    const u = defs_1.cadr(hyp);
    const plus = power_1.power(symbol_1.symbol(defs_1.E), u);
    const minus = power_1.power(symbol_1.symbol(defs_1.E), multiply_1.negate(u));
    const asExp = multiply_1.divide(isFn(hyp, defs_1.SINH) ? add_1.subtract(plus, minus) : add_1.add(plus, minus), bignum_1.integer(2));
    return tryIntegral(defs_1.doexpand(eval_1.Eval, subst_1.subst(F, hyp, asExp)), X, depth);
}
// 1/(a+b*cos(q)) and 1/(a+b*sin(q)), q linear in X, numbers a^2 > b^2:
//   cos: 2/s*arctan(sqrt((a-b)/(a+b))*tan(q/2)), s = sqrt(a^2-b^2)
//   sin: 2/s*arctan((a*tan(q/2)+b)/s)
// With a^2 < b^2 the half-angle substitution gives real logarithms.
// Tried before the table, whose entry for these is a complex logarithm.
function realTrigReciprocal(F, X, depth) {
    if (!defs_1.ispower(F) || !misc_1.equal(defs_1.caddr(F), defs_1.Constants.negOne)) {
        return undefined;
    }
    const S = defs_1.cadr(F);
    const t = findWhere(S, (p) => (isFn(p, defs_1.SIN) || isFn(p, defs_1.COS)) && find_1.Find(defs_1.cadr(p), X));
    if (!t) {
        return undefined;
    }
    const q = defs_1.cadr(t);
    const slopeQ = slope(q, X);
    const u = symbol_1.usr_symbol('integral_u');
    const Su = subst_1.subst(S, t, u);
    const b = derivative_1.derivative(Su, u);
    const a = eval_1.Eval(add_1.subtract(Su, multiply_1.multiply(b, u)));
    const [an, bn] = [float_1.zzfloat(a), float_1.zzfloat(b)];
    // a = 0 is 1/cos or 1/sin, a^2 = b^2 has a tan without a log: both in the table
    if (!slopeQ || !defs_1.isdouble(an) || !defs_1.isdouble(bn) || an.d === 0 || an.d * an.d === bn.d * bn.d) {
        return undefined;
    }
    if (an.d * an.d < bn.d * bn.d) {
        return weierstrass(F, X, depth);
    }
    if (an.d < 0) {
        const flipped = realTrigReciprocal(power_1.power(multiply_1.negate(S), defs_1.Constants.negOne), X, depth);
        return flipped && multiply_1.negate(flipped);
    }
    const s = power_1.power(add_1.subtract(power_1.power(a, bignum_1.integer(2)), power_1.power(b, bignum_1.integer(2))), bignum_1.rational(1, 2));
    const tanHalf = list_1.makeList(symbol_1.symbol(defs_1.TAN), multiply_1.divide(q, bignum_1.integer(2)));
    const inner = isFn(t, defs_1.COS)
        ? multiply_1.multiply(power_1.power(multiply_1.divide(add_1.subtract(a, b), add_1.add(a, b)), bignum_1.rational(1, 2)), tanHalf)
        : multiply_1.divide(add_1.add(multiply_1.multiply(a, tanHalf), b), s);
    return eval_1.Eval(multiply_1.divide(multiply_1.multiply(bignum_1.integer(2), list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), inner)), multiply_1.multiply(s, slopeQ)));
}
exports.realTrigReciprocal = realTrigReciprocal;
// (c2*X^2+c1*X+c0)^r with c1 != 0, r a root or a negative power: with
// u = X+c1/(2*c2) the quadratic is c2*u^2+c0-c1^2/(4*c2), a table form.
// For an integer r the table picks arctan or log by the sign of
// 4*c0*c2-c1^2 and takes an undecidable sign as met, so it is asked here;
// the entries for the roots ask for the sign of c2 themselves.
function completeSquare(F, X, depth) {
    let k = [];
    const q = findWhere(F, (p) => {
        if (!defs_1.ispower(p) || !defs_1.isNumericAtom(defs_1.caddr(p)) || is_1.isposint(defs_1.caddr(p))) {
            return false;
        }
        if (!is_1.ispolyexpandedform(defs_1.cadr(p), X)) {
            return false;
        }
        k = coeff_1.coeff(defs_1.cadr(p), X);
        return k.length === 3 && !is_1.isZeroAtomOrTensor(k[1]);
    });
    if (!q) {
        return undefined;
    }
    const [c0, c1, c2] = k;
    const D = add_1.subtract(multiply_1.multiply(bignum_1.integer(4), multiply_1.multiply(c0, c2)), power_1.power(c1, bignum_1.integer(2)));
    if (is_1.isinteger(defs_1.caddr(q)) && assume_1.isPositive(D) !== true && assume_1.isNegative(D) !== true) {
        return undefined;
    }
    const u = symbol_1.usr_symbol('integral_v');
    const h = multiply_1.divide(c1, multiply_1.multiply(bignum_1.integer(2), c2));
    const shifted = add_1.add(multiply_1.multiply(c2, power_1.power(u, bignum_1.integer(2))), add_1.subtract(c0, multiply_1.divide(power_1.power(c1, bignum_1.integer(2)), multiply_1.multiply(bignum_1.integer(4), c2))));
    const G = subst_1.subst(subst_1.subst(F, defs_1.cadr(q), shifted), X, add_1.subtract(u, h));
    const I = tryIntegral(defs_1.doexpand(eval_1.Eval, G), u, depth);
    return I && realRootLogs(eval_1.Eval(subst_1.subst(I, u, add_1.add(X, h))), X);
}
// A term c*log(w), c free of X and w with a root in it, becomes
// c*log(abs(w)): X+sqrt(X^2-4) is negative for X < -2, and
// d/dX log|w| = w'/w wherever w is real, so this is the same antiderivative
// for w > 0 and the real one for w < 0. realLogs of integral.ts asks for a
// provably real w, which a root of a quadratic with real roots is not.
// ponytail: where the root is imaginary abs is no antiderivative any more;
// the integrand has the same root as a factor and is not real there either.
function realRootLogs(F, X) {
    // roots of a polynomial only: the logs of sqrt(tan(X)) are positive as they are
    const isRoot = (p) => defs_1.ispower(p) &&
        defs_1.isrational(defs_1.caddr(p)) &&
        !is_1.isinteger(defs_1.caddr(p)) &&
        find_1.Find(defs_1.cadr(p), X) &&
        is_1.ispolyexpandedform(defs_1.cadr(p), X);
    const term = (t) => {
        const withX = factorsOf(t).filter((f) => find_1.Find(f, X));
        const L = withX[0];
        if (withX.length !== 1 || !isFn(L, defs_1.LOG) || !findWhere(defs_1.cadr(L), isRoot)) {
            return t;
        }
        // a provably real w is left to realLogs, which sees the simplified result
        const w = defs_1.cadr(L);
        // an argument with abs(X) in it has been made real by its table entry
        if (assume_1.isReal(w) === true || assume_1.isPositive(w) === true || find_1.Find(w, symbol_1.symbol(defs_1.ABS))) {
            return t;
        }
        // abs takes the numeric content out, 1/5*abs(...), and log(1/5) is a
        // constant of integration. abs is not idempotent (it may first turn the
        // sign and find the content only in that form), so the final Eval of
        // integral() would bring the constant back: repeat until it is stable.
        let v = w;
        for (let i = 0; i < 3; i++) {
            const A = abs_1.abs(isFn(v, defs_1.ABS) ? defs_1.cadr(v) : v);
            v = defs_1.ismultiply(A) ? partition_1.partition(A, X)[1] : A;
        }
        return multiply_1.multiply(product(factorsOf(t).filter((f) => f !== L)), log_1.logarithm(v));
    };
    return (defs_1.isadd(F) ? F.tail() : [F]).reduce((acc, t) => add_1.add(acc, term(t)), defs_1.Constants.zero);
}
exports.realRootLogs = realRootLogs;
// tan(q)^(1/2) and tan(q)^(-1/2), q linear in X: with u = sqrt(tan(q)) the
// integrand is 2*u^2/(1+u^4) or 2/(1+u^4), so with m = sqrt(2)*u the integral is
// +-(log(u^2-m+1)-log(u^2+m+1))/(2*sqrt(2)) + (arctan(m+1)+arctan(m-1))/sqrt(2).
// A positive constant c in (c*tan(q))^r comes out as c^r.
function sqrtTan(F, X) {
    const inverse = defs_1.ispower(F) && is_1.equalq(defs_1.caddr(F), -1, 2);
    if (!defs_1.ispower(F) || !(inverse || is_1.equalq(defs_1.caddr(F), 1, 2))) {
        return undefined;
    }
    const [c, tan] = defs_1.ismultiply(defs_1.cadr(F)) ? partition_1.partition(defs_1.cadr(F), X) : [defs_1.Constants.one, defs_1.cadr(F)];
    const a = isFn(tan, defs_1.TAN) && assume_1.isPositive(c) === true && slope(defs_1.cadr(tan), X);
    if (!a) {
        return undefined;
    }
    const r2 = power_1.power(bignum_1.integer(2), bignum_1.rational(1, 2));
    const m = multiply_1.multiply(r2, power_1.power(tan, bignum_1.rational(1, 2)));
    const t1 = add_1.add(tan, defs_1.Constants.one);
    // both arguments are positive: (u-1/sqrt(2))^2+1/2 and (u+1/sqrt(2))^2+1/2
    const log = add_1.subtract(list_1.makeList(symbol_1.symbol(defs_1.LOG), add_1.subtract(t1, m)), list_1.makeList(symbol_1.symbol(defs_1.LOG), add_1.add(t1, m)));
    const atan = add_1.add(list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), add_1.add(m, defs_1.Constants.one)), list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), add_1.subtract(m, defs_1.Constants.one)));
    const sum = add_1.add(multiply_1.divide(inverse ? multiply_1.negate(log) : log, multiply_1.multiply(bignum_1.integer(2), r2)), multiply_1.divide(atan, r2));
    return eval_1.Eval(multiply_1.divide(multiply_1.multiply(power_1.power(c, defs_1.caddr(F)), sum), a));
}
// the argument q of the first sin, cos or tan with X in it, if linear in X
function trigArgument(F, X) {
    const t = findWhere(F, (p) => (isFn(p, defs_1.SIN) || isFn(p, defs_1.COS) || isFn(p, defs_1.TAN)) && find_1.Find(defs_1.cadr(p), X));
    return t && slope(defs_1.cadr(t), X) ? defs_1.cadr(t) : undefined;
}
function substTrig(F, q, sin, cos, tan) {
    const at = (name) => list_1.makeList(symbol_1.symbol(name), q);
    return subst_1.subst(subst_1.subst(subst_1.subst(F, at(defs_1.SIN), sin), at(defs_1.COS), cos), at(defs_1.TAN), tan);
}
// rationalize() leaves the fractions inside a denominator: bottom-up, and
// unexpanded, or Eval distributes each numerator over its denominator again
function together(p) {
    return defs_1.iscons(p)
        ? rationalize_1.rationalize(defs_1.noexpand(eval_1.Eval, list_1.makeList(defs_1.car(p), ...p.tail().map(together))))
        : p;
}
const MAX_DEGREE = 8;
// N/D in lowest terms, undefined unless both are polynomials in u of a
// degree the partial fractions can take
function lowestTerms(N, D, u) {
    [N, D] = [N, D].map((p) => defs_1.doexpand(eval_1.Eval, p));
    const isPoly = (p) => !find_1.Find(p, u) || (is_1.ispolyexpandedform(p, u) && coeff_1.coeff(p, u).length <= MAX_DEGREE + 1);
    if (!isPoly(N) || !isPoly(D)) {
        return undefined;
    }
    const g = gcd_1.gcd(N, D);
    return find_1.Find(g, u) ? multiply_1.divide(quotient_1.divpoly(N, g, u), quotient_1.divpoly(D, g, u)) : multiply_1.divide(N, D);
}
// A rational function of tan(q), sin(q)^2, cos(q)^2 and sin(q)*cos(q) (it
// has the period pi), q linear in X: u = tan(q), sin = u*c, cos = c,
// c^2 = 1/(1+u^2), dX = du/(q'*(1+u^2)). Numerator and denominator are
// either both even or both odd in c; if odd, both are multiplied by c.
// sin(x)*tan(x), tan(x)/cos(x): tan next to sin or cos is written as
// sin/cos, which the table and the substitutions above integrate in short
// form. tan alone stays for the tan substitution.
function tanWithSinCos(F, X, depth) {
    const tan = findWhere(F, (p) => isFn(p, defs_1.TAN) && find_1.Find(defs_1.cadr(p), X));
    if (!tan || !findWhere(F, (p) => isFn(p, defs_1.SIN) || isFn(p, defs_1.COS))) {
        return;
    }
    const q = defs_1.cadr(tan);
    return tryIntegral(subst_1.subst(F, tan, multiply_1.divide(sin_1.sine(q), cos_1.cosine(q))), X, depth);
}
function tanSubstitution(F, X, depth) {
    const q = trigArgument(F, X);
    if (!q) {
        return undefined;
    }
    const u = symbol_1.usr_symbol('integral_t');
    const c = symbol_1.usr_symbol('integral_c');
    const G = together(substTrig(F, q, multiply_1.multiply(u, c), c, u));
    if (find_1.Find(G, X)) {
        return undefined;
    }
    const w = add_1.add(defs_1.Constants.one, power_1.power(u, bignum_1.integer(2)));
    const inU = (p) => defs_1.doexpand(eval_1.Eval, evenPowers(defs_1.doexpand(eval_1.Eval, p), c, power_1.power(w, defs_1.Constants.negOne)));
    let [N, D] = [numerator_1.numerator(G), denominator_1.denominator(G)].map(inU);
    if (find_1.Find(N, c) || find_1.Find(D, c)) {
        [N, D] = [numerator_1.numerator(G), denominator_1.denominator(G)].map((p) => inU(multiply_1.multiply(p, c)));
    }
    if (find_1.Find(N, c) || find_1.Find(D, c)) {
        return undefined;
    }
    const H = together(multiply_1.divide(N, multiply_1.multiply(D, multiply_1.multiply(slope(q, X), w))));
    const R = lowestTerms(numerator_1.numerator(H), denominator_1.denominator(H), u);
    const I = R && tryIntegral(R, u, depth);
    return I && backSubstitute(I, u, list_1.makeList(symbol_1.symbol(defs_1.TAN), q), q);
}
// Any rational function of sin(q), cos(q), tan(q), q linear in X:
// t = tan(q/2), sin = 2*t/(1+t^2), cos = (1-t^2)/(1+t^2), dX = 2*dt/(q'*(1+t^2))
function weierstrass(F, X, depth) {
    const q = trigArgument(F, X);
    if (!q) {
        return undefined;
    }
    const t = symbol_1.usr_symbol('integral_t');
    const t2 = power_1.power(t, bignum_1.integer(2));
    const w = add_1.add(defs_1.Constants.one, t2);
    const sin = multiply_1.divide(multiply_1.multiply(bignum_1.integer(2), t), w);
    const tan = multiply_1.divide(multiply_1.multiply(bignum_1.integer(2), t), add_1.subtract(defs_1.Constants.one, t2));
    const G = substTrig(F, q, sin, multiply_1.divide(add_1.subtract(defs_1.Constants.one, t2), w), tan);
    if (find_1.Find(G, X)) {
        return undefined;
    }
    const H = together(multiply_1.divide(multiply_1.multiply(bignum_1.integer(2), G), multiply_1.multiply(slope(q, X), w)));
    const R = lowestTerms(numerator_1.numerator(H), denominator_1.denominator(H), t);
    const I = R && tryIntegral(R, t, depth);
    const half = multiply_1.divide(q, bignum_1.integer(2));
    return I && backSubstitute(I, t, list_1.makeList(symbol_1.symbol(defs_1.TAN), half), half);
}
// u = tan(angle) again: arctan(u) is the angle itself (up to a constant on
// each interval between the poles), and every log gets a readable argument
function backSubstitute(I, u, tan, angle) {
    const terms = defs_1.isadd(I) ? I.tail() : [I];
    const split = terms.reduce((acc, term) => add_1.add(acc, splitLog(term, u)), defs_1.Constants.zero);
    return eval_1.Eval(subst_1.subst(subst_1.subst(split, list_1.makeList(symbol_1.symbol(defs_1.ARCTAN), u), angle), u, tan));
}
// c*log(N/D) = c*log|N| - c*log|D| up to a constant, where N and D lose
// their numeric content; c*arctanh(w) = c/2*log((1+w)/(1-w)) is only real
// for |w| < 1, the logs of the absolute values everywhere
function splitLog(term, u) {
    const fs = factorsOf(term);
    const withU = fs.filter((f) => find_1.Find(f, u));
    const L = withU[0];
    if (withU.length !== 1 || !(isFn(L, defs_1.LOG) || isFn(L, defs_1.ARCTANH))) {
        return term;
    }
    let c = product(fs.filter((f) => f !== L));
    let w = defs_1.cadr(L);
    if (isFn(L, defs_1.ARCTANH)) {
        c = multiply_1.divide(c, bignum_1.integer(2));
        w = multiply_1.divide(add_1.add(defs_1.Constants.one, w), add_1.subtract(defs_1.Constants.one, w));
    }
    w = together(w);
    const part = (p) => {
        p = primitivePart(isFn(p, defs_1.ABS) ? defs_1.cadr(p) : p, u);
        return !find_1.Find(p, u) ? defs_1.Constants.zero : log_1.logarithm(assume_1.isPositive(p) === true ? p : abs_1.abs(p));
    };
    return multiply_1.multiply(c, add_1.subtract(part(numerator_1.numerator(w)), part(denominator_1.denominator(w))));
}
// 6*u+2 becomes 3*u+1, sqrt(2)*u-2 becomes u-sqrt(2), -u+2 becomes u-2
function primitivePart(p, u) {
    if (!find_1.Find(p, u) || !is_1.ispolyexpandedform(p, u)) {
        return p;
    }
    const k = coeff_1.coeff(p, u);
    const lead = k[k.length - 1];
    let g = k.every((n) => defs_1.isrational(n)) ? k.reduce(gcd_1.gcd) : lead;
    if (is_1.isnegativeterm(lead) !== is_1.isnegativeterm(g)) {
        g = multiply_1.negate(g);
    }
    return defs_1.doexpand(eval_1.Eval, multiply_1.divide(p, g));
}
// tan(u)^2 = 1/cos(u)^2 - 1
function tanSquared(F, X, depth) {
    const t = findWhere(F, (p) => defs_1.ispower(p) && isFn(defs_1.cadr(p), defs_1.TAN) && misc_1.equal(defs_1.caddr(p), bignum_1.integer(2)));
    if (!t) {
        return undefined;
    }
    const u = defs_1.cadr(defs_1.cadr(t));
    const G = eval_1.Eval(subst_1.subst(F, t, add_1.subtract(power_1.power(list_1.makeList(symbol_1.symbol(defs_1.COS), u), bignum_1.integer(-2)), defs_1.Constants.one)));
    return tryIntegral(G, X, depth);
}
function findWhere(p, pred) {
    if (!defs_1.iscons(p)) {
        return undefined;
    }
    if (pred(p)) {
        return p;
    }
    for (const el of p.tail()) {
        const found = findWhere(el, pred);
        if (found) {
            return found;
        }
    }
    return undefined;
}
// F = h(g(X))*g'(X): integral of h(u) at u = g. g runs over the
// subexpressions of F containing X, plus sin(X) and cos(X) for odd trig
// powers, where the even powers of the other function become 1-u^2.
function bySubstitution(F, X, depth) {
    const u = symbol_1.usr_symbol('integral_u');
    for (const g of candidates(F, X)) {
        const dg = derivative_1.derivative(g, X);
        if (is_1.isZeroAtomOrTensor(dg)) {
            continue;
        }
        const ratio = eval_1.Eval(multiply_1.divide(F, dg));
        let h = subst_1.subst(ratio, g, u);
        if (defs_1.ispower(g) && defs_1.cadr(g) === symbol_1.symbol(defs_1.E)) {
            // 1/exp(p) is kept as exp(-p)
            h = subst_1.subst(h, power_1.power(symbol_1.symbol(defs_1.E), multiply_1.negate(defs_1.caddr(g))), power_1.power(u, defs_1.Constants.negOne));
        }
        if (find_1.Find(h, X) && isFn(g, defs_1.SIN)) {
            h = evenPowers(h, list_1.makeList(symbol_1.symbol(defs_1.COS), X), oneMinusSquare(u));
        }
        else if (find_1.Find(h, X) && isFn(g, defs_1.COS)) {
            h = evenPowers(h, list_1.makeList(symbol_1.symbol(defs_1.SIN), X), oneMinusSquare(u));
        }
        if (find_1.Find(h, X)) {
            continue;
        }
        const I = tryIntegral(eval_1.Eval(h), u, depth);
        if (I !== undefined) {
            return subst_1.subst(I, u, g);
        }
    }
    return undefined;
}
function candidates(F, X) {
    const acc = [];
    const walk = (p, root) => {
        if (!defs_1.iscons(p) || !find_1.Find(p, X)) {
            return;
        }
        if (!root && !acc.some((q) => misc_1.equal(q, p))) {
            acc.push(p);
        }
        p.tail().forEach((el) => walk(el, false));
    };
    walk(F, true);
    if (find_1.Find(F, symbol_1.symbol(defs_1.SIN)) || find_1.Find(F, symbol_1.symbol(defs_1.COS))) {
        for (const fn of [defs_1.SIN, defs_1.COS]) {
            const t = list_1.makeList(symbol_1.symbol(fn), X);
            if (!acc.some((q) => misc_1.equal(q, t))) {
                acc.push(t);
            }
        }
    }
    return acc;
}
function oneMinusSquare(u) {
    return add_1.subtract(defs_1.Constants.one, power_1.power(u, bignum_1.integer(2)));
}
// fn^(2k) becomes square^k
function evenPowers(p, fn, square) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    if (defs_1.ispower(p) && misc_1.equal(defs_1.cadr(p), fn) && is_1.iseveninteger(defs_1.caddr(p))) {
        return power_1.power(square, multiply_1.divide(defs_1.caddr(p), bignum_1.integer(2)));
    }
    return list_1.makeList(...p.map((el) => evenPowers(el, fn, square)));
}
// Integration by parts, u chosen by LIATE: a log, inverse trig or erf
// factor, else a power of X against the rest (exp, trig, ...). With u = X^n
// the smallest power that makes the rest integrable is taken, so that
// x^2*exp(-x^2) becomes x times x*exp(-x^2).
function byParts(F, X, depth) {
    const fs = factorsOf(F).filter((f) => find_1.Find(f, X));
    const isL = (f) => [defs_1.LOG, defs_1.ARCSIN, defs_1.ARCCOS, defs_1.ARCTAN, defs_1.ERF].some((n) => isFn(f, n)) ||
        (defs_1.ispower(f) && isL(defs_1.cadr(f)) && is_1.isposint(defs_1.caddr(f)));
    const L = fs.filter(isL);
    const rest = fs.filter((f) => !isL(f));
    if (L.length === 1) {
        return parts(L[0], product(rest), X, depth);
    }
    if (L.length > 0) {
        return undefined;
    }
    const P = fs.filter((f) => is_1.ispolyexpandedform(f, X));
    const others = fs.filter((f) => !is_1.ispolyexpandedform(f, X));
    if (P.length === 0 || others.length === 0) {
        return undefined;
    }
    const n = coeff_1.coeff(product(P), X).length - 1;
    for (let k = 1; k <= n; k++) {
        const r = parts(power_1.power(X, bignum_1.integer(k)), multiply_1.multiply(multiply_1.divide(product(P), power_1.power(X, bignum_1.integer(k))), product(others)), X, depth);
        if (r !== undefined) {
            return r;
        }
    }
    return undefined;
}
function product(fs) {
    return fs.reduce(multiply_1.multiply, defs_1.Constants.one);
}
// u*v - integral(v*u')
function parts(u, dv, X, depth) {
    const v = tryIntegral(dv, X, depth);
    if (v === undefined) {
        return undefined;
    }
    const J = tryIntegral(eval_1.Eval(multiply_1.multiply(v, derivative_1.derivative(u, X))), X, depth);
    return J === undefined ? undefined : add_1.subtract(multiply_1.multiply(u, v), J);
}
