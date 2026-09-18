"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approxViolatesAssumptions = exports.violatesAssumptions = exports.Eval_assumptions = exports.Eval_forget = exports.Eval_assume = exports.Eval_isinteger = exports.Eval_isnonzero = exports.Eval_isnegative = exports.Eval_ispositive = exports.Eval_isreal = exports.isInteger = exports.isNonzero = exports.isNegative = exports.isPositive = exports.isReal = exports.allSymbolsReal = exports.facts = exports.withSign = exports.clearAssumptions = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const coeff_1 = require("./coeff");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const scan_1 = require("./scan");
const PROPERTIES = {
    real: { real: true },
    positive: { positive: true },
    negative: { negative: true },
    nonzero: { zero: false },
    integer: { integer: true },
    complex: { complex: true },
};
// by symbol name, so clearall (which recreates the symbols) can't leave
// stale entries; reset by clearAssumptions()
let assumptions = new Map();
function clearAssumptions() {
    assumptions = new Map();
}
exports.clearAssumptions = clearAssumptions;
// Runs f with the bound variable x temporarily assumed positive or
// negative (x -> inf in a limit is large and positive); what the user
// assumed about x is restored afterwards.
function withSign(x, sign, f) {
    if (!defs_1.issymbol(x)) {
        return f();
    }
    const name = x.printname;
    const old = assumptions.get(name);
    assumptions.set(name, close(PROPERTIES[sign]));
    try {
        return f();
    }
    finally {
        if (old === undefined) {
            assumptions.delete(name);
        }
        else {
            assumptions.set(name, old);
        }
    }
}
exports.withSign = withSign;
// ------------------------------------------------------------------ facts
// Adds the facts implied by the known ones; null on a contradiction.
function close(f) {
    const r = Object.assign({}, f);
    const set = (key, value) => {
        if (r[key] === !value) {
            return false;
        }
        r[key] = value;
        return true;
    };
    // repeat until nothing changes, the implications feed each other
    for (let changed = true; changed;) {
        const before = JSON.stringify(r);
        if (r.positive) {
            if (!set('real', true) || !set('negative', false) || !set('zero', false))
                return null;
        }
        if (r.negative) {
            if (!set('real', true) || !set('positive', false) || !set('zero', false))
                return null;
        }
        if (r.zero) {
            if (!set('real', true) || !set('integer', true) || !set('positive', false) || !set('negative', false))
                return null;
        }
        if (r.integer) {
            if (!set('real', true))
                return null;
        }
        if (r.complex && r.real) {
            return null;
        }
        if (r.real) {
            // a real number is exactly one of positive, negative, zero
            const known = [r.positive, r.negative, r.zero];
            if (known.filter((k) => k === false).length === 2) {
                const i = known.indexOf(undefined);
                if (i >= 0 && !set(['positive', 'negative', 'zero'][i], true))
                    return null;
            }
        }
        changed = JSON.stringify(r) !== before;
    }
    return r;
}
const merge = (a, b) => {
    for (const key of Object.keys(b)) {
        if (a[key] !== undefined && a[key] !== b[key]) {
            return null;
        }
    }
    return close(Object.assign(Object.assign({}, a), b));
};
const realFacts = (d) => close({ real: true, integer: Math.floor(d) === d, positive: d > 0, negative: d < 0, zero: d === 0 });
// Facts about an evaluated expression.
function facts(p) {
    var _a;
    if (defs_1.isrational(p)) {
        return close(Object.assign(Object.assign({}, realFacts(Math.sign(p.q.a.toJSNumber()))), { integer: is_1.isinteger(p) }));
    }
    if (defs_1.isdouble(p)) {
        return realFacts(p.d);
    }
    if (defs_1.issymbol(p)) {
        return symbolFacts(p);
    }
    if (defs_1.isadd(p)) {
        const f = sumFacts(p.tail().map(facts));
        if (f.positive === undefined && f.negative === undefined) {
            return (_a = close(Object.assign(Object.assign({}, f), quadraticFacts(p)))) !== null && _a !== void 0 ? _a : f;
        }
        return f;
    }
    if (defs_1.ismultiply(p)) {
        return productFacts(p.tail().map(facts));
    }
    if (defs_1.ispower(p)) {
        return powerFacts(defs_1.cadr(p), defs_1.caddr(p));
    }
    return functionFacts(p);
}
exports.facts = facts;
function symbolFacts(p) {
    var _a;
    if (p === symbol_1.symbol(defs_1.PI) || p === symbol_1.symbol(defs_1.E)) {
        return close({ positive: true });
    }
    const assumed = assumptions.get(p.printname);
    const realByDefault = !is_1.isZeroAtomOrTensor(symbol_1.get_binding(symbol_1.symbol(defs_1.ASSUME_REAL_VARIABLES))) &&
        isFreeVariable(p) &&
        !(assumed === null || assumed === void 0 ? void 0 : assumed.complex);
    const base = realByDefault ? { real: true } : {};
    return assumed ? (_a = close(Object.assign(Object.assign({}, base), assumed))) !== null && _a !== void 0 ? _a : assumed : base;
}
// every symbol in p is known to be real (for rules that treat symbols as
// real numbers, like conj(x) = x; not for a symbol assumed complex)
function allSymbolsReal(p) {
    const vars = [];
    symbol_1.collectUserSymbols(p, vars);
    return vars.every((v) => facts(v).real === true);
}
exports.allSymbolsReal = allSymbolsReal;
// a variable, not a named constant or a function
function isFreeVariable(p) {
    return symbol_1.get_binding(p) === p && p.keyword == null;
}
// exactly one part not real, all others real (and, for products, nonzero):
// then the whole is not real either
const oneNonReal = (parts, others) => parts.filter((t) => t.real === false).length === 1 &&
    parts.every((t) => t.real === false || others(t));
