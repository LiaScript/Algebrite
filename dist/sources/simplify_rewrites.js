"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplify_quotients = exports.simplify_hyperbolic = exports.simplify_logs = void 0;
const count_1 = require("../runtime/count");
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const denominator_1 = require("./denominator");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const numerator_1 = require("./numerator");
const pollard_1 = require("./pollard");
const power_1 = require("./power");
const rationalize_1 = require("./rationalize");
const simplify_1 = require("./simplify");
// Rewrites simplify() tries and keeps only when the result is shorter.
// Replaces every subexpression f maps to something, bottom-up untouched.
function mapTree(p, f) {
    const r = f(p);
    if (r !== undefined) {
        return r;
    }
    return defs_1.iscons(p) ? list_1.makeList(...p.map((el) => mapTree(el, f))) : p;
}
function shorter(candidate, p) {
    return count_1.count(candidate) < count_1.count(p) ? candidate : p;
}
// log(8) = 3*log(2): logs of rationals are split over the prime factors, so
// that log(8)/log(2) = 3 and log(12)-log(3) = 2*log(2)
function simplify_logs(p1) {
    if (!find_1.Find(p1, symbol_1.symbol(defs_1.LOG))) {
        return p1;
    }
    const split = mapTree(p1, (q) => defs_1.car(q) === symbol_1.symbol(defs_1.LOG) && defs_1.isrational(defs_1.cadr(q)) && is_1.ispositivenumber(defs_1.cadr(q))
        ? logOfRational(defs_1.cadr(q))
        : undefined);
    return shorter(eval_1.Eval(split), p1);
}
exports.simplify_logs = simplify_logs;
function logOfRational(q) {
    const part = (n) => {
        if (is_1.isone(n)) {
            return defs_1.Constants.zero;
        }
        const f = pollard_1.factor_number(n);
        const factors = defs_1.ismultiply(f) ? f.tail() : [f];
        return factors.reduce((acc, t) => add_1.add(acc, defs_1.ispower(t)
            ? list_1.makeList(symbol_1.symbol('multiply'), defs_1.caddr(t), list_1.makeList(symbol_1.symbol(defs_1.LOG), defs_1.cadr(t)))
            : list_1.makeList(symbol_1.symbol(defs_1.LOG), t)), defs_1.Constants.zero);
    };
    return add_1.subtract(part(numerator_1.numerator(q)), part(denominator_1.denominator(q)));
}
// cosh^2 = 1+sinh^2 or sinh^2 = cosh^2-1, whichever gets shorter
function simplify_hyperbolic(p1) {
    if (!find_1.Find(p1, symbol_1.symbol(defs_1.SINH)) && !find_1.Find(p1, symbol_1.symbol(defs_1.COSH))) {
        return p1;
    }
    const evenPower = (fn, to) => (q) => defs_1.ispower(q) &&
        defs_1.car(defs_1.cadr(q)) === symbol_1.symbol(fn) &&
        is_1.isinteger(defs_1.caddr(q)) &&
        !is_1.isnegativenumber(defs_1.caddr(q)) &&
        defs_1.caddr(q).a.isEven()
        ? power_1.power(to(defs_1.cadr(defs_1.cadr(q))), multiply_1.divide(defs_1.caddr(q), bignum_1.integer(2)))
        : undefined;
    const sq = (fn, u) => power_1.power(list_1.makeList(symbol_1.symbol(fn), u), bignum_1.integer(2));
    const viaSinh = eval_1.Eval(mapTree(p1, evenPower(defs_1.COSH, (u) => add_1.add(defs_1.Constants.one, sq(defs_1.SINH, u)))));
    const viaCosh = eval_1.Eval(mapTree(p1, evenPower(defs_1.SINH, (u) => add_1.subtract(sq(defs_1.COSH, u), defs_1.Constants.one))));
    return shorter(viaCosh, shorter(viaSinh, p1));
}
exports.simplify_hyperbolic = simplify_hyperbolic;
// tan = sin/cos in both directions: tan is expanded when the trig rewrites
// then shorten the whole (1/(1+tan^2) = cos^2), and sin^n/cos^n is collected
// into tan^n. The same for sinh, cosh and tanh.
function simplify_quotients(p1) {
    if (find_1.Find(p1, symbol_1.symbol(defs_1.TAN))) {
        const expanded = mapTree(p1, (q) => defs_1.car(q) === symbol_1.symbol(defs_1.TAN)
            ? multiply_1.divide(list_1.makeList(symbol_1.symbol(defs_1.SIN), defs_1.cadr(q)), list_1.makeList(symbol_1.symbol(defs_1.COS), defs_1.cadr(q)))
            : undefined);
        p1 = shorter(simplify_1.simplify_trig(rationalize_1.rationalize(eval_1.Eval(expanded))), p1);
    }
    p1 = collectQuotient(p1, defs_1.SIN, defs_1.COS, defs_1.TAN);
    return collectQuotient(p1, defs_1.SINH, defs_1.COSH, defs_1.TANH);
}
exports.simplify_quotients = simplify_quotients;
function collectQuotient(p1, s, c, t) {
    if (!find_1.Find(p1, symbol_1.symbol(s)) || !find_1.Find(p1, symbol_1.symbol(c))) {
        return p1;
    }
    const collected = mapTree(p1, (q) => {
        if (!defs_1.ismultiply(q)) {
            return undefined;
        }
        const factors = q.tail();
        // [base, exponent] of a factor fn(u)^n with integer n
        const split = (f, fn) => {
            const base = defs_1.ispower(f) ? defs_1.cadr(f) : f;
            const e = defs_1.ispower(f) ? defs_1.caddr(f) : defs_1.Constants.one;
            return defs_1.car(base) === symbol_1.symbol(fn) && is_1.isinteger(e)
                ? [base, e.a.toJSNumber()]
                : undefined;
        };
        for (const fs of factors) {
            const num = split(fs, s);
            if (!num || num[1] <= 0) {
                continue;
            }
            for (const fc of factors) {
                const den = split(fc, c);
                if (!den || den[1] >= 0 || !misc_1.equal(defs_1.cadr(den[0]), defs_1.cadr(num[0]))) {
                    continue;
                }
                const k = Math.min(num[1], -den[1]);
                const rest = factors.filter((f) => f !== fs && f !== fc);
                return [
                    ...rest,
                    power_1.power(list_1.makeList(symbol_1.symbol(t), defs_1.cadr(num[0])), bignum_1.integer(k)),
                    power_1.power(num[0], bignum_1.integer(num[1] - k)),
                    power_1.power(den[0], bignum_1.integer(den[1] + k))
                ].reduce(multiply_1.multiply, defs_1.Constants.one);
            }
        }
        return undefined;
    });
    return shorter(eval_1.Eval(collected), p1);
}
