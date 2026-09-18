"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realTrigReciprocal = exports.heuristicIntegral = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const float_1 = require("./float");
const integral_1 = require("./integral");
const misc_1 = require("./misc");
const assume_1 = require("./assume");
const is_1 = require("./is");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const partition_1 = require("./partition");
const power_1 = require("./power");
const subst_1 = require("./subst");
// Integration methods tried when the table (and partial fractions) fail:
// closed forms for exp(a*x)*sin(b*x), abs(linear) and 1/(quadratic with
// real roots), then tan^2 rewriting, u-substitution and integration by
// parts. Each returns undefined when it does not apply. Sub-integrals go
// back through integral(), so the methods combine; depth bounds the recursion.
// ponytail: no Risch, no trig half-angle substitution; add a method here
// when a class of integrands keeps failing.
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
        specialIntegral(G, X) ||
        quarticReciprocal(G, X) ||
        hyperbolicToExp(G, X, depth) ||
        tanSquared(G, X, depth) ||
        bySubstitution(G, X, depth) ||
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
// Tried before the table, whose entry for these is a complex logarithm.
function realTrigReciprocal(F, X) {
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
    if (!slopeQ || !defs_1.isdouble(an) || !defs_1.isdouble(bn) || an.d * an.d <= bn.d * bn.d) {
        return undefined;
    }
    if (an.d < 0) {
        const flipped = realTrigReciprocal(power_1.power(multiply_1.negate(S), defs_1.Constants.negOne), X);
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
            h = evenPowersToU(h, list_1.makeList(symbol_1.symbol(defs_1.COS), X), u);
        }
        else if (find_1.Find(h, X) && isFn(g, defs_1.COS)) {
            h = evenPowersToU(h, list_1.makeList(symbol_1.symbol(defs_1.SIN), X), u);
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
// fn^(2k) becomes (1-u^2)^k
function evenPowersToU(p, fn, u) {
    if (!defs_1.iscons(p)) {
        return p;
    }
    if (defs_1.ispower(p) && misc_1.equal(defs_1.cadr(p), fn) && is_1.iseveninteger(defs_1.caddr(p))) {
        const k = multiply_1.divide(defs_1.caddr(p), bignum_1.integer(2));
        return power_1.power(add_1.subtract(defs_1.Constants.one, power_1.power(u, bignum_1.integer(2))), k);
    }
    return list_1.makeList(...p.map((el) => evenPowersToU(el, fn, u)));
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
