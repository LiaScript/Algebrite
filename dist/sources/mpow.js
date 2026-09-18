"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mpow = void 0;
const run_1 = require("../runtime/run");
// Bignum power
const MAX_POWER_DIGITS = 1000000;
function mpow(a, n) {
    // one library call that nothing can interrupt: 2^(10^8) took 28 s
    const digits = a.abs().toString(2).length * 0.30103 * Number(n);
    if (digits > MAX_POWER_DIGITS) {
        run_1.stop(`power: the result would have more than ${MAX_POWER_DIGITS} digits`);
    }
    return a.pow(n);
}
exports.mpow = mpow;
//if SELFTEST