// a*x^2+b*x+c with numbers a, b, c and b^2-4ac < 0 has no real root, so
// for real x it has the sign of a (x^2+x+1 > 0)
function quadraticFacts(p) {
    const vars = [];
    symbol_1.collectUserSymbols(p, vars);
    const x = vars[0];
    if (vars.length !== 1 || facts(x).real !== true || !is_1.ispolyexpandedform(p, x)) {
        return {};
    }
    const k = coeff_1.coeff(p, x);
    if (k.length !== 3 || !k.every((c) => defs_1.isrational(c) || defs_1.isdouble(c))) {
        return {};
    }
    const [c, b, a] = k.map((n) => (defs_1.isdouble(n) ? n.d : n.q.a.toJSNumber() / n.q.b.toJSNumber()));
    if (b * b - 4 * a * c >= 0) {
        return {};
    }
    return a > 0 ? { positive: true } : { negative: true };
}
function sumFacts(terms) {
    var _a;
    const all = (key) => terms.every((t) => t[key] === true);
    const f = {};
    if (all('real'))
        f.real = true;
    if (oneNonReal(terms, (t) => t.real === true))
        f.real = false;
    if (all('integer'))
        f.integer = true;
    const nonnegative = terms.every((t) => t.negative === false && t.real);
    const nonpositive = terms.every((t) => t.positive === false && t.real);
    if (nonnegative && terms.some((t) => t.positive))
        f.positive = true;
    if (nonpositive && terms.some((t) => t.negative))
        f.negative = true;
    if (nonnegative)
        f.negative = false;
    if (nonpositive)
        f.positive = false;
    return (_a = close(f)) !== null && _a !== void 0 ? _a : {};
}
function productFacts(factors) {
    var _a, _b;
    const all = (key) => factors.every((t) => t[key] === true);
    const f = {};
    if (all('real'))
        f.real = true;
    if (oneNonReal(factors, (t) => t.real === true && t.zero === false))
        f.real = false;
    if (all('integer'))
        f.integer = true;
    if (factors.some((t) => t.zero)) {
        return (_a = close({ zero: true })) !== null && _a !== void 0 ? _a : {};
    }
    if (factors.every((t) => t.zero === false))
        f.zero = false;
    if (factors.every((t) => t.positive || t.negative)) {
        const negatives = factors.filter((t) => t.negative).length;
        f[negatives % 2 ? 'negative' : 'positive'] = true;
    }
    Object.assign(f, weakProductSign(factors));
    return (_b = close(f)) !== null && _b !== void 0 ? _b : {};
}
// factors each known >= 0 or <= 0 give a product known >= 0 or <= 0,
// e.g. -a^(1/2) <= 0 for a >= 0, and -a^2 <= 0 for real a
function weakProductSign(factors) {
    if (!factors.every((t) => t.real && (t.negative === false || t.positive === false))) {
        return {};
    }
    const nonpositive = factors.filter((t) => t.positive === false).length;
    return { real: true, [nonpositive % 2 ? 'positive' : 'negative']: false };
}
function powerFacts(base, exponent) {
    var _a, _b;
    const b = facts(base);
    const f = {};
    if (base === symbol_1.symbol(defs_1.E)) {
        // exp(u) is positive for real u and never 0
        const u = facts(exponent);
        return (_a = close(u.real ? { positive: true } : { zero: false })) !== null && _a !== void 0 ? _a : {};
    }
    if (b.zero === false)
        f.zero = false;
    if (defs_1.isrational(exponent)) {
        const num = exponent.q.a.toJSNumber();
        const den = exponent.q.b.toJSNumber();
        if (den === 1) {
            // integer powers of a real base are real; even ones are >= 0
            if (b.real)
                f.real = true;
            if (b.integer && num > 0)
                f.integer = true;
            if (b.positive)
                f.positive = true;
            if (b.real && num % 2 === 0)
                f.negative = false;
            if (b.negative && num % 2 !== 0)
                f.negative = true;
            if (num < 0 && b.zero === false)
                f.zero = false;
        }
        else if (b.positive) {
            f.positive = true;
        }
        else if (b.real && b.negative === false) {
            f.negative = false;
            f.real = true;
        }
        else if (b.negative && den % 2 === 0) {
            // (-a)^(1/2) and the like: imaginary
            f.real = false;
        }
    }
    else if (b.positive && facts(exponent).real) {
        f.positive = true;
    }
    return (_b = close(f)) !== null && _b !== void 0 ? _b : {};
}
function functionFacts(p) {
    var _a, _b;
    const f = defs_1.car(p);
    const arg = facts(defs_1.cadr(p));
    if (f === symbol_1.symbol(defs_1.ABS)) {
        return (_a = close({ real: true, negative: false, zero: arg.zero })) !== null && _a !== void 0 ? _a : {};
    }
    if (isRoundingFunction(f) && arg.real) {
        return { real: true, integer: true };
    }
    if (arg.real) {
        if (f === symbol_1.symbol(defs_1.COSH))
            return (_b = close({ positive: true })) !== null && _b !== void 0 ? _b : {};
        if ([defs_1.SIN, defs_1.COS, defs_1.SINH, defs_1.TANH, defs_1.ARCTAN, defs_1.ARCSINH].some((n) => f === symbol_1.symbol(n))) {
            return { real: true };
        }
    }
    if (f === symbol_1.symbol(defs_1.LOG) && arg.positive) {
        return { real: true };
    }
    return {};
}
// floor, ceiling and round give integers
function isRoundingFunction(f) {
    return [defs_1.FLOOR, defs_1.CEILING, defs_1.ROUND].some((n) => f === symbol_1.symbol(n));
}
// three-valued queries on an evaluated expression
const isReal = (p) => facts(p).real;
exports.isReal = isReal;
const isPositive = (p) => facts(p).positive;
exports.isPositive = isPositive;
const isNegative = (p) => facts(p).negative;
exports.isNegative = isNegative;
const isNonzero = (p) => (facts(p).zero === undefined ? undefined : !facts(p).zero);
exports.isNonzero = isNonzero;
const isInteger = (p) => facts(p).integer;
exports.isInteger = isInteger;
// ---------------------------------------------------------- user functions
const answer = (value, call, arg) => value === undefined
    ? list_1.makeList(defs_1.car(call), arg)
    : value
        ? defs_1.Constants.one
        : defs_1.Constants.zero;
