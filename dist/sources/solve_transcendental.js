"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tidySolutions = exports.solveEquation = exports.solveWithFamily = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const abs_1 = require("./abs");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const denominator_1 = require("./denominator");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const float_1 = require("./float");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const power_1 = require("./power");
const rationalize_1 = require("./rationalize");
const roots_1 = require("./roots");
const simplify_1 = require("./simplify");
const subst_1 = require("./subst");
const MAX_DEPTH = 6;
// the integer symbol of solve(eq, x, n): sin and cos solutions get
// + 2*pi*n, tan solutions + pi*n. Module state, set by solveWithFamily only.
let family;
function solveWithFamily(E, x, n) {
    family = n;
    try {
        return solveEquation(E, x);
    }
    finally {
        family = undefined;
    }
}
exports.solveWithFamily = solveWithFamily;
function periodic(angle, period) {
    return family === undefined ? angle : add_1.add(angle, multiply_1.multiply(period, family));
}
// All solutions of E = 0 in x that hold in E itself, unsorted, no duplicates
// removed. Throws when the equation has a shape it cannot handle.
function solveEquation(E, x, depth = 0) {
    if (!find_1.Find(E, x)) {
        if (is_1.isZeroAtomOrTensor(simplify_1.simplify(E))) {
            run_1.stop('solve: infinitely many solutions');
        }
        return [];
    }
    if (is_1.ispolyexpandedform(E, x)) {
        return roots_1.rootsList(E, x);
    }
    if (depth > MAX_DEPTH) {
        cannot(x);
    }
    const R = rationalize_1.rationalize(E);
    const candidates = is_1.isone(denominator_1.denominator(R))
        ? solveInKernel(E, x, depth)
        : solveEquation(numerator_1.numerator(R), x, depth + 1);
    return candidates.filter((c) => holds(E, x, c));
}
exports.solveEquation = solveEquation;
function cannot(x) {
    return run_1.stop('solve: cannot solve the equation for ' + x);
}
// The maximal subexpressions of p containing x that are not sums, products
// or integer powers, i.e. what has to be inverted to reach x.
function kernels(p, x, acc = []) {
    if (!find_1.Find(p, x) || misc_1.equal(p, x)) {
        return acc;
    }
    if (defs_1.isadd(p) || defs_1.ismultiply(p)) {
        p.tail().forEach((el) => kernels(el, x, acc));
    }
    else if (defs_1.ispower(p) && !find_1.Find(defs_1.caddr(p), x) && is_1.isinteger(defs_1.caddr(p))) {
        kernels(defs_1.cadr(p), x, acc);
    }
    else if (!acc.some((k) => misc_1.equal(k, p))) {
        acc.push(p);
    }
    return acc;
}
function kind(k, x) {
    if (defs_1.ispower(k)) {
        if (find_1.Find(defs_1.caddr(k), x)) {
            return find_1.Find(defs_1.cadr(k), x) ? 'other' : 'exp';
        }
        return defs_1.isrational(defs_1.caddr(k)) ? 'radical' : 'other';
    }
    const fns = {
        [defs_1.LOG]: 'log',
        [defs_1.SIN]: 'sin',
        [defs_1.COS]: 'cos',
        [defs_1.TAN]: 'tan',
        [defs_1.ARCSIN]: 'arcsin',
        [defs_1.ARCCOS]: 'arccos',
        [defs_1.ARCTAN]: 'arctan',
        [defs_1.ABS]: 'abs',
        lambertw: 'lambertw'
    };
    const f = defs_1.car(k);
    const name = defs_1.issymbol(f) ? f.printname : '';
    return fns[name] && !find_1.Find(defs_1.cadr(k), f) ? fns[name] : 'other';
}
function solveInKernel(E, x, depth) {
    const ks = kernels(E, x);
    const kinds = ks.map((k) => kind(k, x));
    const lambert = lambertForm(E, ks, kinds, x);
    if (lambert !== undefined) {
        return lambert;
    }
    if (kinds.includes('other')) {
        cannot(x);
    }
    const u = symbol_1.usr_symbol('solve_u');
    if (kinds.every((k) => k === 'exp')) {
        const [kernel, Eu] = commonExponential(E, ks, x, u);
        return viaKernel(Eu, u, kernel, x, depth);
    }
    if (ks.length === 1) {
        return viaKernel(subst_1.subst(E, ks[0], u), u, ks[0], x, depth);
    }
    if (kinds.every((k) => k === 'log')) {
        return solveEquation(combineLogs(E, ks, x), x, depth + 1);
    }
    if (ks.length === 2 && kinds.includes('sin') && kinds.includes('cos')) {
        const rewritten = pythagorean(E, ks, kinds, x) || asTangent(E, ks, kinds, x);
        if (rewritten !== undefined) {
            return solveEquation(rewritten, x, depth + 1);
        }
    }
    // several kernels: isolate a radical or abs, the rest stays on the other
    // side and is handled by the recursive call
    const i = kinds.findIndex((k) => k === 'radical' || k === 'abs');
    if (i < 0) {
        cannot(x);
    }
    return viaKernel(subst_1.subst(E, ks[i], u), u, ks[i], x, depth);
}
// Equations that need the Lambert W function, W(z)*exp(W(z)) = z:
//   alpha*x*b^(beta*x) + c = 0   x = W(r*B)/B, r = -c/alpha, B = beta*log(b)
//   alpha*x*log(x) + c = 0       x = exp(W(r))
//   a*x^x + c = 0                x = exp(W(log(-c/a)))
// undefined for any other shape.
function lambertForm(E, ks, kinds, x) {
    if (ks.length !== 1) {
        return undefined;
    }
    const k = ks[0];
    const u = symbol_1.usr_symbol('solve_u');
    const Eu = subst_1.subst(E, k, u);
    const a = derivative_1.derivative(Eu, u);
    const c = eval_1.Eval(add_1.subtract(Eu, multiply_1.multiply(a, u)));
    if (find_1.Find(a, u) || find_1.Find(c, u) || find_1.Find(c, x) || is_1.isZeroAtomOrTensor(a)) {
        return undefined;
    }
    const W = (v) => call('lambertw', v);
    if (defs_1.ispower(k) && misc_1.equal(defs_1.cadr(k), x) && misc_1.equal(defs_1.caddr(k), x)) {
        return find_1.Find(a, x)
            ? undefined
            : [misc_1.exponential(W(call(defs_1.LOG, multiply_1.divide(multiply_1.negate(c), a))))];
    }
    const alpha = multiply_1.divide(a, x);
    if (find_1.Find(alpha, x)) {
        return undefined;
    }
    const r = multiply_1.divide(multiply_1.negate(c), alpha);
    if (kinds[0] === 'log' && misc_1.equal(defs_1.cadr(k), x)) {
        return [misc_1.exponential(W(r))];
    }
    if (kinds[0] === 'exp') {
        const beta = multiply_1.divide(defs_1.caddr(k), x);
        if (find_1.Find(beta, x)) {
            return undefined;
        }
        // (E is the equation in here, YYE the number e)
        const B = defs_1.cadr(k) === symbol_1.symbol(defs_1.YYE) ? beta : multiply_1.multiply(beta, call(defs_1.LOG, defs_1.cadr(k)));
        return [multiply_1.divide(W(multiply_1.multiply(r, B)), B)];
    }
    return undefined;
}
// Solves Eu (E with the kernel written as u) for u and inverts the kernel
// for every value found.
function viaKernel(Eu, u, kernel, x, depth) {
    const P = numerator_1.numerator(rationalize_1.rationalize(Eu));
    if (!is_1.ispolyexpandedform(P, u)) {
        cannot(x);
    }
    const what = kind(kernel, x);
    const result = [];
    for (const c of roots_1.rootsList(P, u)) {
        if (find_1.Find(c, x) && what !== 'radical' && what !== 'abs') {
            cannot(x);
        }
        result.push(...invert(kernel, what, c, x, depth));
    }
    return result;
}
// Solutions of kernel(x) = c: the inverse function applied to c gives one or
// two equations for the argument, which are solved recursively.
function invert(kernel, what, c, x, depth) {
    const g = defs_1.cadr(kernel);
    let eqs;
    switch (what) {
        case 'exp':
            if (is_1.isZeroAtomOrTensor(c)) {
                return [];
            }
            eqs = [add_1.subtract(defs_1.caddr(kernel), logBase(g, c))];
            break;
        case 'log':
            eqs = [add_1.subtract(g, misc_1.exponential(c))];
            break;
        case 'sin': {
            if (outsideUnitInterval(c)) {
                return [];
            }
            const a = call(defs_1.ARCSIN, c);
            eqs = distinctAngles(g, [a, add_1.subtract(defs_1.Constants.Pi(), a)]);
            break;
        }
        case 'cos': {
            if (outsideUnitInterval(c)) {
                return [];
            }
            const a = call(defs_1.ARCCOS, c);
            eqs = distinctAngles(g, [a, multiply_1.negate(a)]);
            break;
        }
        case 'tan':
            eqs = [add_1.subtract(g, periodic(call(defs_1.ARCTAN, c), defs_1.Constants.Pi()))];
            break;
        case 'arcsin':
            eqs = [add_1.subtract(g, call(defs_1.SIN, c))];
            break;
        case 'arccos':
            eqs = [add_1.subtract(g, call(defs_1.COS, c))];
            break;
        case 'arctan':
            eqs = [add_1.subtract(g, call(defs_1.TAN, c))];
            break;
        case 'lambertw':
            // W(g) = c  <=>  g = c*exp(c)
            eqs = [add_1.subtract(g, multiply_1.multiply(c, misc_1.exponential(c)))];
            break;
        case 'abs':
            if (is_1.isnegativenumber(c)) {
                return [];
            }
            eqs = [add_1.add(g, c), add_1.subtract(g, c)];
            break;
        case 'radical': {
            const e = defs_1.caddr(kernel);
            const p = bignum_1.integer(e.a.toJSNumber());
            const q = bignum_1.integer(e.b.toJSNumber());
            if (e.b.isEven() && is_1.isnegativenumber(c)) {
                return [];
            }
            eqs = [add_1.subtract(power_1.power(g, p), power_1.power(c, q))];
            break;
        }
        default:
            cannot(x);
    }
    return eqs.reduce((acc, eq) => acc.concat(solveEquation(misc_1.yyexpand(eq), x, depth + 1)), []);
}
function call(fn, ...args) {
    // usr_symbol finds keywords too and creates soft names like lambertw
    return eval_1.Eval(list_1.makeList(symbol_1.usr_symbol(fn), ...args));
}
function outsideUnitInterval(c) {
    const f = float_1.zzfloat(c);
    return defs_1.isdouble(f) && Math.abs(f.d) > 1;
}
// g = a for each angle a, dropping angles that differ by a multiple of 2*pi
function distinctAngles(g, angles) {
    const kept = [];
    for (const a of angles) {
        const same = kept.some((b) => {
            const turns = float_1.zzfloat(multiply_1.divide(add_1.subtract(a, b), multiply_1.multiply(bignum_1.integer(2), defs_1.Constants.Pi())));
            return defs_1.isdouble(turns) && Math.abs(turns.d - Math.round(turns.d)) < 1e-9;
        });
        if (!same) {
            kept.push(a);
        }
    }
    const twoPi = multiply_1.multiply(bignum_1.integer(2), defs_1.Constants.Pi());
    return kept.map((a) => add_1.subtract(g, periodic(a, twoPi)));
}
// log(c)/log(b), as an integer k when b^k = c exactly
function logBase(b, c) {
    if (b === symbol_1.symbol(defs_1.E)) {
        return call(defs_1.LOG, c);
    }
    if (defs_1.isrational(b) && defs_1.isrational(c) && !is_1.isnegativenumber(b) && !is_1.isnegativenumber(c)) {
        const k = Math.round(Math.log(toNumber(c)) / Math.log(toNumber(b)));
        if (misc_1.equal(power_1.power(b, bignum_1.integer(k)), c)) {
            return bignum_1.integer(k);
        }
    }
    return multiply_1.divide(call(defs_1.LOG, c), call(defs_1.LOG, b));
}
function toNumber(p) {
    const f = float_1.zzfloat(p);
    return defs_1.isdouble(f) ? f.d : NaN;
}
// All kernels are b_i^(g_i): finds a base b and exponent h with every kernel
// equal to (b^h)^k_i for integers k_i, and returns [b^h, E in u = b^h].
function commonExponential(E, ks, x, u) {
    const bases = ks.map((k) => defs_1.cadr(k));
    let exponents = ks.map((k) => defs_1.caddr(k));
    let base = bases[0];
    if (!bases.every((b) => misc_1.equal(b, base))) {
        // numeric bases that are integer powers of the smallest one
        if (!bases.every((b) => defs_1.isrational(b) && !is_1.isnegativenumber(b))) {
            cannot(x);
        }
        base = bases.reduce((m, b) => (toNumber(b) < toNumber(m) ? b : m));
        exponents = bases.map((b, i) => {
            const k = Math.round(Math.log(toNumber(b)) / Math.log(toNumber(base)));
            if (!misc_1.equal(power_1.power(base, bignum_1.integer(k)), b)) {
                cannot(x);
            }
            return multiply_1.multiply(bignum_1.integer(k), exponents[i]);
        });
    }
    // every exponent is a rational multiple of the first
    // (dividing 1+x by itself would expand to 1/(1+x)+x/(1+x))
    const ratios = exponents.map((g) => misc_1.equal(g, exponents[0]) ? defs_1.Constants.one : simplify_1.simplify(multiply_1.divide(g, exponents[0])));
    if (!ratios.every(defs_1.isrational)) {
        cannot(x);
    }
    const L = ratios.reduce((l, r) => lcm(l, r.b.toJSNumber()), 1);
    const h = multiply_1.divide(exponents[0], bignum_1.integer(L));
    let Eu = E;
    ks.forEach((k, i) => {
        const r = ratios[i];
        const ki = (r.a.toJSNumber() * L) / r.b.toJSNumber();
        Eu = subst_1.subst(Eu, k, power_1.power(u, bignum_1.integer(ki)));
    });
    return [power_1.power(base, h), Eu];
}
function lcm(a, b) {
    const gcd = (p, q) => (q === 0 ? p : gcd(q, p % q));
    return (a * b) / gcd(a, b);
}
// E = sum of n_i*log(g_i) + d with integer n_i and d free of x becomes
// prod g_i^n_i = exp(-d), written as a difference with positive powers only.
function combineLogs(E, ks, x) {
    const us = ks.map((_, i) => symbol_1.usr_symbol('solve_u' + i));
    let Eu = ks.reduce((acc, k, i) => subst_1.subst(acc, k, us[i]), E);
    let lhs = defs_1.Constants.one;
    let rhs = defs_1.Constants.one;
    ks.forEach((k, i) => {
        const n = derivative_1.derivative(Eu, us[i]);
        if (!is_1.isinteger(n) || us.some((v) => find_1.Find(n, v))) {
            cannot(x);
        }
        Eu = add_1.subtract(Eu, multiply_1.multiply(n, us[i]));
        if (is_1.isnegativenumber(n)) {
            rhs = multiply_1.multiply(rhs, power_1.power(defs_1.cadr(k), multiply_1.negate(n)));
        }
        else {
            lhs = multiply_1.multiply(lhs, power_1.power(defs_1.cadr(k), n));
        }
    });
    if (find_1.Find(Eu, x) || us.some((v) => find_1.Find(Eu, v))) {
        cannot(x);
    }
    return misc_1.yyexpand(add_1.subtract(lhs, multiply_1.multiply(rhs, misc_1.exponential(multiply_1.negate(Eu)))));
}
// sin(g)^2 = 1-cos(g)^2 (or the other way round) when that leaves a single
// kernel, i.e. the replaced function only appears in even powers.
function pythagorean(E, ks, kinds, x) {
    const s = ks[kinds.indexOf('sin')];
    const c = ks[kinds.indexOf('cos')];
    if (!misc_1.equal(defs_1.cadr(s), defs_1.cadr(c))) {
        return undefined;
    }
    for (const [from, to] of [
        [s, c],
        [c, s]
    ]) {
        const sq = power_1.power(add_1.subtract(defs_1.Constants.one, power_1.power(to, bignum_1.integer(2))), bignum_1.rational(1, 2));
        const rewritten = misc_1.yyexpand(subst_1.subst(E, from, sq));
        if (kernels(rewritten, x).every((k) => misc_1.equal(k, to))) {
            return rewritten;
        }
    }
    return undefined;
}
// a*sin(g) + b*cos(g) = 0 with a, b free of x is tan(g) = -b/a
function asTangent(E, ks, kinds, x) {
    const s = ks[kinds.indexOf('sin')];
    const c = ks[kinds.indexOf('cos')];
    if (!misc_1.equal(defs_1.cadr(s), defs_1.cadr(c))) {
        return undefined;
    }
    const [us, uc] = [symbol_1.usr_symbol('solve_u0'), symbol_1.usr_symbol('solve_u1')];
    const Eu = subst_1.subst(subst_1.subst(E, s, us), c, uc);
    const a = derivative_1.derivative(Eu, us);
    const b = derivative_1.derivative(Eu, uc);
    const rest = eval_1.Eval(add_1.subtract(Eu, add_1.add(multiply_1.multiply(a, us), multiply_1.multiply(b, uc))));
    if (!is_1.isZeroAtomOrTensor(rest) ||
        [a, b].some((p) => find_1.Find(p, x) || find_1.Find(p, us) || find_1.Find(p, uc)) ||
        is_1.isZeroAtomOrTensor(a)) {
        return undefined;
    }
    return add_1.add(call(defs_1.TAN, defs_1.cadr(s)), multiply_1.divide(b, a));
}
// Whether E vanishes at x = c: exactly, after simplifying, or numerically.
// A value that still holds other symbols cannot be decided and is kept.
function holds(E, x, c) {
    try {
        let v = eval_1.Eval(subst_1.subst(E, x, c));
        if (is_1.isZeroAtomOrTensor(v)) {
            return true;
        }
        v = simplify_1.simplify(v);
        if (is_1.isZeroAtomOrTensor(v)) {
            return true;
        }
        const m = float_1.zzfloat(abs_1.absval(v));
        return !defs_1.isdouble(m) || Math.abs(m.d) < 1e-9;
    }
    catch (e) {
        return false;
    }
}
// Removes duplicates and, when every solution is a real number, sorts them.
function tidySolutions(sols) {
    const uniq = sols.filter((s, i) => sols.findIndex((t) => misc_1.equal(s, t)) === i);
    const values = uniq.map(toNumber);
    if (values.every((v) => !Number.isNaN(v))) {
        uniq.sort((a, b) => toNumber(a) - toNumber(b));
    }
    return uniq;
}
exports.tidySolutions = tidySolutions;
