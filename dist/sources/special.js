"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_cfrac = exports.evalChebyshev = exports.Eval_beta = exports.specialDerivative = exports.evalSpecial = exports.SPECIAL = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const float_1 = require("./float");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const scan_1 = require("./scan");
// usr_symbol: the soft names only exist once they are used
const call = (name, ...args) => list_1.makeList(symbol_1.usr_symbol(name), ...args);
const sq = (x) => power_1.power(x, bignum_1.integer(2));
const halfPi = () => multiply_1.divide(defs_1.Constants.Pi(), bignum_1.integer(2));
exports.SPECIAL = {
    lambertw: {
        exact: lambertExact,
        numeric: lambertW,
        // W' = W/(x*(1+W))
        derivative: (x) => multiply_1.divide(call('lambertw', x), multiply_1.multiply(x, add_1.add(defs_1.Constants.one, call('lambertw', x))))
    },
    Si: {
        odd: true,
        exact: (x) => (is_1.isZeroAtomOrTensor(x) ? defs_1.Constants.zero : undefined),
        numeric: (x) => cisi(x)[1],
        derivative: (x) => multiply_1.divide(call('sin', x), x)
    },
    Ci: {
        numeric: (x) => (x > 0 ? cisi(x)[0] : undefined),
        derivative: (x) => multiply_1.divide(call('cos', x), x)
    },
    Ei: {
        numeric: expIntegralEi,
        derivative: (x) => multiply_1.divide(misc_1.exponential(x), x)
    },
    fresnels: {
        odd: true,
        exact: (x) => (is_1.isZeroAtomOrTensor(x) ? defs_1.Constants.zero : undefined),
        numeric: (x) => fresnel(x)[0],
        derivative: (x) => call('sin', multiply_1.multiply(halfPi(), sq(x)))
    },
    fresnelc: {
        odd: true,
        exact: (x) => (is_1.isZeroAtomOrTensor(x) ? defs_1.Constants.zero : undefined),
        numeric: (x) => fresnel(x)[1],
        derivative: (x) => call('cos', multiply_1.multiply(halfPi(), sq(x)))
    },
    digamma: {
        numeric: digamma
    }
};
function evalSpecial(name) {
    return (p1) => {
        misc_1.checkArgCount(p1, 1);
        return special(name, eval_1.Eval(defs_1.cadr(p1)));
    };
}
exports.evalSpecial = evalSpecial;
function special(name, x) {
    const f = exports.SPECIAL[name];
    if (defs_1.isdouble(x)) {
        const v = f.numeric(x.d);
        return v === undefined || Number.isNaN(v) ? call(name, x) : bignum_1.double(v);
    }
    const exact = f.exact && f.exact(x);
    if (exact !== undefined) {
        return exact;
    }
    if (f.odd && is_1.isnegativeterm(x)) {
        return multiply_1.negate(special(name, multiply_1.negate(x)));
    }
    return call(name, x);
}
// d/dX of a special function call, undefined for anything else
function specialDerivative(p, dx) {
    const head = defs_1.car(p);
    if (!defs_1.iscons(p) || !('printname' in head)) {
        return undefined;
    }
    const name = head.printname;
    if (name === defs_1.GAMMA) {
        return multiply_1.multiply(multiply_1.multiply(p, call('digamma', defs_1.cadr(p))), dx(defs_1.cadr(p)));
    }
    const f = exports.SPECIAL[name];
    if (!f || !f.derivative) {
        return undefined;
    }
    return multiply_1.multiply(eval_1.Eval(f.derivative(defs_1.cadr(p))), dx(defs_1.cadr(p)));
}
exports.specialDerivative = specialDerivative;
// ---- Lambert W, principal branch
// W(0) = 0, W(e) = 1, W(-1/e) = -1, W(k*log(k)) = log(k) for k >= 1 and
// W(log(k^k)) = log(k)
function lambertExact(x) {
    if (is_1.isZeroAtomOrTensor(x)) {
        return defs_1.Constants.zero;
    }
    if (x === symbol_1.symbol(defs_1.E)) {
        return defs_1.Constants.one;
    }
    if (misc_1.equal(x, multiply_1.negate(misc_1.exponential(defs_1.Constants.negOne)))) {
        return defs_1.Constants.negOne;
    }
    if (defs_1.ismultiply(x)) {
        const log = x.tail().find((f) => defs_1.car(f) === symbol_1.symbol(defs_1.LOG));
        if (log && defs_1.isrational(defs_1.cadr(log)) && misc_1.equal(x, multiply_1.multiply(defs_1.cadr(log), log))) {
            const k = float_1.zzfloat(defs_1.cadr(log));
            if (defs_1.isdouble(k) && k.d >= 1) {
                return log;
            }
        }
    }
    if (defs_1.car(x) === symbol_1.symbol(defs_1.LOG) && is_1.isinteger(defs_1.cadr(x))) {
        for (let k = 2; k < 40; k++) {
            if (misc_1.equal(power_1.power(bignum_1.integer(k), bignum_1.integer(k)), defs_1.cadr(x))) {
                return call(defs_1.LOG, bignum_1.integer(k));
            }
        }
    }
    return undefined;
}
function lambertW(x) {
    if (x < -1 / Math.E) {
        return undefined; // complex
    }
    if (x === 0) {
        return 0;
    }
    let w = x < 1 ? Math.sqrt(2 * (Math.E * x + 1)) - 1 : Math.log(x) - Math.log(Math.log(x) + 1);
    for (let i = 0; i < 50; i++) {
        const ew = Math.exp(w);
        const f = w * ew - x;
        const step = f / (ew * (w + 1) - ((w + 2) * f) / (2 * w + 2));
        w -= step;
        if (Math.abs(step) < 1e-15 * (1 + Math.abs(w))) {
            break;
        }
    }
    return w;
}
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cinv = (a) => {
    const n = a[0] * a[0] + a[1] * a[1];
    return [a[0] / n, -a[1] / n];
};
const EULER = 0.5772156649015329;
const FPMIN = 1e-300;
function cisi(x) {
    const t = Math.abs(x);
    if (t === 0) {
        return [-Infinity, 0];
    }
    let ci;
    let si;
    if (t > 2) {
        let b = [1, t];
        let c = [1 / FPMIN, 0];
        let d = cinv(b);
        let h = d;
        for (let i = 1; i < 1000; i++) {
            const a = -i * i;
            b = [b[0] + 2, b[1]];
            d = cinv([a * d[0] + b[0], a * d[1] + b[1]]);
            const ac = cinv(c);
            c = [b[0] + a * ac[0], b[1] + a * ac[1]];
            const del = cmul(c, d);
            h = cmul(h, del);
            if (Math.abs(del[0] - 1) + Math.abs(del[1]) < 1e-16) {
                break;
            }
        }
        h = cmul([Math.cos(t), -Math.sin(t)], h);
        ci = -h[0];
        si = Math.PI / 2 + h[1];
    }
    else {
        let sums = 0;
        let sumc = 0;
        let term = 1;
        for (let k = 1; k < 100; k++) {
            term *= t / k;
            const contribution = term / k;
            if (k % 2 === 1) {
                sums += ((k - 1) / 2) % 2 === 0 ? contribution : -contribution;
            }
            else {
                sumc += (k / 2) % 2 === 1 ? -contribution : contribution;
            }
            if (contribution < 1e-18) {
                break;
            }
        }
        si = sums;
        ci = sumc + Math.log(t) + EULER;
    }
    return [ci, x < 0 ? -si : si];
}
// Ei(x): series for x > 0 (asymptotic from 40 on), -E1(-x) for x < 0 with
// E1 from its series up to 1 and a continued fraction beyond
function expIntegralEi(x) {
    if (x === 0) {
        return undefined;
    }
    if (x > 0) {
        if (x > 40) {
            let sum = 1;
            let term = 1;
            for (let k = 1; k < 60; k++) {
                const next = (term * k) / x;
                if (next > term) {
                    break;
                }
                term = next;
                sum += term;
            }
            return (Math.exp(x) / x) * sum;
        }
        let sum = 0;
        let term = 1;
        for (let k = 1; k < 500; k++) {
            term *= x / k;
            sum += term / k;
            if (term / k < 1e-17 * sum) {
                break;
            }
        }
        return EULER + Math.log(x) + sum;
    }
    const y = -x;
    if (y <= 1) {
        let sum = 0;
        let term = 1;
        for (let k = 1; k < 100; k++) {
            term *= -y / k;
            sum -= term / k;
        }
        return -(-EULER - Math.log(y) + sum);
    }
    let b = y + 1;
    let c = 1 / FPMIN;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 1000; i++) {
        const a = -i * i;
        b += 2;
        d = 1 / (a * d + b);
        c = b + a / c;
        const del = c * d;
        h *= del;
        if (Math.abs(del - 1) < 1e-16) {
            break;
        }
    }
    return -h * Math.exp(-y);
}
// Fresnel S and C: series up to 1.5, continued fraction beyond
// (Numerical Recipes, frenel)
function fresnel(x) {
    const ax = Math.abs(x);
    let s;
    let c;
    if (ax < 1.5) {
        let sum = 0;
        let sums = 0;
        let sumc = ax;
        let sign = 1;
        const fact = (Math.PI / 2) * ax * ax;
        let odd = true;
        let term = ax;
        let n = 3;
        for (let k = 1; k <= 100; k++) {
            term *= fact / k;
            sum += (sign * term) / n;
            const test = Math.abs(sum) * 1e-16;
            if (odd) {
                sign = -sign;
                sums = sum;
                sum = sumc;
            }
            else {
                sumc = sum;
                sum = sums;
            }
            if (term < test) {
                break;
            }
            odd = !odd;
            n += 2;
        }
        s = sums;
        c = sumc;
    }
    else {
        const pix2 = Math.PI * ax * ax;
        let b = [1, -pix2];
        let cc = [1 / FPMIN, 0];
        let d = cinv(b);
        let h = d;
        let n = -1;
        for (let k = 2; k <= 1000; k++) {
            n += 2;
            const a = -n * (n + 1);
            b = [b[0] + 4, b[1]];
            d = cinv([a * d[0] + b[0], a * d[1] + b[1]]);
            const ic = cinv(cc);
            cc = [b[0] + a * ic[0], b[1] + a * ic[1]];
            const del = cmul(cc, d);
            h = cmul(h, del);
            if (Math.abs(del[0] - 1) + Math.abs(del[1]) < 1e-16) {
                break;
            }
        }
        h = cmul([ax, -ax], h);
        const e = [Math.cos(0.5 * pix2), Math.sin(0.5 * pix2)];
        const eh = cmul(e, h);
        const cs = cmul([0.5, 0.5], [1 - eh[0], -eh[1]]);
        c = cs[0];
        s = cs[1];
    }
    return x < 0 ? [-s, -c] : [s, c];
}
// psi(x): reflection below 1/2, recurrence up to 6, then the asymptotic series
function digamma(x) {
    if (x <= 0 && Number.isInteger(x)) {
        return undefined;
    }
    if (x < 0.5) {
        return digamma(1 - x) - Math.PI / Math.tan(Math.PI * x);
    }
    let shift = 0;
    while (x < 6) {
        shift -= 1 / x;
        x += 1;
    }
    const i2 = 1 / (x * x);
    return (shift +
        Math.log(x) -
        0.5 / x -
        i2 * (1 / 12 - i2 * (1 / 120 - i2 * (1 / 252 - i2 * (1 / 240 - i2 / 132)))));
}
// ---- functions of two arguments
// beta(a,b) = Gamma(a)*Gamma(b)/Gamma(a+b)
function Eval_beta(p1) {
    misc_1.checkArgCount(p1, 2);
    const a = eval_1.Eval(defs_1.cadr(p1));
    const b = eval_1.Eval(defs_1.caddr(p1));
    const g = (x) => eval_1.Eval(call(defs_1.GAMMA, x));
    return multiply_1.divide(multiply_1.multiply(g(a), g(b)), g(add_1.add(a, b)));
}
exports.Eval_beta = Eval_beta;
// chebyshevt(x,n) and chebyshevu(x,n), in the argument order of hermite and
// legendre: T0 = U0 = 1, T1 = x, U1 = 2x, P(n+1) = 2x*P(n) - P(n-1)
function evalChebyshev(name) {
    return (p1) => {
        misc_1.checkArgCount(p1, 2);
        const x = eval_1.Eval(defs_1.cadr(p1));
        const N = eval_1.Eval(defs_1.caddr(p1));
        const n = bignum_1.nativeInt(N);
        if (isNaN(n) || n < 0) {
            return call(name, x, N);
        }
        let prev = defs_1.Constants.one;
        let cur = name === 'chebyshevt' ? x : multiply_1.multiply(bignum_1.integer(2), x);
        if (n === 0) {
            return prev;
        }
        for (let i = 1; i < n; i++) {
            [prev, cur] = [cur, add_1.subtract(multiply_1.multiply(multiply_1.multiply(bignum_1.integer(2), x), cur), prev)];
        }
        return misc_1.yyexpand(cur);
    };
}
exports.evalChebyshev = evalChebyshev;
// cfrac(x) for a rational, cfrac(x, n) for the first n terms of any number
function Eval_cfrac(p1) {
    misc_1.checkArgCount(p1, 1, 2);
    const x = eval_1.Eval(defs_1.cadr(p1));
    const limit = defs_1.caddr(p1) === symbol_1.symbol('nil') ? NaN : bignum_1.nativeInt(eval_1.Eval(defs_1.caddr(p1)));
    const terms = [];
    if (defs_1.isrational(x)) {
        let a = x.a;
        let b = x.b;
        while (!b.isZero() && !(terms.length >= limit)) {
            let q = a.divide(b);
            if (a.mod(b).isNegative()) {
                q = q.subtract(1); // floor
            }
            terms.push(new defs_1.Num(q));
            [a, b] = [b, a.subtract(q.multiply(b))];
        }
        return scan_1.build_tensor(terms);
    }
    const f = float_1.zzfloat(x);
    if (!defs_1.isdouble(f)) {
        return call('cfrac', x);
    }
    // ponytail: double precision carries about 15 digits, so only the first
    // terms are right; use an exact rational for more
    let v = f.d;
    const n = Number.isNaN(limit) ? 10 : limit;
    for (let i = 0; i < n; i++) {
        const q = Math.floor(v);
        terms.push(bignum_1.integer(q));
        if (Math.abs(v - q) < 1e-10) {
            break;
        }
        v = 1 / (v - q);
    }
    return scan_1.build_tensor(terms);
}
exports.Eval_cfrac = Eval_cfrac;
