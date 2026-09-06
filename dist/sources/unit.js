"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineUnits = exports.formatDimensionLatex = exports.formatDimension = exports.lookupUnit = exports.ZERO_DIM = exports.DIM_COUNT = exports.DIM_LUMINOUS = exports.DIM_AMOUNT = exports.DIM_TEMPERATURE = exports.DIM_CURRENT = exports.DIM_TIME = exports.DIM_MASS = exports.DIM_LENGTH = void 0;
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
// Dimension vector = exponents of [length, mass, time, current, temperature, amount, luminous]
exports.DIM_LENGTH = 0;
exports.DIM_MASS = 1;
exports.DIM_TIME = 2;
exports.DIM_CURRENT = 3;
exports.DIM_TEMPERATURE = 4;
exports.DIM_AMOUNT = 5;
exports.DIM_LUMINOUS = 6;
exports.DIM_COUNT = 7;
exports.ZERO_DIM = [0, 0, 0, 0, 0, 0, 0];
// scale: how many SI-base-unit-of-that-dimension one unit of this symbol is
// worth, e.g. scale(g) = 1/1000 since the SI base unit for mass is the
// kilogram, not the gram (the one deliberate SI wrinkle here).
const BASE_UNITS = {
    m: [1, 0, 0, 0, 0, 0, 0],
    g: [0, 1, 0, 0, 0, 0, 0],
    s: [0, 0, 1, 0, 0, 0, 0],
    A: [0, 0, 0, 1, 0, 0, 0],
    K: [0, 0, 0, 0, 1, 0, 0],
    mol: [0, 0, 0, 0, 0, 1, 0],
    cd: [0, 0, 0, 0, 0, 0, 1],
};
const DERIVED_UNITS = {
    N: [1, 1, -2, 0, 0, 0, 0],
    J: [2, 1, -2, 0, 0, 0, 0],
    W: [2, 1, -3, 0, 0, 0, 0],
    Pa: [-1, 1, -2, 0, 0, 0, 0],
    Hz: [0, 0, -1, 0, 0, 0, 0],
    C: [0, 0, 1, 1, 0, 0, 0],
    V: [2, 1, -3, -1, 0, 0, 0],
    F: [-2, -1, 4, 2, 0, 0, 0],
    ohm: [2, 1, -3, -2, 0, 0, 0],
    H: [2, 1, -2, -2, 0, 0, 0],
    T: [0, 1, -2, -1, 0, 0, 0],
    Wb: [2, 1, -2, -1, 0, 0, 0], // V s
};
// power of 10 that one unit of the prefix is worth
const PREFIXES = {
    Y: 24, Z: 21, E: 18, P: 15, T: 12, G: 9, M: 6, k: 3, h: 2, da: 1,
    d: -1, c: -2, m: -3, u: -6, n: -9, p: -12, f: -15, a: -18, z: -21, y: -24,
};
function unitScale(name) {
    // gram is the one unprefixed base symbol whose SI-base scale isn't 1,
    // since the SI base unit for mass is the kilogram.
    return name === 'g' ? bignum_1.rational(1, 1000) : bignum_1.integer(1);
}
function buildUnitTable() {
    const table = new Map();
    const stems = Object.assign(Object.assign({}, BASE_UNITS), DERIVED_UNITS);
    for (const [name, dim] of Object.entries(stems)) {
        table.set(name, { dim, scale: unitScale(name) });
    }
    for (const [prefix, pow10] of Object.entries(PREFIXES)) {
        for (const [stem, dim] of Object.entries(stems)) {
            const key = prefix + stem;
            if (table.has(key)) {
                continue; // an exact unit name always wins over a generated combo
            }
            table.set(key, {
                dim,
                scale: bignum_1.multiply_numbers(unitScale(stem), bignum_1.bignum_power_number(bignum_1.integer(10), pow10)),
            });
        }
    }
    return table;
}
let unitTable = null;
let reverseNameTable = null;
function getUnitTable() {
    if (!unitTable) {
        unitTable = buildUnitTable();
    }
    return unitTable;
}
// dim-tuple -> canonical unprefixed name (m, N, J, ...), for printing.
function getReverseNameTable() {
    if (!reverseNameTable) {
        reverseNameTable = new Map();
        const stems = Object.assign(Object.assign({}, BASE_UNITS), DERIVED_UNITS);
        for (const [name, dim] of Object.entries(stems)) {
            reverseNameTable.set(dim.join(','), name);
        }
        // Pure mass should display as the true SI base unit "kg", not "g"
        // (g is registered at scale 1/1000 precisely so "kg" falls out of the
        // ordinary prefix generation below — see unitScale()).
        reverseNameTable.set(BASE_UNITS.g.join(','), 'kg');
    }
    return reverseNameTable;
}
function lookupUnit(name) {
    return getUnitTable().get(name);
}
exports.lookupUnit = lookupUnit;
const DIM_NAMES = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];
function formatDimension(dim) {
    const exact = getReverseNameTable().get(dim.join(','));
    if (exact) {
        return exact;
    }
    const parts = [];
    for (let i = 0; i < exports.DIM_COUNT; i++) {
        if (dim[i] === 0) {
            continue;
        }
        parts.push(dim[i] === 1 ? DIM_NAMES[i] : `${DIM_NAMES[i]}^${dim[i]}`);
    }
    return parts.length ? parts.join('*') : '1';
}
exports.formatDimension = formatDimension;
// Like formatDimension, but for LaTeX: each unit name gets its own \text{}
// (an exponent placed outside of it, in ^{}, so it actually superscripts —
// "\text{s}^{-1}" instead of the illegal-looking "\text{s^-1}"), joined
// with \cdot per SI convention instead of a bare "*".
function formatDimensionLatex(dim) {
    const exact = getReverseNameTable().get(dim.join(','));
    if (exact) {
        return `\\text{${exact}}`;
    }
    const parts = [];
    for (let i = 0; i < exports.DIM_COUNT; i++) {
        if (dim[i] === 0) {
            continue;
        }
        parts.push(dim[i] === 1 ? `\\text{${DIM_NAMES[i]}}` : `\\text{${DIM_NAMES[i]}}^{${dim[i]}}`);
    }
    return parts.length ? parts.join('\\cdot ') : '1';
}
exports.formatDimensionLatex = formatDimensionLatex;
// Registers every base/derived/prefixed unit symbol, with its dimension
// vector and SI-normalizing scale attached as metadata (Sym.unitDef).
// Registration itself is always-on and behavior-neutral: it only matters
// once defs.unitsAutoDetect is turned on, or quantity() is called explicitly
// — see sources/quantity.ts.
function defineUnits() {
    for (const [name, def] of getUnitTable()) {
        symbol_1.std_unit_symbol(name, def.dim, def.scale);
    }
}
exports.defineUnits = defineUnits;
