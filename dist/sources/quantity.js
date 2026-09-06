"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_dimensionof = exports.Eval_convert = exports.Eval_units = exports.Eval_quantity = exports.addQuantities = exports.powerUnitAware = exports.multiplyUnitAware = exports.makeQuantity = exports.isQuantity = exports.dimsEqual = exports.scaleDims = exports.subDims = exports.addDims = void 0;
const alloc_1 = require("../runtime/alloc");
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const power_1 = require("./power");
const unit_1 = require("./unit");
// Dimension vector arithmetic — plain number[] of length DIM_COUNT.
function addDims(a, b) {
    return a.map((v, i) => v + b[i]);
}
exports.addDims = addDims;
function subDims(a, b) {
    return a.map((v, i) => v - b[i]);
}
exports.subDims = subDims;
function scaleDims(a, k) {
    return a.map((v) => v * k);
}
exports.scaleDims = scaleDims;
function dimsEqual(a, b) {
    return a.every((v, i) => v === b[i]);
}
exports.dimsEqual = dimsEqual;
function dimToNum(n) {
    if (Number.isInteger(n)) {
        return bignum_1.integer(n);
    }
    // small-denominator reconstruction, covers the realistic cases (halves,
    // thirds, quarters, ...) coming out of e.g. sqrt(unit) without going
    // through a full continued-fraction search
    for (let denom = 2; denom <= 12; denom++) {
        const numer = n * denom;
        if (Math.abs(numer - Math.round(numer)) < 1e-9) {
            return bignum_1.rational(Math.round(numer), denom);
        }
    }
    return bignum_1.rational(Math.round(n * 1e6), 1e6);
}
function dimToTensor(dim) {
    const t = alloc_1.alloc_tensor(unit_1.DIM_COUNT);
    t.tensor.ndim = 1;
    t.tensor.dim[0] = unit_1.DIM_COUNT;
    for (let i = 0; i < unit_1.DIM_COUNT; i++) {
        t.tensor.elem[i] = dimToNum(dim[i]);
    }
    return t;
}
function dimArrayOf(dimValue) {
    const t = dimValue;
    return t.tensor.elem.map((e) => bignum_1.nativeDouble(e));
}
// The istensor(caddr(p)) check matters: scan.ts's "1/x" handling calls
// inverse()/power() directly on a freshly-parsed, not-yet-evaluated factor,
// so a raw user call like quantity(3, s) — caddr still the bare unit
// symbol, not yet resolved to a dimension tensor — can reach here before
// Eval_quantity ever normalizes it. Without this check that's misread as
// the internal form and crashes reading a Tensor field off a Sym.
function isQuantity(p) {
    return defs_1.iscons(p) && defs_1.car(p) === symbol_1.symbol(defs_1.QUANTITY) && defs_1.istensor(defs_1.caddr(p));
}
exports.isQuantity = isQuantity;
// Builds a Quantity value, or collapses to the bare (already SI-normalized)
// magnitude when the dimension has fully cancelled out (e.g. m/m).
function makeQuantity(magnitude, dim) {
    if (dimsEqual(dim, unit_1.ZERO_DIM)) {
        return magnitude;
    }
    return list_1.makeList(symbol_1.symbol(defs_1.QUANTITY), magnitude, dimToTensor(dim));
}
exports.makeQuantity = makeQuantity;
// A bare unit *symbol* (m, kg, ...) only classifies as unit-bearing when
// unit auto-detection is on (defs.unitsAutoDetect) or the value already is
// a Quantity (built via quantity() or a prior auto-detected operation) —
// this is what keeps existing scripts using m/s/N/... as plain variables
// unaffected by default. See the "Zwei Modi" section of the units plan.
function classify(p, allowSymbolAutoDetect) {
    if (isQuantity(p)) {
        return { magnitude: defs_1.cadr(p), dim: dimArrayOf(defs_1.caddr(p)) };
    }
    if (allowSymbolAutoDetect && defs_1.issymbol(p) && p.unitDef) {
        const def = p.unitDef;
        return { magnitude: def.scale, dim: def.dim };
    }
    if (defs_1.isNumericAtom(p)) {
        return 'numeric';
    }
    return 'other';
}
// undefined means "not our concern, fall through to ordinary multiply".
function multiplyUnitAware(p1, p2) {
    const allow = defs_1.defs.unitsAutoDetect;
    const c1 = classify(p1, allow);
    const c2 = classify(p2, allow);
    if (c1 === 'other' || c2 === 'other') {
        return undefined;
    }
    if (c1 === 'numeric' && c2 === 'numeric') {
        return undefined;
    }
    const mag1 = c1 === 'numeric' ? p1 : c1.magnitude;
    const dim1 = c1 === 'numeric' ? unit_1.ZERO_DIM : c1.dim;
    const mag2 = c2 === 'numeric' ? p2 : c2.magnitude;
    const dim2 = c2 === 'numeric' ? unit_1.ZERO_DIM : c2.dim;
    return makeQuantity(bignum_1.multiply_numbers(mag1, mag2), addDims(dim1, dim2));
}
exports.multiplyUnitAware = multiplyUnitAware;
// undefined means "not our concern, fall through to ordinary power".
function powerUnitAware(base, exponent) {
    const c = classify(base, defs_1.defs.unitsAutoDetect);
    if (c === 'other' || c === 'numeric' || !defs_1.isNumericAtom(exponent)) {
        return undefined;
    }
    const newDim = scaleDims(c.dim, bignum_1.nativeDouble(exponent));
    const newMag = power_1.power(c.magnitude, exponent);
    return makeQuantity(newMag, newDim);
}
exports.powerUnitAware = powerUnitAware;
// undefined means "no quantity involved, fall through to ordinary add".
// Not gated by unitsAutoDetect: this only ever fires on terms that are
// already Quantity values, which can't exist without quantity() or a
// gated auto-detected multiply/power having produced them first.
function addQuantities(terms) {
    const quantityTerms = terms.filter(isQuantity);
    if (quantityTerms.length === 0) {
        return undefined;
    }
    const dim = dimArrayOf(defs_1.caddr(quantityTerms[0]));
    for (const t of terms) {
        if (isQuantity(t)) {
            const otherDim = dimArrayOf(defs_1.caddr(t));
            if (!dimsEqual(otherDim, dim)) {
                run_1.stop(`incompatible units: cannot add ${unit_1.formatDimension(dim)} and ${unit_1.formatDimension(otherDim)}`);
            }
        }
        else if (!is_1.isZeroAtom(t)) {
            run_1.stop(`incompatible units: cannot add ${unit_1.formatDimension(dim)} and a dimensionless value`);
        }
    }
    let sum = defs_1.Constants.Zero();
    for (const t of terms) {
        if (isQuantity(t)) {
            sum = bignum_1.add_numbers(sum, defs_1.cadr(t));
        }
    }
    return makeQuantity(sum, dim);
}
exports.addQuantities = addQuantities;
// quantity(value, unit): explicit constructor, always available regardless
// of units(). Also doubles as the self-eval handler for an already-built
// (quantity magnitude dimTensor) internal form, since both go through the
// same 'quantity' keyword.
//
// The unit argument can be a bare unit symbol (m), a compound unit
// expression (s/kg, m/s^2, ...), or an already-built quantity — evaluated
// with unit auto-detection forced on so a compound expression resolves
// correctly even when units() is off; that's local to this one argument
// and doesn't leak into the ambient mode.
function Eval_quantity(p1) {
    const magnitude = eval_1.Eval(defs_1.cadr(p1));
    const savedAutoDetect = defs_1.defs.unitsAutoDetect;
    defs_1.defs.unitsAutoDetect = true;
    let unitArg;
    try {
        unitArg = eval_1.Eval(defs_1.caddr(p1));
    }
    finally {
        defs_1.defs.unitsAutoDetect = savedAutoDetect;
    }
    if (defs_1.istensor(unitArg)) {
        return makeQuantity(magnitude, dimArrayOf(unitArg));
    }
    if (isQuantity(unitArg)) {
        const scale = defs_1.cadr(unitArg);
        return makeQuantity(bignum_1.multiply_numbers(magnitude, scale), dimArrayOf(defs_1.caddr(unitArg)));
    }
    if (defs_1.issymbol(unitArg) && unitArg.unitDef) {
        const def = unitArg.unitDef;
        return makeQuantity(bignum_1.multiply_numbers(magnitude, def.scale), def.dim);
    }
    run_1.stop('quantity: 2nd argument must be a unit symbol or unit expression, e.g. quantity(5, m) or quantity(3, s/kg)');
}
exports.Eval_quantity = Eval_quantity;
// units(flag): toggles whether multiply/power auto-detect bare unit
// symbols. units() with no argument just reports the current state.
function Eval_units(p1) {
    const arg = defs_1.cadr(p1);
    if (arg !== symbol_1.symbol(defs_1.NIL)) {
        defs_1.defs.unitsAutoDetect = !is_1.isZeroAtom(eval_1.Eval(arg));
    }
    return defs_1.defs.unitsAutoDetect ? defs_1.Constants.One() : defs_1.Constants.Zero();
}
exports.Eval_units = Eval_units;
// convert(quantity, targetUnit): the magnitude of quantity expressed in
// targetUnit, as a plain number (not a re-tagged quantity — a Quantity's
// magnitude is always stored SI-normalized, and printing always shows the
// canonical SI-derived name for its dimension, so "display in cm instead
// of m" isn't representable as a Quantity value without a separate
// display-unit override on the value itself, which is deliberately not
// built here).
function Eval_convert(p1) {
    const value = eval_1.Eval(defs_1.cadr(p1));
    const targetSym = eval_1.Eval(defs_1.caddr(p1));
    if (!isQuantity(value)) {
        run_1.stop('convert: 1st argument must be a quantity, e.g. convert(quantity(5,m), cm)');
    }
    if (!(defs_1.issymbol(targetSym) && targetSym.unitDef)) {
        run_1.stop('convert: 2nd argument must be a unit symbol, e.g. convert(quantity(5,m), cm)');
    }
    const targetDef = targetSym.unitDef;
    const dim = dimArrayOf(defs_1.caddr(value));
    if (!dimsEqual(dim, targetDef.dim)) {
        run_1.stop(`convert: incompatible units: cannot convert ${unit_1.formatDimension(dim)} to ${unit_1.formatDimension(targetDef.dim)}`);
    }
    return bignum_1.divide_numbers(defs_1.cadr(value), targetDef.scale);
}
exports.Eval_convert = Eval_convert;
// dimensionof(value): the dimension vector as a 7-element tensor
// (dimensionless -> all zeros). "dim" was already taken (tensor axis
// length).
function Eval_dimensionof(p1) {
    const value = eval_1.Eval(defs_1.cadr(p1));
    if (isQuantity(value)) {
        return defs_1.caddr(value);
    }
    return dimToTensor(unit_1.ZERO_DIM);
}
exports.Eval_dimensionof = Eval_dimensionof;
