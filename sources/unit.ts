import { Num } from '../runtime/defs';
import { std_unit_symbol } from '../runtime/symbol';
import { bignum_power_number, integer, multiply_numbers, rational } from './bignum';

// Dimension vector = exponents of [length, mass, time, current, temperature, amount, luminous]
export const DIM_LENGTH = 0;
export const DIM_MASS = 1;
export const DIM_TIME = 2;
export const DIM_CURRENT = 3;
export const DIM_TEMPERATURE = 4;
export const DIM_AMOUNT = 5;
export const DIM_LUMINOUS = 6;
export const DIM_COUNT = 7;
export const ZERO_DIM: number[] = [0, 0, 0, 0, 0, 0, 0];

// scale: how many SI-base-unit-of-that-dimension one unit of this symbol is
// worth, e.g. scale(g) = 1/1000 since the SI base unit for mass is the
// kilogram, not the gram (the one deliberate SI wrinkle here).
const BASE_UNITS: Record<string, number[]> = {
  m: [1, 0, 0, 0, 0, 0, 0],
  g: [0, 1, 0, 0, 0, 0, 0],
  s: [0, 0, 1, 0, 0, 0, 0],
  A: [0, 0, 0, 1, 0, 0, 0],
  K: [0, 0, 0, 0, 1, 0, 0],
  mol: [0, 0, 0, 0, 0, 1, 0],
  cd: [0, 0, 0, 0, 0, 0, 1],
};

const DERIVED_UNITS: Record<string, number[]> = {
  N: [1, 1, -2, 0, 0, 0, 0], // kg m / s^2
  J: [2, 1, -2, 0, 0, 0, 0], // N m
  W: [2, 1, -3, 0, 0, 0, 0], // J / s
  Pa: [-1, 1, -2, 0, 0, 0, 0], // N / m^2
  Hz: [0, 0, -1, 0, 0, 0, 0], // 1 / s
  C: [0, 0, 1, 1, 0, 0, 0], // A s
  V: [2, 1, -3, -1, 0, 0, 0], // W / A
  F: [-2, -1, 4, 2, 0, 0, 0], // C / V
  ohm: [2, 1, -3, -2, 0, 0, 0], // V / A
  H: [2, 1, -2, -2, 0, 0, 0], // V s / A
  T: [0, 1, -2, -1, 0, 0, 0], // Wb / m^2
  Wb: [2, 1, -2, -1, 0, 0, 0], // V s
};

// power of 10 that one unit of the prefix is worth
const PREFIXES: Record<string, number> = {
  Y: 24, Z: 21, E: 18, P: 15, T: 12, G: 9, M: 6, k: 3, h: 2, da: 1,
  d: -1, c: -2, m: -3, u: -6, n: -9, p: -12, f: -15, a: -18, z: -21, y: -24,
};

export interface UnitDef {
  dim: number[];
  scale: Num;
}

function unitScale(name: string): Num {
  // gram is the one unprefixed base symbol whose SI-base scale isn't 1,
  // since the SI base unit for mass is the kilogram.
  return name === 'g' ? rational(1, 1000) : integer(1);
}

function buildUnitTable(): Map<string, UnitDef> {
  const table = new Map<string, UnitDef>();
  const stems: Record<string, number[]> = { ...BASE_UNITS, ...DERIVED_UNITS };

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
        scale: multiply_numbers(unitScale(stem), bignum_power_number(integer(10), pow10)) as Num,
      });
    }
  }

  return table;
}

let unitTable: Map<string, UnitDef> | null = null;
let reverseNameTable: Map<string, string> | null = null;

function getUnitTable(): Map<string, UnitDef> {
  if (!unitTable) {
    unitTable = buildUnitTable();
  }
  return unitTable;
}

// dim-tuple -> canonical unprefixed name (m, N, J, ...), for printing.
function getReverseNameTable(): Map<string, string> {
  if (!reverseNameTable) {
    reverseNameTable = new Map();
    const stems: Record<string, number[]> = { ...BASE_UNITS, ...DERIVED_UNITS };
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

export function lookupUnit(name: string): UnitDef | undefined {
  return getUnitTable().get(name);
}

const DIM_NAMES = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];

export function formatDimension(dim: number[]): string {
  const exact = getReverseNameTable().get(dim.join(','));
  if (exact) {
    return exact;
  }
  const parts: string[] = [];
  for (let i = 0; i < DIM_COUNT; i++) {
    if (dim[i] === 0) {
      continue;
    }
    parts.push(dim[i] === 1 ? DIM_NAMES[i] : `${DIM_NAMES[i]}^${dim[i]}`);
  }
  return parts.length ? parts.join('*') : '1';
}

// Like formatDimension, but for LaTeX: each unit name gets its own \text{}
// (an exponent placed outside of it, in ^{}, so it actually superscripts —
// "\text{s}^{-1}" instead of the illegal-looking "\text{s^-1}"), joined
// with \cdot per SI convention instead of a bare "*".
export function formatDimensionLatex(dim: number[]): string {
  const exact = getReverseNameTable().get(dim.join(','));
  if (exact) {
    return `\\text{${exact}}`;
  }
  const parts: string[] = [];
  for (let i = 0; i < DIM_COUNT; i++) {
    if (dim[i] === 0) {
      continue;
    }
    parts.push(
      dim[i] === 1 ? `\\text{${DIM_NAMES[i]}}` : `\\text{${DIM_NAMES[i]}}^{${dim[i]}}`
    );
  }
  return parts.length ? parts.join('\\cdot ') : '1';
}

// Registers every base/derived/prefixed unit symbol, with its dimension
// vector and SI-normalizing scale attached as metadata (Sym.unitDef).
// Registration itself is always-on and behavior-neutral: it only matters
// once defs.unitsAutoDetect is turned on, or quantity() is called explicitly
// — see sources/quantity.ts.
export function defineUnits() {
  for (const [name, def] of getUnitTable()) {
    std_unit_symbol(name, def.dim, def.scale);
  }
}
