"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.cmp_values = exports.Eval_or = exports.Eval_and = exports.Eval_not = exports.Eval_testlt = exports.Eval_testle = exports.Eval_testgt = exports.Eval_testge = exports.Eval_testeq = exports.Eval_test = void 0;
const assume_1 = require("./assume");
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const eval_1 = require("./eval");
const is_1 = require("./is");
const find_1 = require("../runtime/find");
const logic_simplify_1 = require("./logic_simplify");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const quantity_1 = require("./quantity");
const simplify_1 = require("./simplify");
// If the number of args is odd then the last arg is the default result.
// Works like a switch statement. Could also be used for piecewise
// functions? TODO should probably be called "switch"?
function Eval_test(p1) {
    const orig = p1;
    p1 = defs_1.cdr(p1);
    while (defs_1.iscons(p1)) {
        // odd number of parameters means that the
        // last argument becomes the default case
        // i.e. the one without a test.
        if (defs_1.cdr(p1) === symbol_1.symbol(defs_1.NIL)) {
            return eval_1.Eval(defs_1.car(p1)); // default case
        }
        const checkResult = is_1.isZeroLikeOrNonZeroLikeOrUndetermined(defs_1.car(p1));
        if (checkResult == null) {
            // we couldn't determine the result
            // of a test. This means we can't conclude
            // anything about the result of the
            // overall test, so we must bail
            // with the unevalled test
            return orig;
        }
        else if (checkResult) {
            // test succesful, we found out output
            return eval_1.Eval(defs_1.cadr(p1));
        }
        else {
            // test unsuccessful, continue to the
            // next pair of test,value
            p1 = defs_1.cddr(p1);
        }
    }
    // no test matched and there was no
    // catch-all case, so we return zero.
    return defs_1.Constants.zero;
}
exports.Eval_test = Eval_test;
// we test A==B by first subtracting and checking if we symbolically
// get zero. If not, we evaluate to float and check if we get a zero.
// If we get another NUMBER then we know they are different.
// If we get something else, then we don't know and we return the
// unaveluated test, which is the same as saying "maybe".
function Eval_testeq(p1) {
    const lhs = eval_1.Eval(defs_1.cadr(p1));
    const rhs = eval_1.Eval(defs_1.caddr(p1));
    // identical sides: no need to subtract (and inf-inf is indeterminate)
    if (misc_1.equal(lhs, rhs)) {
        return defs_1.Constants.one;
    }
    // first try without simplifyng both sides
    let subtractionResult = add_1.subtract(lhs, rhs);
    // OK so we are doing something tricky here
    // we are using isZeroLikeOrNonZeroLikeOrUndetermined to check if the result
    // is zero or not zero or unknown.
    // isZeroLikeOrNonZeroLikeOrUndetermined has some routines
    // to determine the zero-ness/non-zero-ness or
    // undeterminate-ness of things so we use
    // that here and down below.
    let checkResult = is_1.isZeroLikeOrNonZeroLikeOrUndetermined(subtractionResult);
    if (checkResult) {
        return defs_1.Constants.zero;
    }
    else if (checkResult != null && !checkResult) {
        return defs_1.Constants.one;
    }
    // we didn't get a simple numeric result but
    // let's try again after doing
    // a simplification on both sides
    const arg1 = simplify_1.simplify(eval_1.Eval(defs_1.cadr(p1)));
    const arg2 = simplify_1.simplify(eval_1.Eval(defs_1.caddr(p1)));
    subtractionResult = add_1.subtract(arg1, arg2);
    checkResult = is_1.isZeroLikeOrNonZeroLikeOrUndetermined(subtractionResult);
    if (checkResult) {
        return defs_1.Constants.zero;
    }
    else if (checkResult != null && !checkResult) {
        return defs_1.Constants.one;
    }
    // known to differ from the assumptions
    if (assume_1.facts(subtractionResult).zero === false) {
        return defs_1.Constants.zero;
    }
    // if we didn't get to a number then we
    // don't know whether the quantities are
    // different: the equation comes back simplified
    return logic_simplify_1.simplifyComparison(defs_1.TESTEQ, lhs, rhs);
}
exports.Eval_testeq = Eval_testeq;
// Relational operators: decided by the sign of the operand difference (a
// number, or known from the assumptions, also as "not negative" for >= and
// <), otherwise the comparison comes back simplified (logic_simplify.ts).
function Eval_relation(p1) {
    const name = defs_1.car(p1).printname;
    const lhs = eval_1.Eval(defs_1.cadr(p1));
    const rhs = eval_1.Eval(defs_1.caddr(p1));
    const { sign, known } = compare(lhs, rhs);
    const holds = (s) => ({ [defs_1.TESTGE]: s >= 0, [defs_1.TESTGT]: s > 0, [defs_1.TESTLE]: s <= 0, [defs_1.TESTLT]: s < 0 }[name]);
    if (sign != null) {
        return holds(sign) ? defs_1.Constants.one : defs_1.Constants.zero;
    }
    // a difference known to be >= 0 (or <= 0) decides when 0 and 1 (or -1) agree
    const weak = known.negative === false ? 1 : known.positive === false ? -1 : 0;
    if (weak !== 0 && holds(0) === holds(weak)) {
        return holds(0) ? defs_1.Constants.one : defs_1.Constants.zero;
    }
    return logic_simplify_1.simplifyComparison(name, lhs, rhs);
}
exports.Eval_testge = Eval_relation;
exports.Eval_testgt = Eval_relation;
exports.Eval_testle = Eval_relation;
exports.Eval_testlt = Eval_relation;
// not, and, or: see logic_simplify.ts
function Eval_not(p1) {
    return logic_simplify_1.evalNot(p1);
}
exports.Eval_not = Eval_not;
function Eval_and(p1) {
    return logic_simplify_1.evalLogic(p1, true);
}
exports.Eval_and = Eval_and;
function Eval_or(p1) {
    return logic_simplify_1.evalLogic(p1, false);
}
exports.Eval_or = Eval_or;
// Sign of arg1 - arg2 (both already evaluated), or null when undecidable.
function cmp_values(arg1, arg2) {
    return compare(arg1, arg2).sign;
}
exports.cmp_values = cmp_values;
// inf: 1, -inf: -1
const infinite = (p) => p === symbol_1.symbol(defs_1.INF) ? 1 : misc_1.equal(p, multiply_1.negate(symbol_1.symbol(defs_1.INF))) ? -1 : 0;
// The sign of arg1 - arg2, and with a null sign what the assumptions say
// about the difference (it may still be known not to be negative).
function compare(arg1, arg2) {
    // identical arguments: no need to subtract (and inf-inf is indeterminate)
    if (misc_1.equal(arg1, arg2)) {
        return { sign: 0, known: {} };
    }
    // an infinity against a real value
    const finite = (p) => !find_1.Find(p, symbol_1.symbol(defs_1.INF)) && logic_simplify_1.comparable(p) && assume_1.facts(p).real === true;
    if (infinite(arg1) !== infinite(arg2) &&
        [arg1, arg2].every((p) => infinite(p) !== 0 || finite(p))) {
        return { sign: infinite(arg1) > infinite(arg2) ? 1 : -1, known: {} };
    }
    let p1 = add_1.subtract(simplify_1.simplify(arg1), simplify_1.simplify(arg2));
    // same-dimension quantities subtract to a quantity (incompatible ones
    // already stopped inside subtract) — its sign is the magnitude's sign
    if (quantity_1.isQuantity(p1)) {
        p1 = defs_1.cadr(p1);
    }
    if (is_1.isZeroAtomOrTensor(p1)) {
        return { sign: 0, known: {} };
    }
    if (p1.k === defs_1.NUM) {
        return { sign: defs_1.MSIGN(p1.q.a) === -1 ? -1 : 1, known: {} };
    }
    if (p1.k === defs_1.DOUBLE) {
        return { sign: p1.d < 0.0 ? -1 : 1, known: {} };
    }
    // the sign may be known from the assumptions
    const known = assume_1.facts(p1);
    let t = known.positive ? 1 : known.negative ? -1 : known.zero ? 0 : null;
    // Two constants: by the certified sign of the difference, never by its
    // double (sqrt(10^20+1)-10^10 is 0.0 there; facts() only asks for it when
    // the rules say real, arccos(1/3)-1 is not among those). Equal only with a
    // proof, the difference simplifies to 0; what is neither stays undecided.
    if (t === null && !assume_1.hasSymbol(p1)) {
        t = (assume_1.constantSign(p1) || (is_1.isZeroAtomOrTensor(simplify_1.simplify(p1)) ? 0 : null));
    }
    return { sign: t, known };
}
exports.compare = compare;
