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
const solve_transcendental_1 = require("./solve_transcendental");
const subst_1 = require("./subst");
function Eval_dsolve(p1) {
    const used = [];
    symbol_1.collectUserSymbols(p1, used);
    takenConstants = used.map((v) => /^C(\d+)$/.exec(v.toString())).map((m) => (m ? +m[1] : 0));
    const Y = eval_1.Eval(defs_1.caddr(p1));
    const Ys = defs_1.istensor(Y) ? Y.tensor.elem : [Y];
    if (!Ys.every((F) => defs_1.iscons(F) && defs_1.issymbol(defs_1.cadr(F)) && defs_1.cddr(F) === symbol_1.symbol(defs_1.NIL))) {
        run_1.stop('dsolve: 2nd argument must be a function call like y(x)');
    }
    const conds = [];
    for (let p = defs_1.cdddr(p1); defs_1.iscons(p); p = defs_1.cdr(p)) {
        const ics = defs_1.car(p);
        conds.push(...(defs_1.istensor(ics) ? ics.tensor.elem : [ics]).map((e) => condition(e, Ys)));
    }
    // the equations unevaluated: Eval would take x' = y as a definition
    const eqs = defs_1.cadr(p1);
    const sols = defs_1.istensor(Y)
        ? system((defs_1.istensor(eqs) ? eqs.tensor.elem : [eqs]).map(roots_1.equationToExpr), Ys, conds)
        : dsolve(roots_1.equationToExpr(eqs), Y, conds);
    if (sols.length === 0) {
        run_1.stop('dsolve: no solution satisfies the conditions');
    }
    return sols.length === 1 ? sols[0] : scan_1.build_tensor(sols);
}
exports.Eval_dsolve = Eval_dsolve;
// y(0)=1, y'(0)=0 or d(y(x),x)(0)=0, read without Eval: y(0)=1 would define y
function condition(e, Ys) {
    const Y = Ys[0];
    const isEquation = defs_1.car(e) === symbol_1.symbol(defs_1.SETQ) || defs_1.car(e) === symbol_1.symbol(defs_1.TESTEQ);
    // the parser reads d(y(x),x)(0) as the call eval(d(y(x),x))(0)
    const callee = defs_1.car(defs_1.cadr(e));
    let lhs = defs_1.car(callee) === symbol_1.symbol(defs_1.EVAL) && defs_1.cddr(defs_1.cadr(e)) === symbol_1.symbol(defs_1.NIL)
        ? at_1.at(eval_1.Eval(defs_1.cadr(callee)), defs_1.cadr(Y), eval_1.Eval(defs_1.cadr(defs_1.cadr(e))))
        : eval_1.Eval(defs_1.cadr(e));
    let x0 = defs_1.cadr(lhs);
    let order = 0;
    if (defs_1.car(lhs) === symbol_1.symbol(defs_1.AT)) {
        order = at_1.primeOrder(defs_1.cadr(lhs), defs_1.caddr(lhs));
        x0 = defs_1.cadddr(lhs);
        lhs = defs_1.cadr(lhs);
    }
    else if (defs_1.car(lhs) === symbol_1.symbol(defs_1.DERIVATIVE)) {
        order = at_1.primeOrder(lhs, defs_1.caddr(lhs)); // y'(a) is d(y(a),a)
        x0 = defs_1.caddr(lhs);
    }
    for (let i = 0; i < order; i++) {
        lhs = defs_1.cadr(lhs);
    }
    const index = Ys.findIndex((F) => defs_1.car(F) === defs_1.car(lhs));
    if (!isEquation || index < 0 || defs_1.cddr(lhs) !== symbol_1.symbol(defs_1.NIL)) {
        run_1.stop("dsolve: conditions must look like y(0)=1, y'(0)=1 or d(y(x),x,2)(0)=1");
    }
    return { index, order, at: x0, value: eval_1.Eval(defs_1.caddr(e)) };
}
// the i-th of the names C1, C2, ... that the input does not use itself
let takenConstants = [];
const constant = (i) => {
    let k = 0;
    for (let free = 0; free < i;) {
        free += takenConstants.includes(++k) ? 0 : 1;
    }
    return symbol_1.usr_symbol('C' + k);
};
const terms = (p) => (defs_1.isadd(p) ? p.tail() : [p]);
const factors = (p) => (defs_1.ismultiply(p) ? p.tail() : [p]);
const isZero = (p) => is_1.isZeroAtomOrTensor(simplify_1.simplify(p));
const freeOf = (p, ...xs) => xs.every((x) => !find_1.Find(p, x));
function dsolve(ode, Y, conds) {
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
    let dY = Y;
    const dYs = ds.map(() => (dY = new defs_1.Cons(symbol_1.symbol(defs_1.DERIVATIVE), new defs_1.Cons(dY, new defs_1.Cons(x, symbol_1.symbol(defs_1.NIL))))));
    for (let k = n; k >= 1; k--) {
        E = subst_1.subst(E, dYs[k - 1], ds[k - 1]);
    }
    E = eval_1.Eval(subst_1.subst(E, Y, y));
    if (find_1.Find(E, defs_1.car(Y))) {
        run_1.stop('dsolve: ' + defs_1.car(Y) + ' must only appear as ' + Y + ' and its derivatives');
    }
    const sols = solveOrder(E, [y, ...ds], x, conds, [Y, ...dYs]);
    if (sols === null) {
        run_1.stop('dsolve: unsupported equation. Supported: first order separable, linear, ' +
            "Bernoulli, homogeneous y'=F(y/x), exact; linear with constant " +
            "coefficients; Euler-Cauchy; y''=f(x,y')");
    }
    return sols;
}
exports.dsolve = dsolve;
// E = 0 in vars = [y, y', ..., y^(n)]; Ys are their names for messages
function solveOrder(E, vars, x, conds, Ys) {
    var _a;
    const n = vars.length - 1;
    if (n === 1) {
        const sols = firstOrder(E, vars[0], vars[1], x, conds, Ys[0]);
        if (sols !== null) {
            return sols;
        }
    }
    const lin = linearCoefficients(E, vars);
    const sol = lin && ((_a = constantCoefficients(lin.a, lin.q, x)) !== null && _a !== void 0 ? _a : eulerCauchy(lin.a, lin.q, x));
    if (sol) {
        return fitAll([sol], x, n, conds);
    }
    // without y: one order lower in p = y', then y = integral(p) + Cn
    if (n > 1 && !find_1.Find(E, vars[0])) {
        const Ep = vars.slice(1).reduce((acc, v, k) => subst_1.subst(acc, v, vars[k]), E);
        const ps = solveOrder(Ep, vars.slice(0, n), x, [], Ys.slice(1));
        if (ps !== null) {
            const sols = ps.map((p) => {
                const I = tryIntegral(p, x);
                if (I === null) {
                    run_1.stop('dsolve: no integral of ' + Ys[1] + ' = ' + p);
                }
                return add_1.add(I, constant(n));
            });
            return fitAll(sols, x, n, conds);
        }
    }
    return null;
}
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
function firstOrder(E, y, d1, x, conds, Y) {
    var _a, _b, _c, _d, _e;
    const lin = laplace_1.linear(E, d1);
    if (lin === null || isZero(lin[0])) {
        return null;
    }
    const f = multiply_1.divide(multiply_1.negate(lin[1]), lin[0]); // y' = f(x, y)
    const tryExact = (l) => l && exact(l[1], l[0], y, x, conds, Y);
    return ((_e = (_d = (_c = (_b = (_a = firstOrderLinear(f, y, x, conds)) !== null && _a !== void 0 ? _a : separable(f, y, x, conds, Y)) !== null && _b !== void 0 ? _b : bernoulli(f, y, x, conds)) !== null && _c !== void 0 ? _c : homogeneous(f, y, x, conds, Y)) !== null && _d !== void 0 ? _d : tryExact(lin)) !== null && _e !== void 0 ? _e : tryExact(laplace_1.linear(numerator_1.numerator(E), d1)) // with the denominators cleared
    );
}
// y' = a(x) y + b(x): y = (integral(mu b) + C1)/mu with mu = exp(-integral(a))
function firstOrderLinear(f, y, x, conds) {
    const lin = laplace_1.linear(f, y);
    if (lin === null) {
        return null;
    }
    const [a, b] = lin;
    const mu = expOf(integral_1.integral(multiply_1.negate(a), x), x);
    const sol = multiply_1.divide(add_1.add(integral_1.integral(multiply_1.multiply(mu, b), x), constant(1)), mu);
    return fitAll([sol], x, 1, conds);
}
// y' = g(x) h(y)
function separable(f, y, x, conds, Y) {
    const rel = separableRelation(f, y, x, conds);
    return rel && explicit(rel.H, rel.C, y, x, conds, Y);
}
// y' = g(x) h(y): integral(1/h, y) = integral(g, x) + C as H(x, y) = C
function separableRelation(f, y, x, conds) {
    var _a;
    let g = null;
    let h = null;
    for (const x0 of [1, 2, 3]) {
        h = eval_1.Eval(subst_1.subst(f, x, bignum_1.integer(x0)));
        if (!isZero(h)) {
            g = simplify_1.simplify(multiply_1.divide(f, h));
            break;
        }
    }
    // simplify does not cancel (y^2+1)/(1/2*y^2+1/2): g from a value of y,
    // checked by f = g h
    for (const y0 of g !== null && find_1.Find(g, y) ? [1, 2, 3] : []) {
        const at = (p) => eval_1.Eval(subst_1.subst(p, y, bignum_1.integer(y0)));
        try {
            const g0 = simplify_1.simplify(multiply_1.divide(at(f), at(h)));
            if (isZero(add_1.subtract(f, multiply_1.multiply(g0, h)))) {
                g = g0;
                break;
            }
        }
        catch (e) {
            // no value at this y0
        }
    }
    if (g === null || find_1.Find(g, y)) {
        return null;
    }
    // the constant solution y = y0 for h(y0) = 0, where 1/h has no integral
    if (conds.length === 1 && conds[0].order === 0 && vanishes(h, y, conds[0].value)) {
        return { H: y, C: conds[0].value };
    }
    const G = (_a = tryIntegral(multiply_1.divide(defs_1.Constants.one, h), y)) !== null && _a !== void 0 ? _a : tryIntegral(simplify_1.simplify(multiply_1.divide(defs_1.Constants.one, h)), y);
    const F = tryIntegral(g, x);
    if (G === null || F === null) {
        return null;
    }
    // With logs, k (log|u| + c log|v| + ...) = F + C is
    // u v^c ... exp(-F/k) = C, the signs and exp(C/k) go into the constant;
    // k arctan(u) = F + C is u = tan((F + C)/k).
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
        // an arbitrary constant stays one when divided by ka
        const angle = conds.length === 0 ? add_1.add(multiply_1.divide(F, ka), C) : multiply_1.divide(add_1.add(F, C), ka);
        H = add_1.subtract(defs_1.cadr(atan), eval_1.Eval(makeCall(defs_1.TAN, angle)));
        C = defs_1.Constants.zero;
    }
    return { H, C };
}
// H(x, y) = C solved for y: linear or a polynomial in y
function explicit(H, C, y, x, conds, Y) {
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
    // y = 0 is the solution for k > 1, where v = y^(1-k) has no value
    if (assume_1.isPositive(add_1.subtract(k, defs_1.Constants.one)) && conds.length === 1 && conds[0].order === 0 && isZero(conds[0].value)) {
        return [defs_1.Constants.zero];
    }
    const m = add_1.subtract(defs_1.Constants.one, k); // v = y^m
    const vconds = conds.map((c) => {
        if (c.order > 0) {
            run_1.stop('dsolve: initial conditions of a Bernoulli equation must look like y(0)=1');
        }
        return Object.assign(Object.assign({}, c), { value: power_1.power(c.value, m) });
    });
    const vs = firstOrderLinear(add_1.add(multiply_1.multiply(multiply_1.multiply(m, a), y), multiply_1.multiply(m, b)), y, x, vconds);
    if (vs.length === 0) {
        return [];
    }
    const root = power_1.power(vs[0], multiply_1.divide(defs_1.Constants.one, m));
    const sols = is_1.iseveninteger(m) ? [multiply_1.negate(root), root] : [root];
    return keepSatisfying(sols, x, conds);
}
// y' = F(y/x): y = v x gives the separable x v' = F(v) - v
function homogeneous(f, y, x, conds, Y) {
    const v = symbol_1.usr_symbol('$v');
    const F = simplify_1.simplify(eval_1.Eval(subst_1.subst(f, y, multiply_1.multiply(v, x))));
    if (find_1.Find(F, x)) {
        return null;
    }
    const vconds = conds.map((c) => (c.order > 0 ? c : Object.assign(Object.assign({}, c), { value: multiply_1.divide(c.value, c.at) })));
    const rel = separableRelation(multiply_1.divide(simplify_1.simplify(add_1.subtract(F, v)), x), v, x, vconds);
    return rel && explicit(eval_1.Eval(subst_1.subst(rel.H, v, multiply_1.divide(y, x))), rel.C, y, x, conds, Y);
}
// M + N y' = 0 with dM/dy = dN/dx: Psi(x, y) = C for
// Psi = integral(M, x) + integral(N - d(integral(M, x), y), y)
function exact(M, N, y, x, conds, Y) {
    if (!isZero(add_1.subtract(derivative_1.derivative(M, y), derivative_1.derivative(N, x)))) {
        return null;
    }
    const P = tryIntegral(M, x);
    const rest = P && simplify_1.simplify(add_1.subtract(N, derivative_1.derivative(P, y)));
    const R = rest && !find_1.Find(rest, x) ? tryIntegral(rest, y) : null;
    if (R === null) {
        return null;
    }
    const Psi = add_1.add(P, R);
    const C = conds.length === 0 ? constant(1) : initialConstant(Psi, y, x, conds);
    return explicit(Psi, C, y, x, conds, Y);
}
// ------------------------------------------------------ linear, any order
// E = sum a_k vars[k] - q with a_k and q free of vars, else null
function linearCoefficients(E, vars) {
    const a = [];
    let rest = E;
    for (const v of vars) {
        const lin = laplace_1.linear(rest, v);
        if (lin === null || !freeOf(lin[0], ...vars)) {
            return null;
        }
        a.push(lin[0]);
        rest = lin[1];
    }
    return freeOf(rest, ...vars) ? { a, q: multiply_1.negate(rest) } : null;
}
// sum a_k y^(k) = q(x) with constant a_k
function constantCoefficients(a, q, x) {
    if (!freeOf(scan_1.build_tensor(a), x)) {
        return null;
    }
    const r = symbol_1.usr_symbol('$r');
    const P = a.reduce((acc, ak, k) => add_1.add(acc, multiply_1.multiply(ak, power_1.power(r, bignum_1.integer(k)))), defs_1.Constants.zero);
    return characteristic(P, r, a.length - 1, q, x);
}
// sum a_k x^k y^(k) = q(x), up to a common factor of the a_k: with
// x = exp(t) it has constant coefficients in t, the characteristic
// polynomial is sum a_k r (r-1) ... (r-k+1)
function eulerCauchy(a, q, x) {
    const n = a.length - 1;
    const lead = multiply_1.divide(a[n], power_1.power(x, bignum_1.integer(n))); // the common factor
    const b = a.map((ak, k) => simplify_1.simplify(multiply_1.divide(ak, multiply_1.multiply(lead, power_1.power(x, bignum_1.integer(k))))));
    if (!freeOf(scan_1.build_tensor(b), x)) {
        return null;
    }
    const r = symbol_1.usr_symbol('$r');
    const t = symbol_1.usr_symbol('$t');
    let falling = defs_1.Constants.one; // r (r-1) ... (r-k+1)
    let P = defs_1.Constants.zero;
    b.forEach((bk, k) => {
        P = add_1.add(P, multiply_1.multiply(bk, falling));
        falling = multiply_1.multiply(falling, add_1.subtract(r, bignum_1.integer(k)));
    });
    const qt = eval_1.Eval(subst_1.subst(multiply_1.divide(q, lead), x, misc_1.exponential(t)));
    const sol = characteristic(P, r, n, qt, t, multiply_1.divide(q, lead));
    return eval_1.Eval(subst_1.subst(sol, t, makeCall(defs_1.LOG, x)));
}
// general solution of P(d/dx) y = q for the polynomial P(r) of degree n:
// exp(r x) for the roots r of P, times x^j for a root of multiplicity > j,
// plus a particular solution from invlaplace(laplace(q)/P(s)) or, for
// n = 2, from variation of parameters. rightSide is q for the message.
function characteristic(P, r, n, q, x, rightSide = q) {
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
    if (basis.length !== n) {
        run_1.stop('dsolve: could not find all roots of ' + P);
    }
    const sol = basis.reduce((acc, f, i) => add_1.add(acc, multiply_1.multiply(constant(i + 1), f)), defs_1.Constants.zero);
    if (isZero(q)) {
        return sol;
    }
    const s = symbol_1.usr_symbol('$s');
    let yp = laplace_1.invlaplace(multiply_1.divide(laplace_1.laplace(q, x, s), eval_1.Eval(subst_1.subst(P, r, s))), s, x);
    if (find_1.Find(yp, symbol_1.symbol(defs_1.LAPLACE)) || find_1.Find(yp, symbol_1.symbol(defs_1.INVLAPLACE))) {
        yp = n === 2 ? variationOfParameters(basis, multiply_1.divide(q, coeff_1.coeff(P, r)[2]), x) : null;
    }
    if (yp === null) {
        run_1.stop('dsolve: no particular solution for the right side ' + rightSide);
    }
    // terms of yp that solve the homogeneous equation go into the constants
    const particular = terms(yp).filter((t) => !basis.some((b) => freeOf(multiply_1.divide(t, b), x)));
    return particular.reduce(add_1.add, sol);
}
// y'' + ... = g: yp = -y1 integral(y2 g/W) + y2 integral(y1 g/W) with the
// Wronskian W = y1 y2' - y2 y1'
function variationOfParameters([y1, y2], g, x) {
    const W = add_1.subtract(multiply_1.multiply(y1, derivative_1.derivative(y2, x)), multiply_1.multiply(y2, derivative_1.derivative(y1, x)));
    const gW = multiply_1.divide(g, simplify_1.simplify(W));
    const I1 = tryIntegral(simplify_1.simplify(multiply_1.multiply(y2, gW)), x);
    const I2 = tryIntegral(simplify_1.simplify(multiply_1.multiply(y1, gW)), x);
    return I1 && I2 && eval_1.Eval(add_1.subtract(multiply_1.multiply(y2, I2), multiply_1.multiply(y1, I1)));
}
// ---------------------------------------------------------------- systems
// sum_j m_ij y_j' + a_ij y_j = q_i(t) with constant m_ij, a_ij. The laplace
// transform sum_j m_ij (s Y_j - y_j(0)) + a_ij Y_j = Q_i is linear in the
// Y_j; the constants are the values at 0, Cj = y_j(0).
function system(odes, Ys, conds) {
    const n = Ys.length;
    const t = defs_1.cadr(Ys[0]);
    if (odes.length !== n || !Ys.every((F) => defs_1.cadr(F) === t)) {
        run_1.stop('dsolve: a system takes as many equations as functions like x(t), y(t) of one variable');
    }
    if (odes.some(is_1.isfloating)) {
        run_1.stop('dsolve: a system needs exact coefficients, 1/2 instead of 0.5'); // invlaplace factors
    }
    const s = symbol_1.usr_symbol('$s');
    const ys = Ys.map((_, j) => symbol_1.usr_symbol('$y' + (j + 1)));
    const ds = Ys.map((_, j) => symbol_1.usr_symbol('$d' + (j + 1)));
    const transforms = Ys.map((_, j) => symbol_1.usr_symbol('$Y' + (j + 1)));
    const eqs = odes.map((ode) => {
        let E = ode;
        Ys.forEach((F, j) => {
            const dF = new defs_1.Cons(symbol_1.symbol(defs_1.DERIVATIVE), new defs_1.Cons(F, new defs_1.Cons(t, symbol_1.symbol(defs_1.NIL))));
            E = subst_1.subst(subst_1.subst(E, dF, ds[j]), F, ys[j]);
        });
        const lin = linearCoefficients(eval_1.Eval(E), [...ys, ...ds]);
        if (lin === null ||
            !freeOf(scan_1.build_tensor(lin.a), t) ||
            Ys.some((F) => order(ode, F, t) > 1 || find_1.Find(lin.q, defs_1.car(F)))) {
            run_1.stop('dsolve: only first-order linear systems with constant coefficients are supported');
        }
        return transforms.reduce((acc, Yj, j) => {
            const dYj = add_1.subtract(multiply_1.multiply(s, Yj), constant(j + 1));
            return add_1.add(acc, add_1.add(multiply_1.multiply(lin.a[n + j], dYj), multiply_1.multiply(lin.a[j], Yj)));
        }, multiply_1.negate(laplace_1.laplace(lin.q, t, s)));
    });
    const solved = solve_1.solveLinearSystem(scan_1.build_tensor(eqs), scan_1.build_tensor(transforms));
    const sol = scan_1.build_tensor(solved.elem.map((Yj) => laplace_1.invlaplace(Yj, s, t)));
    if (find_1.Find(sol, symbol_1.symbol(defs_1.LAPLACE)) || find_1.Find(sol, symbol_1.symbol(defs_1.INVLAPLACE))) {
        run_1.stop('dsolve: the laplace transform does not solve this system');
    }
    return fitAll([sol], t, n, conds);
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
// p = 0 at y = y0; a p without value there does not vanish
function vanishes(p, y, y0) {
    try {
        return isZero(eval_1.Eval(subst_1.subst(p, y, y0)));
    }
    catch (e) {
        return false;
    }
}
// integral() stops when it finds none
function tryIntegral(f, x) {
    try {
        return integral_1.integral(f, x);
    }
    catch (e) {
        return null;
    }
}
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
// The constants C1..Cn of each solution fitted to the conditions one by
// one: a condition is solved for a constant, linearly if possible, else by
// solve, where several values give several solutions. The constants that
// stay are renumbered from C1. A solution the conditions contradict drops
// out.
function fitAll(sols, x, n, conds) {
    if (conds.length === 0) {
        return sols;
    }
    const Cs = Array.from({ length: n }, (_, i) => constant(i + 1));
    const fitted = sols.reduce((acc, sol) => acc.concat(fit(sol, x, Cs, conds)), []);
    return fitted.map((sol) => {
        Cs.filter((C) => find_1.Find(sol, C)).forEach((C, i) => {
            sol = subst_1.subst(sol, C, constant(i + 1));
        });
        return simplify_1.simplify(eval_1.Eval(sol));
    });
}
function fit(sol, x, Cs, conds) {
    if (conds.length === 0) {
        return [sol];
    }
    let eq;
    try {
        eq = add_1.subtract(atOrder(sol, x, conds[0]), conds[0].value);
    }
    catch (e) {
        run_1.stop('dsolve: the solution ' + sol + ' has no value at ' + x + ' = ' + conds[0].at);
    }
    if (isZero(eq)) {
        return fit(sol, x, Cs, conds.slice(1));
    }
    const open = Cs.filter((C) => find_1.Find(eq, C));
    for (const solveFor of [linearConstant, solvedConstant]) {
        for (const C of open) {
            const values = solveFor(eq, C);
            if (values.length > 0) {
                return values.reduce((acc, v) => acc.concat(fit(eval_1.Eval(subst_1.subst(sol, C, v)), x, Cs, conds.slice(1))), []);
            }
        }
    }
    if (open.length > 0) {
        run_1.stop('dsolve: cannot fit the constants to the condition at ' + conds[0].at);
    }
    return [];
}
function linearConstant(eq, C) {
    const lin = laplace_1.linear(eq, C);
    return lin === null || isZero(lin[0]) ? [] : [multiply_1.divide(multiply_1.negate(lin[1]), lin[0])];
}
function solvedConstant(eq, C) {
    try {
        return solve_transcendental_1.tidySolutions(solve_transcendental_1.solveEquation(eq, C));
    }
    catch (e) {
        return [];
    }
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
    let d = defs_1.istensor(sol) ? sol.tensor.elem[c.index] : sol; // a system
    for (let i = 0; i < c.order; i++) {
        d = derivative_1.derivative(d, x);
    }
    return at_1.at(d, x, c.at);
}