function Eval_isreal(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return answer(exports.isReal(arg), p1, arg);
}
exports.Eval_isreal = Eval_isreal;
function Eval_ispositive(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return answer(exports.isPositive(arg), p1, arg);
}
exports.Eval_ispositive = Eval_ispositive;
function Eval_isnegative(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return answer(exports.isNegative(arg), p1, arg);
}
exports.Eval_isnegative = Eval_isnegative;
function Eval_isnonzero(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return answer(exports.isNonzero(arg), p1, arg);
}
exports.Eval_isnonzero = Eval_isnonzero;
function Eval_isinteger(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return answer(exports.isInteger(arg), p1, arg);
}
exports.Eval_isinteger = Eval_isinteger;
// assume(x, property) or assume(relation, ...): relations are read
// unevaluated, so x > 0 is taken apart and not tested
function Eval_assume(p1) {
    const args = p1.tail();
    if (args.length === 2 && defs_1.issymbol(args[1]) && !isRelation(args[1])) {
        const name = args[1].printname;
        if (!(name in PROPERTIES)) {
            run_1.stop(`assume: unknown property ${name}, use real, positive, negative, nonzero, integer or complex`);
        }
        addAssumption(args[0], PROPERTIES[name]);
    }
    else {
        for (const relation of args) {
            const [x, f] = parseRelation(relation);
            addAssumption(x, f);
        }
    }
    return symbol_1.symbol(defs_1.NIL);
}
exports.Eval_assume = Eval_assume;
function isRelation(p) {
    return [defs_1.TESTGT, defs_1.TESTGE, defs_1.TESTLT, defs_1.TESTLE, defs_1.NOT].some((n) => defs_1.car(p) === symbol_1.symbol(n));
}
// x > 0, x >= 0, x < 0, x <= 0, x != 0 (also 0 < x and so on)
function parseRelation(p) {
    const flip = { [defs_1.TESTGT]: defs_1.TESTLT, [defs_1.TESTGE]: defs_1.TESTLE, [defs_1.TESTLT]: defs_1.TESTGT, [defs_1.TESTLE]: defs_1.TESTGE };
    let op = defs_1.car(p);
    let lhs = defs_1.cadr(p);
    let rhs = defs_1.caddr(p);
    if (op === symbol_1.symbol(defs_1.NOT) && defs_1.car(defs_1.cadr(p)) === symbol_1.symbol(defs_1.TESTEQ)) {
        [op, lhs, rhs] = [symbol_1.symbol(defs_1.TESTEQ), defs_1.cadr(defs_1.cadr(p)), defs_1.caddr(defs_1.cadr(p))];
    }
    if (is_1.isZeroAtomOrTensor(lhs) && defs_1.issymbol(op) && flip[op.printname]) {
        [op, lhs, rhs] = [symbol_1.symbol(flip[op.printname]), rhs, lhs];
    }
    const byOp = {
        [defs_1.TESTGT]: { positive: true },
        [defs_1.TESTGE]: { real: true, negative: false },
        [defs_1.TESTLT]: { negative: true },
        [defs_1.TESTLE]: { real: true, positive: false },
        [defs_1.TESTEQ]: { zero: false },
    };
    if (!defs_1.issymbol(op) || !byOp[op.printname] || !is_1.isZeroAtomOrTensor(eval_1.Eval(rhs))) {
        run_1.stop('assume: use x > 0, x >= 0, x < 0, x <= 0, x != 0 or assume(x, property)');
    }
    return [lhs, byOp[op.printname]];
}
function addAssumption(x, f) {
    var _a;
    if (!defs_1.issymbol(x)) {
        run_1.stop(`assume: ${x} is not a symbol`);
    }
    const old = (_a = assumptions.get(x.printname)) !== null && _a !== void 0 ? _a : {};
    const merged = merge(old, f);
    if (merged === null) {
        run_1.stop(`assume: ${x} can not be ${describe(f)}, it is already assumed ${describe(old)}`);
    }
    assumptions.set(x.printname, merged);
}
// the facts as user-level property names, leaving out implied ones
function describe(f) {
    const names = [];
    if (f.complex)
        names.push('complex');
    if (f.real && !f.integer && !f.positive && !f.negative)
        names.push('real');
    if (f.integer)
        names.push('integer');
    if (f.positive)
        names.push('positive');
    else if (f.negative)
        names.push('negative');
    else {
        if (f.negative === false)
            names.push('nonnegative');
        if (f.positive === false)
            names.push('nonpositive');
        if (f.zero === false)
            names.push('nonzero');
    }
    return names.join(', ');
}
function Eval_forget(p1) {
    const args = p1.tail();
    if (args.length === 0) {
        clearAssumptions();
    }
    for (const x of args) {
        if (!defs_1.issymbol(x)) {
            run_1.stop(`forget: ${x} is not a symbol`);
        }
        assumptions.delete(x.printname);
    }
    return symbol_1.symbol(defs_1.NIL);
}
exports.Eval_forget = Eval_forget;
function Eval_assumptions() {
    if (assumptions.size === 0) {
        return symbol_1.symbol(defs_1.NIL);
    }
    const lines = [...assumptions.keys()]
        .sort()
        .map((name) => new defs_1.Str(`${name}: ${describe(assumptions.get(name))}`));
    return scan_1.build_tensor(lines);
}
exports.Eval_assumptions = Eval_assumptions;
// ------------------------------------------------- solutions of equations
// Whether a candidate value for x is known to violate the assumptions
// made explicitly about x. The default realness of symbols doesn't count:
// solve(x^2+1,x) keeps its complex roots unless x is assumed real.
function violatesAssumptions(value, x) {
    return violatedBy(facts(value), x);
}
exports.violatesAssumptions = violatesAssumptions;
// the same for an approximate number re + i*im (nroots, nsolve): parts
// within 1e-6 of an integer are taken as that integer
// ponytail: fixed tolerance, pass one in if a caller needs another
function approxViolatesAssumptions(re, im, x) {
    const snap = (d) => Math.abs(d - Math.round(d)) <= 1e-6 * Math.max(1, Math.abs(d)) ? Math.round(d) : d;
    const f = snap(im) === 0 ? realFacts(snap(re)) : { real: false, zero: false };
    return violatedBy(f, x);
}
exports.approxViolatesAssumptions = approxViolatesAssumptions;
function violatedBy(f, x) {
    const assumed = defs_1.issymbol(x) ? assumptions.get(x.printname) : undefined;
    return assumed !== undefined && merge(assumed, f) === null;
}
