"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalNot = exports.evalLogic = exports.simplifyComparison = exports.comparable = exports.isLogical = void 0;
const count_1 = require("../runtime/count");
const defs_1 = require("../runtime/defs");
const find_1 = require("../runtime/find");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const assume_1 = require("./assume");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const float_1 = require("./float");
const gcd_1 = require("./gcd");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const solve_inequality_1 = require("./solve_inequality");
const subst_1 = require("./subst");
const test_1 = require("./test");
// Simplification of comparisons, and/or/not. All of it runs in the evaluator:
// every rule here holds for every real value (1 = always true, 0 = never, as
// in solve). Nothing is done to operands without an order: tensors, strings,
// imaginary parts, symbols assumed complex.
// the comparison with its sides exchanged, and its negation (tables built
// on use: the names are not there yet while the modules load)
const flip = (op) => ({ [defs_1.TESTLT]: defs_1.TESTGT, [defs_1.TESTGT]: defs_1.TESTLT, [defs_1.TESTLE]: defs_1.TESTGE, [defs_1.TESTGE]: defs_1.TESTLE, [defs_1.TESTEQ]: defs_1.TESTEQ }[op]);
const negated = (op) => ({ [defs_1.TESTLT]: defs_1.TESTGE, [defs_1.TESTGE]: defs_1.TESTLT, [defs_1.TESTGT]: defs_1.TESTLE, [defs_1.TESTLE]: defs_1.TESTGT }[op]);
const opName = (p) => (defs_1.issymbol(defs_1.car(p)) ? defs_1.car(p).printname : '');
const isComparison = (p) => flip(opName(p)) !== undefined;
const isLogical = (p) => isComparison(p) || [defs_1.AND, defs_1.OR, defs_1.NOT].includes(opName(p));
exports.isLogical = isLogical;
function comparable(...sides) {
    return sides.every((s) => !defs_1.istensor(s) && !defs_1.isstr(s) && !find_1.Find(s, defs_1.Constants.imaginaryunit) && assume_1.allSymbolsReal(s));
}
exports.comparable = comparable;
const termsOf = (p) => (defs_1.isadd(p) ? p.tail() : [p]);
const coefficient = (t) => (defs_1.ismultiply(t) && defs_1.isNumericAtom(defs_1.cadr(t)) ? defs_1.cadr(t) : defs_1.Constants.one);
// An undecided comparison of evaluated sides: lhs-rhs is divided by its
// common factors of known sign (a negative one turns the relation, an
// equation only needs them nonzero) and by its numeric content, positive
// terms go to the left, the others to the right. x+y>y is x>0, -x<3 is
// x>-3, a*x>a is x>1 only for a known sign of a. The result is taken when it
// is smaller; a comparison that is solved for a symbol stays as it is.
function simplifyComparison(op, lhs, rhs) {
    const asTyped = list_1.makeList(symbol_1.symbol(op), lhs, rhs);
    const solvedFor = (a, b) => defs_1.issymbol(a) && !find_1.Find(b, a);
    if (!comparable(lhs, rhs) || solvedFor(lhs, rhs) || solvedFor(rhs, lhs)) {
        return asTyped;
    }
    let terms = termsOf(add_1.subtract(lhs, rhs));
    // ponytail: gcd of at most 8 terms, it factors polynomials (exact ones)
    if (terms.length <= 8 && !terms.some((t) => defs_1.isNumericAtom(t) || is_1.isfloating(t))) {
        const g = terms.reduce(gcd_1.gcd);
        for (const f of defs_1.ismultiply(g) ? g.tail() : [g]) {
            const known = defs_1.isNumericAtom(f) ? {} : assume_1.facts(f);
            if (op === defs_1.TESTEQ ? known.zero === false : known.positive || known.negative) {
                terms = termsOf(add_1.add_all(terms.map((t) => multiply_1.divide(t, f))));
                op = known.negative ? flip(op) : op;
            }
        }
    }
    // the numeric content, negative when no term is positive
    const rest = terms.filter((t) => !defs_1.isNumericAtom(t));
    const coeffs = rest.map(coefficient);
    let k = defs_1.Constants.one;
    if (rest.length === 1) {
        k = is_1.isnegativenumber(coeffs[0]) ? multiply_1.negate(coeffs[0]) : coeffs[0];
    }
    else if (coeffs.length > 0 && coeffs.every(defs_1.isrational)) {
        k = coeffs.reduce(bignum_1.gcd_numbers);
    }
    if (coeffs.length > 0 && coeffs.every(is_1.isnegativenumber)) {
        k = multiply_1.negate(k);
        op = flip(op);
    }
    // a lone term loses its coefficient k (0.5*x/0.5 would be 1.0*x)
    terms = terms.map((t) => rest.length === 1 && t === rest[0] && defs_1.ismultiply(t) && defs_1.isNumericAtom(defs_1.cadr(t))
        ? multiply_1.multiply_all(t.tail().slice(1))
        : multiply_1.divide(t, k));
    const left = terms.filter((t) => !defs_1.isNumericAtom(t) && !is_1.isnegativenumber(coefficient(t)));
    const right = terms.filter((t) => !left.includes(t)).map(multiply_1.negate);
    const candidate = list_1.makeList(symbol_1.symbol(op), add_1.add_all(left), add_1.add_all(right));
    return count_1.count(candidate) < count_1.count(asTyped) ? eval_1.Eval(candidate) : asTyped;
}
exports.simplifyComparison = simplifyComparison;
// 1/0 or the unknown parts of and(...)/or(...): nested calls are flattened,
// decided and repeated parts dropped, and the comparisons of one variable
// with numeric bounds are joined on the number line.
function evalLogic(p1, isAnd) {
    const op = defs_1.car(p1);
    const absorbing = isAnd ? defs_1.Constants.zero : defs_1.Constants.one;
    let parts = [];
    for (const arg of defs_1.iscons(p1) ? p1.tail() : []) {
        const value = eval_1.Eval_predicate(arg);
        for (const part of defs_1.car(value) === op && defs_1.iscons(value) ? value.tail() : [value]) {
            const truth = is_1.isZeroLikeOrNonZeroLikeOrUndetermined(part);
            if (truth === !isAnd) {
                return absorbing;
            }
            if (truth == null && !parts.some((q) => misc_1.equal(q, part))) {
                parts.push(part);
            }
        }
    }
    const joined = numberLine(parts, isAnd);
    if (joined === undefined) {
        return absorbing;
    }
    parts = joined;
    if (parts.length === 0) {
        return isAnd ? defs_1.Constants.one : defs_1.Constants.zero;
    }
    return parts.length === 1 ? parts[0] : list_1.makeList(op, ...parts);
}
exports.evalLogic = evalLogic;
// not(...) of a comparison is the opposite comparison, of and/or of
// comparisons the or/and of the opposites; x!=1 stays not(x==1).
function evalNot(p1) {
    var _a;
    const arg = eval_1.Eval_predicate(defs_1.cadr(p1));
    const truth = is_1.isZeroLikeOrNonZeroLikeOrUndetermined(arg);
    if (truth != null) {
        return truth ? defs_1.Constants.zero : defs_1.Constants.one;
    }
    return (_a = negation(arg)) !== null && _a !== void 0 ? _a : list_1.makeList(symbol_1.symbol(defs_1.NOT), arg);
}
exports.evalNot = evalNot;
function negation(p) {
    const name = opName(p);
    if (name === defs_1.NOT) {
        return exports.isLogical(defs_1.cadr(p)) ? defs_1.cadr(p) : undefined;
    }
    if (isComparison(p)) {
        if (!comparable(defs_1.cadr(p), defs_1.caddr(p))) {
            return undefined;
        }
        return name === defs_1.TESTEQ
            ? list_1.makeList(symbol_1.symbol(defs_1.NOT), p)
            : list_1.makeList(symbol_1.symbol(negated(name)), defs_1.cadr(p), defs_1.caddr(p));
    }
    if ((name === defs_1.AND || name === defs_1.OR) && defs_1.iscons(p)) {
        const parts = p.tail().map(negation);
        if (parts.every((q) => q !== undefined)) {
            return eval_1.Eval(list_1.makeList(symbol_1.symbol(name === defs_1.AND ? defs_1.OR : defs_1.AND), ...parts));
        }
    }
    return undefined;
}
function condition(p) {
    const name = opName(p);
    if (isComparison(p)) {
        return linearComparison(name, defs_1.cadr(p), defs_1.caddr(p));
    }
    if ([defs_1.AND, defs_1.OR, defs_1.NOT].includes(name) && defs_1.iscons(p)) {
        const parts = p.tail().map(condition);
        if (parts.every((q) => q !== undefined && q.x === parts[0].x)) {
            return { x: parts[0].x, op: name, parts };
        }
    }
    return undefined;
}
// s*x + c op 0 with numbers s and c: x op -c/s, turned for a negative s
function linearComparison(op, lhs, rhs) {
    if (!comparable(lhs, rhs)) {
        return undefined;
    }
    const E = add_1.subtract(lhs, rhs);
    const vars = [];
    symbol_1.collectUserSymbols(E, vars);
    if (vars.length !== 1 || !is_1.ispolyexpandedform(E, vars[0])) {
        return undefined;
    }
    const x = vars[0];
    const c = eval_1.Eval(subst_1.subst(E, x, defs_1.Constants.zero));
    const s = add_1.subtract(eval_1.Eval(subst_1.subst(E, x, defs_1.Constants.one)), c);
    const sign = test_1.cmp_values(s, defs_1.Constants.zero);
    if (!sign || !is_1.isZeroAtomOrTensor(add_1.subtract(E, add_1.add(multiply_1.multiply(s, x), c)))) {
        return undefined; // no x left, or not linear
    }
    const bound = multiply_1.divide(multiply_1.negate(c), s);
    const value = float_1.zzfloat(bound);
    if (!defs_1.isdouble(value) || !Number.isFinite(value.d)) {
        return undefined;
    }
    return { x, op: sign < 0 ? flip(op) : op, bound };
}
const leaves = (c) => c.parts ? c.parts.reduce((acc, q) => acc.concat(leaves(q)), []) : [c];
// on segment i of the line cut at the bounds: even i is the open interval
// below bound i/2, odd i is bound (i-1)/2 itself
function holds(c, i) {
    switch (c.op) {
        case defs_1.AND:
            return c.parts.every((q) => holds(q, i));
        case defs_1.OR:
            return c.parts.some((q) => holds(q, i));
        case defs_1.NOT:
            return !holds(c.parts[0], i);
    }
    const sign = Math.sign(i - (2 * c.index + 1));
    return {
        [defs_1.TESTLT]: sign < 0,
        [defs_1.TESTLE]: sign <= 0,
        [defs_1.TESTGT]: sign > 0,
        [defs_1.TESTGE]: sign >= 0,
        [defs_1.TESTEQ]: sign === 0
    }[c.op];
}
// The parts with two or more conditions on the same variable replaced by
// their normal form (the one of solve: pieces from left to right), at the
// place of the first one. undefined when and(...) became 0 or or(...) 1.
function numberLine(parts, isAnd) {
    const conditions = parts.map(condition);
    const result = [];
    for (let i = 0; i < parts.length; i++) {
        const group = conditions.filter((c) => { var _a; return c && c.x === ((_a = conditions[i]) === null || _a === void 0 ? void 0 : _a.x); });
        if (group.length < 2) {
            result.push(parts[i]);
            continue;
        }
        if (group[0] !== conditions[i]) {
            continue; // joined into the first of its group
        }
        const joined = joinConditions(group, isAnd);
        if (joined === undefined) {
            result.push(...parts.filter((_, j) => group.includes(conditions[j])));
        }
        else if (defs_1.isNumericAtom(joined)) {
            if (is_1.isZeroAtomOrTensor(joined) === isAnd) {
                return undefined;
            }
        }
        else {
            const same = opName(joined) === (isAnd ? defs_1.AND : defs_1.OR);
            result.push(...(same && defs_1.iscons(joined) ? joined.tail() : [joined]));
        }
    }
    return result;
}
function joinConditions(group, isAnd) {
    const all = group.reduce((acc, c) => acc.concat(leaves(c)), []);
    let ordered = true;
    const compare = (a, b) => {
        const sign = test_1.cmp_values(a, b);
        ordered = ordered && sign != null;
        return sign !== null && sign !== void 0 ? sign : 0;
    };
    const sorted = all.map((c) => c.bound).sort(compare);
    const pts = sorted.filter((b, i) => i === 0 || compare(sorted[i - 1], b) !== 0);
    for (const c of all) {
        c.index = pts.findIndex((b) => compare(b, c.bound) === 0);
    }
    if (!ordered) {
        return undefined;
    }
    const segments = [];
    for (let i = 0; i <= 2 * pts.length; i++) {
        segments.push(isAnd ? group.every((c) => holds(c, i)) : group.some((c) => holds(c, i)));
    }
    return solve_inequality_1.joinPieces(group[0].x, pts, segments);
}
