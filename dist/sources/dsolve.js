"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dsolve = exports.Eval_dsolve = void 0;
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const at_1 = require("./at");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const imag_1 = require("./imag");
const integral_1 = require("./integral");
const assume_1 = require("./assume");
const is_1 = require("./is");
const laplace_1 = require("./laplace");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const power_1 = require("./power");
const real_1 = require("./real");
const roots_1 = require("./roots");
const scan_1 = require("./scan");
const simplify_1 = require("./simplify");
const solve_1 = require("./solve");
const subst_1 = require("./subst");
function Eval_dsolve(p1) {
    misc_1.checkArgCount(p1, 2, 3);
    const ode = roots_1.equationToExpr(defs_1.cadr(p1));
    const Y = eval_1.Eval(defs_1.caddr(p1));
    if (!defs_1.iscons(Y) || !defs_1.issymbol(defs_1.cadr(Y)) || defs_1.cddr(Y) !== symbol_1.symbol(defs_1.NIL)) {
        run_1.stop('dsolve: 2nd argument must be a function call like y(x)');
    }
    const ics = defs_1.cadddr(p1);
    const conds = ics === symbol_1.symbol(defs_1.NIL) ? [] : conditions(ics, Y);
    const sols = dsolve(ode, Y, conds);
    if (sols.length === 0) {
        run_1.stop('dsolve: no solution satisfies the initial conditions');
    }
    return sols.length === 1 ? sols[0] : scan_1.build_tensor(sols);
}
exports.Eval_dsolve = Eval_dsolve;
// [y(0)=1, y'(0)=0], read without Eval: y(0)=1 would define y
function conditions(ics, Y) {
    const elems = defs_1.istensor(ics) ? ics.tensor.elem : [ics];
    return elems.map((e) => {
        if (defs_1.car(e) !== symbol_1.symbol(defs_1.SETQ) && defs_1.car(e) !== symbol_1.symbol(defs_1.TESTEQ)) {
            run_1.stop('dsolve: initial conditions must look like y(0)=1');
        }
        const lhs = eval_1.Eval(defs_1.cadr(e));
        const value = eval_1.Eval(defs_1.caddr(e));
        if (defs_1.car(lhs) === defs_1.car(Y) && defs_1.cddr(lhs) === symbol_1.symbol(defs_1.NIL)) {
            return { order: 0, at: defs_1.cadr(lhs), value };
        }
        const order = defs_1.car(lhs) === symbol_1.symbol(defs_1.AT) ? at_1.primeOrder(defs_1.cadr(lhs), defs_1.caddr(lhs)) : 0;
        if (order === 0) {
            run_1.stop('dsolve: initial conditions must look like y(0)=1 or y\'(0)=1');
        }
        return { order, at: defs_1.cadddr(lhs), value };
    });
}
const constant = (i) => symbol_1.usr_symbol('C' + i);
const terms = (p) => (defs_1.isadd(p) ? p.tail() : [p]);
const factors = (p) => (defs_1.ismultiply(p) ? p.tail() : [p]);
const isZero = (p) => is_1.isZeroAtomOrTensor(simplify_1.simplify(p));
const freeOf = (p, ...xs) => xs.every((x) => !find_1.Find(p, x));
function dsolve(ode, Y, conds) {
    var _a, _b;
    const x = defs_1.cadr(Y);
    const n = order(ode, Y, x);
    if (n === 0) {
        run_1.stop('dsolve: 1st argument has no derivative of ' + Y);
    }
    // placeholders the parser can't produce: $y for y(x), $dk for its
    // k-th derivative, highest first so y(x) inside them is still intact
    const y = symbol_1.usr_symbol('$y');
    const ds = Array.from({ length: n }, (_, k) => symbol_1.usr_symbol('$d' + (k + 1)));
    let E = ode;
    for (let k = n; k >= 1; k--) {
        let dk = Y;
        for (let i = 0; i < k; i++) {
            dk = new defs_1.Cons(symbol_1.symbol(defs_1.DERIVATIVE), new defs_1.Cons(dk, new defs_1.Cons(x, symbol_1.symbol(defs_1.NIL))));
        }
        E = subst_1.subst(E, dk, ds[k - 1]);
    }
    E = eval_1.Eval(subst_1.subst(E, Y, y));
    if (find_1.Find(E, defs_1.car(Y))) {
        run_1.stop('dsolve: ' + defs_1.car(Y) + ' must only appear as ' + Y + ' and its derivatives');
    }
    if (n === 1) {
        const lin = laplace_1.linear(E, ds[0]);
        if (lin !== null && !isZero(lin[0])) {
            const f = multiply_1.divide(multiply_1.negate(lin[1]), lin[0]); // y' = f(x, y)
            const sol = (_b = (_a = firstOrderLinear(f, y, x, conds)) !== null && _a !== void 0 ? _a : separable(f, y, x, conds, Y)) !== null && _b !== void 0 ? _b : bernoulli(f, y, x, conds);
            if (sol !== null) {
                return sol;
            }
        }
    }
    const sol = constantCoefficients(E, [y, ...ds], x, conds);
    if (sol !== null) {
        return sol;
    }
    run_1.stop('dsolve: only separable, first-order linear, Bernoulli or linear ' +
        'equations with constant coefficients are supported');
}
exports.dsolve = dsolve;
// highest k of d(...d(y(x),x)...,x) in p
function order(p, Y, x) {
    if (defs_1.car(p) === symbol_1.symbol(defs_1.DERIVATIVE)) {
        const k = at_1.primeOrder(p, x);
        let inner = p;
        for (let i = 0; i < k; i++) {
            inner = defs_1.cadr(inner);
        }
        if (k > 0 && defs_1.car(inner) === defs_1.car(Y)) {
            return k;
        }
    }
    return defs_1.iscons(p) ? Math.max(0, ...p.tail().map((q) => order(q, Y, x)), order(defs_1.car(p), Y, x)) : 0;
}
// ---------------------------------------------------------------- order 1
// y' = a(x) y + b(x): y = (integral(mu b) + C1)/mu with mu = exp(-integral(a))
function firstOrderLinear(f, y, x, conds) {
    const lin = laplace_1.linear(f, y);
    if (lin === null) {
        return null;
    }
    const [a, b] = lin;
    const mu = expOf(integral_1.integral(multiply_1.negate(a), x), x);
    const sol = multiply_1.divide(add_1.add(integral_1.integral(multiply_1.multiply(mu, b), x), constant(1)), mu);
    return [fit(sol, x, 1, conds)];
}
// y' = g(x) h(y): integral(1/h, y) = integral(g, x) + C, solved for y
function separable(f, y, x, conds, Y) {
    let g = null;
    let h = null;
    for (const x0 of [1, 2, 3]) {
        h = eval_1.Eval(subst_1.subst(f, x, bignum_1.integer(x0)));
        if (!isZero(h)) {
            g = simplify_1.simplify(multiply_1.divide(f, h));
            break;
        }
    }
    if (g === null || find_1.Find(g, y)) {
        return null;
    }
    const G = integral_1.integral(multiply_1.divide(defs_1.Constants.one, h), y);
    const F = integral_1.integral(g, x);
    // G = F + C as H(x, y) = C. With logs, k (log|u| + c log|v| + ...) =
    // F + C is u v^c ... exp(-F/k) = C, the signs and exp(C/k) go into the
    // constant; k arctan(u) = F + C is u = tan((F + C)/k).
    const t0 = terms(G).find((t) => factors(t).some(isLog));
    const k = t0 && multiply_1.divide(t0, factors(t0).find(isLog));
    const atan = factors(G).find((p) => defs_1.car(p) === symbol_1.symbol(defs_1.ARCTAN));
    const ka = atan && multiply_1.divide(G, atan);
    let H = add_1.subtract(G, F);
    if (t0 && freeOf(k, x, y)) {
        H = multiply_1.multiply(expOf(multiply_1.divide(G, k), x, y), misc_1.exponential(multiply_1.negate(multiply_1.divide(F, k))));
    }
    let C = conds.length === 0 ? constant(1) : initialConstant(H, y, x, conds);
    if (!t0 && atan && freeOf(ka, x, y)) {
        H = add_1.subtract(defs_1.cadr(atan), eval_1.Eval(makeCall(defs_1.TAN, multiply_1.divide(add_1.add(F, C), ka))));
        C = defs_1.Constants.zero;
    }
    const lin = laplace_1.linear(H, y);
    let sols;
    if (lin !== null && !isZero(lin[0])) {
        sols = [multiply_1.divide(add_1.subtract(C, lin[1]), lin[0])];
    }
    else {
        const p = numerator_1.numerator(add_1.subtract(H, C));
        if (!is_1.ispolyexpandedform(p, y)) {
            run_1.stop('dsolve: can only give the implicit solution ' + eval_1.Eval(subst_1.subst(H, y, Y)) + ' = ' + C);
        }
        sols = polyRoots(p, y);
    }
    return keepSatisfying(sols.map(simplify_1.simplify), x, conds);
}
// y' = a(x) y + b(x) y^k: v = y^(1-k) solves v' = (1-k)(a v + b)
function bernoulli(f, y, x, conds) {
    let k = null;
    let a = defs_1.Constants.zero;
    let b = defs_1.Constants.zero;
    for (const t of terms(f)) {
        const e = eval_1.Eval(multiply_1.divide(multiply_1.multiply(y, derivative_1.derivative(t, y)), t));
        if (!freeOf(e, x, y) || isZero(e)) {
            return null;
        }
        if (isZero(add_1.subtract(e, defs_1.Constants.one))) {
            a = add_1.add(a, multiply_1.divide(t, y));
        }
        else if (k === null || isZero(add_1.subtract(e, k))) {
            k = e;
            b = add_1.add(b, multiply_1.divide(t, power_1.power(y, k)));
        }
        else {
            return null;
        }
    }
    if (k === null) {
        return null;
    }
    const m = add_1.subtract(defs_1.Constants.one, k); // v = y^m
    const vconds = conds.map((c) => {
        if (c.order > 0) {
            run_1.stop('dsolve: initial conditions of a Bernoulli equation must look like y(0)=1');
        }
        return Object.assign(Object.assign({}, c), { value: power_1.power(c.value, m) });
    });
    const [v] = firstOrderLinear(add_1.add(multiply_1.multiply(multiply_1.multiply(m, a), y), multiply_1.multiply(m, b)), y, x, vconds);
    const root = power_1.power(v, multiply_1.divide(defs_1.Constants.one, m));
    const sols = is_1.iseveninteger(m) ? [multiply_1.negate(root), root] : [root];
    return keepSatisfying(sols, x, conds);
}
// ------------------------------------------------- constant coefficients
// sum a_k y^(k) = q(x): exp(r x) for the roots r of sum a_k r^k, times
// x^j for a root of multiplicity > j, plus a particular solution from
// invlaplace(laplace(q)/P(s))
function constantCoefficients(E, vars, x, conds) {
    const a = [];
    let rest = E;
    for (const v of vars) {
        const lin = laplace_1.linear(rest, v);
        if (lin === null || !freeOf(lin[0], x, ...vars)) {
            return null;
        }
        a.push(lin[0]);
        rest = lin[1];
    }
    const q = multiply_1.negate(rest);
    if (!freeOf(q, ...vars)) {
        return null;
    }
    const r = symbol_1.usr_symbol('$r');
    const P = a.reduce((acc, ak, k) => add_1.add(acc, multiply_1.multiply(ak, power_1.power(r, bignum_1.integer(k)))), defs_1.Constants.zero);
    const rs = roots_1.roots(P, r);
    const basis = [];
    for (const root of defs_1.istensor(rs) ? rs.tensor.elem : [rs]) {
        const m = multiplicity(P, r, root);
        const im = imag_1.imag(root);
        let fs;
        if (assume_1.isNegative(im) && assume_1.isReal(real_1.real(root))) {
            continue; // its conjugate gives the real pair
        }
        if (assume_1.isPositive(im) && assume_1.isReal(real_1.real(root))) {
            const e = misc_1.exponential(multiply_1.multiply(real_1.real(root), x));
            const wx = multiply_1.multiply(im, x);
            fs = [multiply_1.multiply(e, eval_1.Eval(makeCall(defs_1.COS, wx))), multiply_1.multiply(e, eval_1.Eval(makeCall(defs_1.SIN, wx)))];
        }
        else {
            fs = [misc_1.exponential(multiply_1.multiply(root, x))];
        }
        for (let j = 0; j < m; j++) {
            for (const f of fs) {
                basis.push(multiply_1.multiply(power_1.power(x, bignum_1.integer(j)), f));
            }
        }
    }
    if (basis.length !== vars.length - 1) {
        run_1.stop('dsolve: could not find all roots of ' + P);
    }
    let sol = basis.reduce((acc, f, i) => add_1.add(acc, multiply_1.multiply(constant(i + 1), f)), defs_1.Constants.zero);
    if (!isZero(q)) {
        const s = symbol_1.usr_symbol('$s');
        const yp = laplace_1.invlaplace(multiply_1.divide(laplace_1.laplace(q, x, s), eval_1.Eval(subst_1.subst(P, r, s))), s, x);
        if (find_1.Find(yp, symbol_1.symbol(defs_1.LAPLACE)) || find_1.Find(yp, symbol_1.symbol(defs_1.INVLAPLACE))) {
            run_1.stop('dsolve: no particular solution for the right side ' + q);
        }
        // terms of yp that solve the homogeneous equation go into the constants
        const particular = terms(yp).filter((t) => !basis.some((b) => freeOf(multiply_1.divide(t, b), x)));
        sol = particular.reduce(add_1.add, sol);
    }
    return [fit(sol, x, basis.length, conds)];
}
// number of successive derivatives of P, P itself first, that vanish at root
function multiplicity(P, r, root) {
    let m = 0;
    for (let p = P; isZero(eval_1.Eval(subst_1.subst(p, r, root))); p = derivative_1.derivative(p, r)) {
        m++;
    }
    return Math.max(m, 1);
}
// ------------------------------------------------------------- helpers
const isLog = (p) => defs_1.car(p) === symbol_1.symbol(defs_1.LOG);
// real roots for c y^n + d, roots() writes y^2 = x^2 + C as
// y = i (-x^2 - C)^(1/2)
function polyRoots(p, y) {
    const cs = coeff_1.coeff(p, y);
    const n = cs.length - 1;
    if (n > 1 && cs.slice(1, n).every(isZero)) {
        const root = power_1.power(multiply_1.negate(multiply_1.divide(cs[0], cs[n])), bignum_1.rational(1, n));
        return n % 2 === 0 ? [multiply_1.negate(root), root] : [root];
    }
    const r = roots_1.roots(p, y);
    return defs_1.istensor(r) ? r.tensor.elem : [r];
}
// exp(I), with each term k log(u), k free of vars, as u^k
// ponytail: abs(u) in the log is dropped, the sign is constant where the
// solution lives and the constant C absorbs it
function expOf(I, ...vars) {
    return terms(I).reduce((acc, t) => {
        const log = factors(t).find(isLog);
        const k = log && multiply_1.divide(t, log);
        return multiply_1.multiply(acc, log && freeOf(k, ...vars) ? power_1.power(stripAbs(defs_1.cadr(log)), k) : misc_1.exponential(t));
    }, defs_1.Constants.one);
}
const makeCall = (name, arg) => new defs_1.Cons(symbol_1.symbol(name), new defs_1.Cons(arg, symbol_1.symbol(defs_1.NIL)));
function stripAbs(p) {
    const strip = (q) => defs_1.car(q) === symbol_1.symbol(defs_1.ABS) ? strip(defs_1.cadr(q)) : defs_1.iscons(q) ? new defs_1.Cons(strip(defs_1.car(q)), strip(defs_1.cdr(q))) : q;
    return eval_1.Eval(strip(p));
}
// the n constants of sol fitted to the conditions, a linear system in them
function fit(sol, x, n, conds) {
    if (conds.length === 0) {
        return sol;
    }
    const Cs = Array.from({ length: n }, (_, i) => constant(i + 1));
    const eqs = conds.map((c) => add_1.subtract(atOrder(sol, x, c), c.value));
    const values = solve_1.solveLinearSystem(scan_1.build_tensor(eqs), scan_1.build_tensor(Cs));
    const vs = defs_1.istensor(values) ? values.tensor.elem : [values];
    return simplify_1.simplify(Cs.reduce((acc, C, i) => eval_1.Eval(subst_1.subst(acc, C, vs[i])), sol));
}
// C1 = H(x0, y0) for the relation H(x, y) = C1 of a separable equation
function initialConstant(H, y, x, conds) {
    if (conds.length !== 1 || conds[0].order !== 0) {
        run_1.stop('dsolve: a first-order equation takes one initial condition y(x0)=y0');
    }
    return eval_1.Eval(subst_1.subst(subst_1.subst(H, y, conds[0].value), x, conds[0].at));
}
// the branches that meet the conditions
function keepSatisfying(sols, x, conds) {
    return sols.filter((sol) => conds.every((c) => isZero(add_1.subtract(atOrder(sol, x, c), c.value))));
}
function atOrder(sol, x, c) {
    let d = sol;
    for (let i = 0; i < c.order; i++) {
        d = derivative_1.derivative(d, x);
    }
    return at_1.at(d, x, c.at);
}
