"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yyfloat = exports.zzfloat = exports.evalExactly = exports.Eval_float = void 0;
const count_1 = require("../runtime/count");
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bigfloat_1 = require("./bigfloat");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const list_1 = require("./list");
const tensor_1 = require("./tensor");
// float(x) in double precision, float(x, n) to n significant digits
function Eval_float(p1) {
    if (defs_1.caddr(p1) !== symbol_1.symbol(defs_1.NIL)) {
        const n = bignum_1.nativeInt(eval_1.Eval(defs_1.caddr(p1)));
        if (isNaN(n) || n < 1 || n > bigfloat_1.MAX_DIGITS) {
            run_1.stop(`float: 2nd argument must be a number of digits from 1 to ${bigfloat_1.MAX_DIGITS}`);
        }
        return bigfloat_1.bigFloat(defs_1.noFloats(eval_1.Eval, defs_1.cadr(p1)), n);
    }
    // exactly first, like N[] elsewhere: gcd, roots, the integral table and
    // primality tests give wrong answers or none on float input
    const exact = defs_1.noFloats(eval_1.Eval, defs_1.cadr(p1));
    return defs_1.evalFloats(() => eval_1.Eval(yyfloat(exact)));
}
exports.Eval_float = Eval_float;
function checkFloatHasWorkedOutCompletely(nodeToCheck) {
    const numberOfPowers = count_1.countOccurrencesOfSymbol(symbol_1.symbol(defs_1.POWER), nodeToCheck);
    const numberOfPIs = count_1.countOccurrencesOfSymbol(symbol_1.symbol(defs_1.PI), nodeToCheck);
    const numberOfEs = count_1.countOccurrencesOfSymbol(symbol_1.symbol(defs_1.E), nodeToCheck);
    const numberOfMults = count_1.countOccurrencesOfSymbol(symbol_1.symbol(defs_1.MULTIPLY), nodeToCheck);
    const numberOfSums = count_1.countOccurrencesOfSymbol(symbol_1.symbol(defs_1.ADD), nodeToCheck);
    if (defs_1.DEBUG) {
        console.log(`     ... numberOfPowers: ${numberOfPowers}`);
        console.log(`     ... numberOfPIs: ${numberOfPIs}`);
        console.log(`     ... numberOfEs: ${numberOfEs}`);
        console.log(`     ... numberOfMults: ${numberOfMults}`);
        console.log(`     ... numberOfSums: ${numberOfSums}`);
    }
    if (numberOfPowers > 1 ||
        numberOfPIs > 0 ||
        numberOfEs > 0 ||
        numberOfMults > 1 ||
        numberOfSums > 1) {
        return run_1.stop('float: some unevalued parts in ' + nodeToCheck);
    }
}
// Runs an exact algorithm (roots, integral tables, ...) with float evaluation
// off and converts its result afterwards when it was asked for inside
// float(): those algorithms cannot match or factor float coefficients.
function evalExactly(f, p1) {
    const asFloats = defs_1.defs.evaluatingAsFloats;
    const result = defs_1.noFloats(f, p1);
    // an unevaluated call comes back as it is: converting it would evaluate
    // it again, without end
    if (!asFloats || (defs_1.iscons(result) && defs_1.car(result) === defs_1.car(p1))) {
        return result;
    }
    return zzfloat(result);
}
exports.evalExactly = evalExactly;
function zzfloat(p1) {
    defs_1.evalFloats(() => {
        //p1 = pop()
        //push(cadr(p1))
        //push(p1)
        p1 = eval_1.Eval(p1);
        p1 = yyfloat(p1);
        p1 = eval_1.Eval(p1); // normalize
    });
    return p1;
}
exports.zzfloat = zzfloat;
// zzfloat doesn't necessarily result in a double
// , for example if there are variables. But
// in many of the tests there should be indeed
// a float, this line comes handy to highlight
// when that doesn't happen for those tests.
//checkFloatHasWorkedOutCompletely(stack[tos-1])
function yyfloat(p1) {
    return defs_1.evalFloats(yyfloat_, p1);
}
exports.yyfloat = yyfloat;
function yyfloat_(p1) {
    if (defs_1.iscons(p1)) {
        return list_1.makeList(...p1.map(yyfloat_));
    }
    if (defs_1.istensor(p1)) {
        p1 = tensor_1.copy_tensor(p1);
        p1.tensor.elem = p1.tensor.elem.map(yyfloat_);
        return p1;
    }
    if (defs_1.isrational(p1)) {
        return bignum_1.bignum_float(p1);
    }
    if (p1 === symbol_1.symbol(defs_1.PI)) {
        return defs_1.Constants.piAsDouble;
    }
    if (p1 === symbol_1.symbol(defs_1.E)) {
        return bignum_1.double(Math.E);
    }
    if (p1 === symbol_1.symbol(defs_1.INF)) {
        return bignum_1.double(Infinity);
    }
    return p1;
}
