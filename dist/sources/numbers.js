"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_primes = exports.Eval_nextprime = exports.Eval_powermod = exports.Eval_totient = exports.Eval_harmonic = exports.Eval_fibonacci = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const mprime_1 = require("./mprime");
const multiply_1 = require("./multiply");
const pollard_1 = require("./pollard");
const scan_1 = require("./scan");
// Number functions on integers; anything else is left as it is.
function integerArg(p) {
    return is_1.isinteger(p) ? p.a : undefined;
}
// fibonacci(n) by fast doubling: F(2k) = F(k)*(2*F(k+1)-F(k)),
// F(2k+1) = F(k)^2 + F(k+1)^2
function Eval_fibonacci(p1) {
    misc_1.checkArgCount(p1, 1);
    const arg = eval_1.Eval(defs_1.cadr(p1));
    const n = bignum_1.nativeInt(arg);
    if (isNaN(n) || n < 0) {
        return list_1.makeList(symbol_1.usr_symbol('fibonacci'), arg);
    }
    const fib = (k) => {
        if (k === 0) {
            return [big_integer_1.default.zero, big_integer_1.default.one];
        }
        const [a, b] = fib(Math.floor(k / 2));
        const c = a.multiply(b.multiply(2).subtract(a));
        const d = a.multiply(a).add(b.multiply(b));
        return k % 2 === 0 ? [c, d] : [d, c.add(d)];
    };
    return new defs_1.Num(fib(n)[0]);
}
exports.Eval_fibonacci = Eval_fibonacci;
// harmonic(n) = 1 + 1/2 + ... + 1/n
function Eval_harmonic(p1) {
    misc_1.checkArgCount(p1, 1);
    const arg = eval_1.Eval(defs_1.cadr(p1));
    const n = bignum_1.nativeInt(arg);
    if (isNaN(n) || n < 0) {
        return list_1.makeList(symbol_1.usr_symbol('harmonic'), arg);
    }
    let sum = defs_1.Constants.zero;
    for (let k = 1; k <= n; k++) {
        sum = add_1.add(sum, bignum_1.rational(1, k));
    }
    return sum;
}
exports.Eval_harmonic = Eval_harmonic;
// totient(n) = n * prod (1 - 1/p) over the primes p dividing n
function Eval_totient(p1) {
    misc_1.checkArgCount(p1, 1);
    const arg = eval_1.Eval(defs_1.cadr(p1));
    const n = integerArg(arg);
    if (n === undefined || !n.isPositive()) {
        return list_1.makeList(symbol_1.usr_symbol('totient'), arg);
    }
    if (n.equals(1)) {
        return defs_1.Constants.one;
    }
    const f = pollard_1.factor_number(arg);
    const factors = defs_1.ismultiply(f) ? f.tail() : [f];
    return factors.reduce((acc, t) => {
        const p = defs_1.ispower(t) ? defs_1.cadr(t) : t;
        return multiply_1.divide(multiply_1.multiply(acc, add_1.add(p, defs_1.Constants.negOne)), p);
    }, arg);
}
exports.Eval_totient = Eval_totient;
// powermod(a, b, m) = a^b mod m, the modular inverse for negative b
function Eval_powermod(p1) {
    misc_1.checkArgCount(p1, 3);
    const args = [defs_1.cadr(p1), defs_1.caddr(p1), defs_1.cadddr(p1)].map(eval_1.Eval);
    const [a, b, m] = args.map(integerArg);
    if (a === undefined || b === undefined || m === undefined || !m.isPositive()) {
        return list_1.makeList(symbol_1.usr_symbol('powermod'), ...args);
    }
    let base = a;
    if (b.isNegative()) {
        if (!big_integer_1.default.gcd(a, m).equals(1)) {
            run_1.stop(`powermod: ${a} has no inverse modulo ${m}`);
        }
        base = a.modInv(m);
    }
    const r = base.modPow(b.abs(), m);
    return new defs_1.Num(r.isNegative() ? r.add(m) : r);
}
exports.Eval_powermod = Eval_powermod;
// the smallest prime above n
function Eval_nextprime(p1) {
    misc_1.checkArgCount(p1, 1);
    const arg = eval_1.Eval(defs_1.cadr(p1));
    let n = integerArg(arg);
    if (n === undefined) {
        return list_1.makeList(symbol_1.usr_symbol('nextprime'), arg);
    }
    n = n.lesser(1) ? big_integer_1.default(2) : n.add(1);
    while (!mprime_1.mprime(n)) {
        n = n.add(1);
    }
    return new defs_1.Num(n);
}
exports.Eval_nextprime = Eval_nextprime;
// primes(n): the primes up to n, by the sieve of Eratosthenes
function Eval_primes(p1) {
    misc_1.checkArgCount(p1, 1);
    const arg = eval_1.Eval(defs_1.cadr(p1));
    const n = bignum_1.nativeInt(arg);
    if (isNaN(n)) {
        return list_1.makeList(symbol_1.usr_symbol('primes'), arg);
    }
    if (n > 1e7) {
        run_1.stop('primes: at most up to 10^7');
    }
    const composite = new Uint8Array(Math.max(n + 1, 2));
    const result = [];
    for (let i = 2; i <= n; i++) {
        if (!composite[i]) {
            result.push(bignum_1.integer(i));
            for (let j = i * i; j <= n; j += i) {
                composite[j] = 1;
            }
        }
    }
    return scan_1.build_tensor(result);
}
exports.Eval_primes = Eval_primes;
