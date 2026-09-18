"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factor_number = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const mcmp_1 = require("../runtime/mcmp");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const is_1 = require("./is");
const list_1 = require("./list");
const mmul_1 = require("./mmul");
const mprime_1 = require("./mprime");
// Factor using the Pollard rho method
let n_factor_number = big_integer_1.default(0);
function factor_number(p1) {
    // 0 or 1?
    if (is_1.equaln(p1, 0) || is_1.equaln(p1, 1) || is_1.equaln(p1, -1)) {
        return p1;
    }
    n_factor_number = p1.q.a;
    const factors = factor_a();
    if (factors.length == 1) {
        return factors[0];
    }
    return list_1.makeList(symbol_1.symbol(defs_1.MULTIPLY), ...factors);
}
exports.factor_number = factor_number;
// factor using table look-up, then switch to rho method if necessary
// From TAOCP Vol. 2 by Knuth, p. 380 (Algorithm A)
function factor_a() {
    const result = [];
    if (n_factor_number.isNegative()) {
        n_factor_number = bignum_1.setSignTo(n_factor_number, 1);
        result.push(defs_1.Constants.negOne);
    }
    for (let k = 0; k < 10000; k++) {
        result.push(...try_kth_prime(k));
        // if n_factor_number is 1 then we're done
        if (n_factor_number.compare(1) === 0) {
            return result;
        }
    }
    result.push(...factor_b());
    return result;
}
function try_kth_prime(k) {
    const result = [];
    let q;
    const d = bignum_1.mint(defs_1.primetab[k]);
    let count = 0;
    while (true) {
        // if n_factor_number is 1 then we're done
        if (n_factor_number.compare(1) === 0) {
            if (count) {
                result.push(_factor(d, count));
            }
            return result;
        }
        let r;
        [q, r] = Array.from(mmul_1.mdivrem(n_factor_number, d));
        // continue looping while remainder is zero
        if (r.isZero()) {
            count++;
            n_factor_number = q;
        }
        else {
            break;
        }
    }
    if (count) {
        result.push(_factor(d, count));
    }
    // q = n_factor_number/d, hence if q < d then
    // n_factor_number < d^2 so n_factor_number is prime
    if (mcmp_1.mcmp(q, d) === -1) {
        result.push(_factor(n_factor_number, 1));
        n_factor_number = bignum_1.mint(1);
    }
    return result;
}
// What the prime table left over: split with Pollard's rho until only primes
// remain, ascending, equal primes as a power.
function factor_b() {
    const primes = [];
    const split = (n) => {
        if (n.equals(1)) {
            return;
        }
        if (mprime_1.mprime(n)) {
            primes.push(n);
            return;
        }
        const g = rho(n);
        split(g);
        split(n.divide(g));
    };
    split(n_factor_number);
    n_factor_number = bignum_1.mint(1);
    primes.sort((a, b) => a.compare(b));
    const result = [];
    for (let i = 0; i < primes.length;) {
        let count = 1;
        while (i + count < primes.length && primes[i + count].equals(primes[i])) {
            count++;
        }
        result.push(_factor(primes[i], count));
        i += count;
    }
    return result;
}
// A proper factor of the composite n: Pollard's rho with Brent's cycle
// detection. The differences of 128 steps are multiplied up and go through
// one gcd; with a gcd in every step a 12 digit factor took 11 s. When the
// product hits n itself the steps are walked again one by one, and when even
// that fails the next constant c is tried.
function rho(n) {
    for (let c = 1;; c += 2) {
        const f = (v) => v.multiply(v).add(c).mod(n);
        let y = big_integer_1.default(2);
        let x = y;
        let ys = y;
        let q = big_integer_1.default.one;
        let g = big_integer_1.default.one;
        for (let r = 1; g.equals(1); r *= 2) {
            x = y;
            for (let i = 0; i < r; i++) {
                y = f(y);
            }
            for (let k = 0; k < r && g.equals(1); k += 128) {
                run_1.check_esc_flag();
                ys = y;
                for (let i = 0; i < Math.min(128, r - k); i++) {
                    y = f(y);
                    q = q.multiply(x.subtract(y).abs()).mod(n);
                }
                g = big_integer_1.default.gcd(q, n);
            }
        }
        if (g.equals(n)) {
            do {
                ys = f(ys);
                g = big_integer_1.default.gcd(x.subtract(ys).abs(), n);
            } while (g.equals(1));
        }
        if (!g.equals(n)) {
            return g;
        }
    }
}
function _factor(d, count) {
    let factor = new defs_1.Num(d);
    if (count > 1) {
        factor = list_1.makeList(symbol_1.symbol(defs_1.POWER), factor, new defs_1.Num(bignum_1.mint(count)));
    }
    return factor;
}
