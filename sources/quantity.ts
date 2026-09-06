import { alloc_tensor } from '../runtime/alloc';
import {
  cadr,
  caddr,
  car,
  Cons,
  Constants,
  defs,
  Double,
  iscons,
  issymbol,
  isNumericAtom,
  istensor,
  NIL,
  Num,
  QUANTITY,
  Sym,
  Tensor,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { add_numbers, divide_numbers, integer, multiply_numbers, nativeDouble, rational } from './bignum';
import { Eval } from './eval';
import { isZeroAtom } from './is';
import { makeList } from './list';
import { power } from './power';
import { DIM_COUNT, formatDimension, ZERO_DIM } from './unit';

// Dimension vector arithmetic — plain number[] of length DIM_COUNT.
export function addDims(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

export function subDims(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

export function scaleDims(a: number[], k: number): number[] {
  return a.map((v) => v * k);
}

export function dimsEqual(a: number[], b: number[]): boolean {
  return a.every((v, i) => v === b[i]);
}

function dimToNum(n: number): Num {
  if (Number.isInteger(n)) {
    return integer(n);
  }
  // small-denominator reconstruction, covers the realistic cases (halves,
  // thirds, quarters, ...) coming out of e.g. sqrt(unit) without going
  // through a full continued-fraction search
  for (let denom = 2; denom <= 12; denom++) {
    const numer = n * denom;
    if (Math.abs(numer - Math.round(numer)) < 1e-9) {
      return rational(Math.round(numer), denom);
    }
  }
  return rational(Math.round(n * 1e6), 1e6);
}

function dimToTensor(dim: number[]): Tensor {
  const t = alloc_tensor(DIM_COUNT);
  t.tensor.ndim = 1;
  t.tensor.dim[0] = DIM_COUNT;
  for (let i = 0; i < DIM_COUNT; i++) {
    t.tensor.elem[i] = dimToNum(dim[i]);
  }
  return t;
}

function dimArrayOf(dimValue: U): number[] {
  const t = dimValue as Tensor;
  return t.tensor.elem.map((e) => nativeDouble(e));
}

// The istensor(caddr(p)) check matters: scan.ts's "1/x" handling calls
// inverse()/power() directly on a freshly-parsed, not-yet-evaluated factor,
// so a raw user call like quantity(3, s) — caddr still the bare unit
// symbol, not yet resolved to a dimension tensor — can reach here before
// Eval_quantity ever normalizes it. Without this check that's misread as
// the internal form and crashes reading a Tensor field off a Sym.
export function isQuantity(p: U): p is Cons {
  return iscons(p) && car(p) === symbol(QUANTITY) && istensor(caddr(p));
}

// Builds a Quantity value, or collapses to the bare (already SI-normalized)
// magnitude when the dimension has fully cancelled out (e.g. m/m).
export function makeQuantity(magnitude: U, dim: number[]): U {
  if (dimsEqual(dim, ZERO_DIM)) {
    return magnitude;
  }
  return makeList(symbol(QUANTITY), magnitude, dimToTensor(dim));
}

type Classification = 'numeric' | 'other' | { magnitude: Num | Double; dim: number[] };

// A bare unit *symbol* (m, kg, ...) only classifies as unit-bearing when
// unit auto-detection is on (defs.unitsAutoDetect) or the value already is
// a Quantity (built via quantity() or a prior auto-detected operation) —
// this is what keeps existing scripts using m/s/N/... as plain variables
// unaffected by default. See the "Zwei Modi" section of the units plan.
function classify(p: U, allowSymbolAutoDetect: boolean): Classification {
  if (isQuantity(p)) {
    return { magnitude: cadr(p) as Num | Double, dim: dimArrayOf(caddr(p)) };
  }
  if (allowSymbolAutoDetect && issymbol(p) && (p as Sym).unitDef) {
    const def = (p as Sym).unitDef;
    return { magnitude: def.scale, dim: def.dim };
  }
  if (isNumericAtom(p)) {
    return 'numeric';
  }
  return 'other';
}

// undefined means "not our concern, fall through to ordinary multiply".
export function multiplyUnitAware(p1: U, p2: U): U | undefined {
  const allow = defs.unitsAutoDetect;
  const c1 = classify(p1, allow);
  const c2 = classify(p2, allow);
  if (c1 === 'other' || c2 === 'other') {
    return undefined;
  }
  if (c1 === 'numeric' && c2 === 'numeric') {
    return undefined;
  }

  const mag1 = c1 === 'numeric' ? (p1 as Num | Double) : c1.magnitude;
  const dim1 = c1 === 'numeric' ? ZERO_DIM : c1.dim;
  const mag2 = c2 === 'numeric' ? (p2 as Num | Double) : c2.magnitude;
  const dim2 = c2 === 'numeric' ? ZERO_DIM : c2.dim;

  return makeQuantity(multiply_numbers(mag1, mag2), addDims(dim1, dim2));
}

// undefined means "not our concern, fall through to ordinary power".
export function powerUnitAware(base: U, exponent: U): U | undefined {
  const c = classify(base, defs.unitsAutoDetect);
  if (c === 'other' || c === 'numeric' || !isNumericAtom(exponent)) {
    return undefined;
  }

  const newDim = scaleDims(c.dim, nativeDouble(exponent));
  const newMag = power(c.magnitude, exponent);
  return makeQuantity(newMag, newDim);
}

// undefined means "no quantity involved, fall through to ordinary add".
// Not gated by unitsAutoDetect: this only ever fires on terms that are
// already Quantity values, which can't exist without quantity() or a
// gated auto-detected multiply/power having produced them first.
export function addQuantities(terms: U[]): U | undefined {
  const quantityTerms = terms.filter(isQuantity);
  if (quantityTerms.length === 0) {
    return undefined;
  }

  const dim = dimArrayOf(caddr(quantityTerms[0]));
  for (const t of terms) {
    if (isQuantity(t)) {
      const otherDim = dimArrayOf(caddr(t));
      if (!dimsEqual(otherDim, dim)) {
        stop(`incompatible units: cannot add ${formatDimension(dim)} and ${formatDimension(otherDim)}`);
      }
    } else if (!isZeroAtom(t)) {
      stop(`incompatible units: cannot add ${formatDimension(dim)} and a dimensionless value`);
    }
  }

  let sum: Num | Double = Constants.Zero();
  for (const t of terms) {
    if (isQuantity(t)) {
      sum = add_numbers(sum, cadr(t) as Num | Double);
    }
  }
  return makeQuantity(sum, dim);
}

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
export function Eval_quantity(p1: Cons): U {
  const magnitude = Eval(cadr(p1));

  const savedAutoDetect = defs.unitsAutoDetect;
  defs.unitsAutoDetect = true;
  let unitArg: U;
  try {
    unitArg = Eval(caddr(p1));
  } finally {
    defs.unitsAutoDetect = savedAutoDetect;
  }

  if (istensor(unitArg)) {
    return makeQuantity(magnitude, dimArrayOf(unitArg));
  }

  if (isQuantity(unitArg)) {
    const scale = cadr(unitArg) as Num | Double;
    return makeQuantity(multiply_numbers(magnitude as Num | Double, scale), dimArrayOf(caddr(unitArg)));
  }

  if (issymbol(unitArg) && (unitArg as Sym).unitDef) {
    const def = (unitArg as Sym).unitDef;
    return makeQuantity(multiply_numbers(magnitude as Num | Double, def.scale), def.dim);
  }

  stop('quantity: 2nd argument must be a unit symbol or unit expression, e.g. quantity(5, m) or quantity(3, s/kg)');
}

// units(flag): toggles whether multiply/power auto-detect bare unit
// symbols. units() with no argument just reports the current state.
export function Eval_units(p1: Cons): U {
  const arg = cadr(p1);
  if (arg !== symbol(NIL)) {
    defs.unitsAutoDetect = !isZeroAtom(Eval(arg));
  }
  return defs.unitsAutoDetect ? Constants.One() : Constants.Zero();
}

// convert(quantity, targetUnit): the magnitude of quantity expressed in
// targetUnit, as a plain number (not a re-tagged quantity — a Quantity's
// magnitude is always stored SI-normalized, and printing always shows the
// canonical SI-derived name for its dimension, so "display in cm instead
// of m" isn't representable as a Quantity value without a separate
// display-unit override on the value itself, which is deliberately not
// built here).
export function Eval_convert(p1: Cons): U {
  const value = Eval(cadr(p1));
  const targetSym = Eval(caddr(p1));

  if (!isQuantity(value)) {
    stop('convert: 1st argument must be a quantity, e.g. convert(quantity(5,m), cm)');
  }
  if (!(issymbol(targetSym) && (targetSym as Sym).unitDef)) {
    stop('convert: 2nd argument must be a unit symbol, e.g. convert(quantity(5,m), cm)');
  }

  const targetDef = (targetSym as Sym).unitDef;
  const dim = dimArrayOf(caddr(value));
  if (!dimsEqual(dim, targetDef.dim)) {
    stop(`convert: incompatible units: cannot convert ${formatDimension(dim)} to ${formatDimension(targetDef.dim)}`);
  }

  return divide_numbers(cadr(value) as Num | Double, targetDef.scale);
}

// dimensionof(value): the dimension vector as a 7-element tensor
// (dimensionless -> all zeros). "dim" was already taken (tensor axis
// length).
export function Eval_dimensionof(p1: Cons): U {
  const value = Eval(cadr(p1));
  if (isQuantity(value)) {
    return caddr(value);
  }
  return dimToTensor(ZERO_DIM);
}
