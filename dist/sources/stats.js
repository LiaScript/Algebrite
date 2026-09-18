"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_random = exports.Eval_median = exports.Eval_ssd = exports.Eval_sd = exports.Eval_svariance = exports.Eval_variance = exports.Eval_mean = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const conj_1 = require("./conj");
const eval_1 = require("./eval");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const test_1 = require("./test");
// Data is either one vector, mean([1,2,3]), or the argument list, mean(1,2,3).
function values(p1) {
    const args = p1.tail().map(eval_1.Eval);
    const data = args.length === 1 && defs_1.istensor(args[0]) ? args[0].elem : args;
    if (data.length === 0) {
        run_1.stop(`${defs_1.car(p1)}: no data`);
    }
    return data;
}
function mean(data) {
    return multiply_1.divide(data.reduce(add_1.add), bignum_1.integer(data.length));
}
// Sum of squared deviations |d|^2 = d conj(d), divided by n - ddof
// (0: population, 1: sample).
function variance(data, ddof) {
    if (data.length <= ddof) {
        run_1.stop('variance: not enough data');
    }
    const m = mean(data);
    const ss = data
        .map((x) => {
        const d = add_1.subtract(x, m);
        return multiply_1.multiply(d, conj_1.conj(d));
    })
        .reduce(add_1.add);
    return multiply_1.divide(ss, bignum_1.integer(data.length - ddof));
}
const sqrt = (p) => power_1.power(p, bignum_1.rational(1, 2));
function Eval_mean(p1) {
    return mean(values(p1));
}
exports.Eval_mean = Eval_mean;
function Eval_variance(p1) {
    return variance(values(p1), 0);
}
exports.Eval_variance = Eval_variance;
function Eval_svariance(p1) {
    return variance(values(p1), 1);
}
exports.Eval_svariance = Eval_svariance;
function Eval_sd(p1) {
    return sqrt(variance(values(p1), 0));
}
exports.Eval_sd = Eval_sd;
function Eval_ssd(p1) {
    return sqrt(variance(values(p1), 1));
}
exports.Eval_ssd = Eval_ssd;
// Unevaluated when the order of the data is undecidable (symbolic values),
// like min/max.
function Eval_median(p1) {
    const data = values(p1);
    let undecidable = false;
    const sorted = [...data].sort((a, b) => {
        const c = test_1.cmp_values(a, b);
        if (c === null) {
            undecidable = true;
            return 0;
        }
        return c;
    });
    if (undecidable) {
        return list_1.makeList(defs_1.car(p1), ...p1.tail().map(eval_1.Eval));
    }
    const n = sorted.length;
    const mid = Math.floor(n / 2);
    return n % 2 ? sorted[mid] : mean([sorted[mid - 1], sorted[mid]]);
}
exports.Eval_median = Eval_median;
// random(): float in [0,1); random(a,b): integer in [a,b].
function Eval_random(p1) {
    const args = p1.tail().map(eval_1.Eval);
    if (args.length === 0) {
        return bignum_1.double(Math.random());
    }
    const a = args.length === 2 ? bignum_1.nativeInt(args[0]) : NaN;
    const b = args.length === 2 ? bignum_1.nativeInt(args[1]) : NaN;
    if (isNaN(a) || isNaN(b) || a > b) {
        run_1.stop('random: use random() or random(a,b) with integers a <= b');
    }
    return bignum_1.integer(a + Math.floor(Math.random() * (b - a + 1)));
}
exports.Eval_random = Eval_random;
