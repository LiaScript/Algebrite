import {
  ABS,
  ARCSINH,
  ARCTAN,
  ASSUME_REAL_VARIABLES,
  caddr,
  cadr,
  car,
  Constants,
  COS,
  COSH,
  E,
  isadd,
  isdouble,
  ismultiply,
  ispower,
  isrational,
  issymbol,
  LOG,
  NIL,
  NOT,
  PI,
  SIN,
  SINH,
  Str,
  Sym,
  TANH,
  TESTEQ,
  TESTGE,
  TESTGT,
  TESTLE,
  TESTLT,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { get_binding, symbol } from '../runtime/symbol';
import { Eval } from './eval';
import { isinteger, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { build_tensor } from './scan';

/* assume ==================================================================

Assumptions about symbols, used by the rules that depend on the sign or the
domain of a symbol (sqrt(x^2) is x only for x >= 0):

  assume(x, positive)   also real, negative, nonzero, integer
  assume(x > 0)         also <, >=, <=, !=
  forget(x), forget()   drop the assumptions about x, or all of them
  assumptions()         list them

The queries isreal, ispositive, isnegative, isnonzero and isinteger are
three-valued: true, false or unknown (undefined). They work on
expressions, deriving what they can from the parts. The user functions
give 1 or 0, and stay unevaluated when the answer is unknown.

*/

// what is known about a value; a missing field is unknown
export interface Facts {
  real?: boolean;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;
  zero?: boolean;
}

type Property = 'real' | 'positive' | 'negative' | 'nonzero' | 'integer';

const PROPERTIES: Record<Property, Facts> = {
  real: { real: true },
  positive: { positive: true },
  negative: { negative: true },
  nonzero: { zero: false },
  integer: { integer: true },
};

// by symbol name, so clearall (which recreates the symbols) can't leave
// stale entries; reset by clearAssumptions()
let assumptions = new Map<string, Facts>();

export function clearAssumptions() {
  assumptions = new Map();
}

// ------------------------------------------------------------------ facts

// Adds the facts implied by the known ones; null on a contradiction.
function close(f: Facts): Facts | null {
  const r: Facts = { ...f };
  const set = (key: keyof Facts, value: boolean): boolean => {
    if (r[key] === !value) {
      return false;
    }
    r[key] = value;
    return true;
  };
  // repeat until nothing changes, the implications feed each other
  for (let changed = true; changed; ) {
    const before = JSON.stringify(r);
    if (r.positive) {
      if (!set('real', true) || !set('negative', false) || !set('zero', false)) return null;
    }
    if (r.negative) {
      if (!set('real', true) || !set('positive', false) || !set('zero', false)) return null;
    }
    if (r.zero) {
      if (!set('real', true) || !set('integer', true) || !set('positive', false) || !set('negative', false)) return null;
    }
    if (r.integer) {
      if (!set('real', true)) return null;
    }
    if (r.real) {
      // a real number is exactly one of positive, negative, zero
      const known = [r.positive, r.negative, r.zero];
      if (known.filter((k) => k === false).length === 2) {
        const i = known.indexOf(undefined);
        if (i >= 0 && !set((['positive', 'negative', 'zero'] as const)[i], true)) return null;
      }
    }
    changed = JSON.stringify(r) !== before;
  }
  return r;
}

const merge = (a: Facts, b: Facts): Facts | null => {
  for (const key of Object.keys(b) as (keyof Facts)[]) {
    if (a[key] !== undefined && a[key] !== b[key]) {
      return null;
    }
  }
  return close({ ...a, ...b });
};

const realFacts = (d: number): Facts =>
  close({ real: true, integer: Math.floor(d) === d, positive: d > 0, negative: d < 0, zero: d === 0 });

// Facts about an evaluated expression.
export function facts(p: U): Facts {
  if (isrational(p)) {
    return close({ ...realFacts(Math.sign(p.q.a.toJSNumber())), integer: isinteger(p) });
  }
  if (isdouble(p)) {
    return realFacts(p.d);
  }
  if (issymbol(p)) {
    return symbolFacts(p);
  }
  if (isadd(p)) {
    return sumFacts(p.tail().map(facts));
  }
  if (ismultiply(p)) {
    return productFacts(p.tail().map(facts));
  }
  if (ispower(p)) {
    return powerFacts(cadr(p), caddr(p));
  }
  return functionFacts(p);
}

function symbolFacts(p: Sym): Facts {
  if (p === symbol(PI) || p === symbol(E)) {
    return close({ positive: true });
  }
  const assumed = assumptions.get(p.printname);
  if (assumed) {
    return assumed;
  }
  const realByDefault = !isZeroAtomOrTensor(get_binding(symbol(ASSUME_REAL_VARIABLES)));
  return realByDefault && isFreeVariable(p) ? { real: true } : {};
}

// a variable, not a named constant or a function
function isFreeVariable(p: Sym): boolean {
  return get_binding(p) === p && p.keyword == null;
}

// exactly one part not real, all others real (and, for products, nonzero):
// then the whole is not real either
const oneNonReal = (parts: Facts[], others: (t: Facts) => boolean) =>
  parts.filter((t) => t.real === false).length === 1 &&
  parts.every((t) => t.real === false || others(t));

function sumFacts(terms: Facts[]): Facts {
  const all = (key: keyof Facts) => terms.every((t) => t[key] === true);
  const f: Facts = {};
  if (all('real')) f.real = true;
  if (oneNonReal(terms, (t) => t.real === true)) f.real = false;
  if (all('integer')) f.integer = true;
  const nonnegative = terms.every((t) => t.negative === false && t.real);
  const nonpositive = terms.every((t) => t.positive === false && t.real);
  if (nonnegative && terms.some((t) => t.positive)) f.positive = true;
  if (nonpositive && terms.some((t) => t.negative)) f.negative = true;
  if (nonnegative) f.negative = false;
  if (nonpositive) f.positive = false;
  return close(f) ?? {};
}

function productFacts(factors: Facts[]): Facts {
  const all = (key: keyof Facts) => factors.every((t) => t[key] === true);
  const f: Facts = {};
  if (all('real')) f.real = true;
  if (oneNonReal(factors, (t) => t.real === true && t.zero === false)) f.real = false;
  if (all('integer')) f.integer = true;
  if (factors.some((t) => t.zero)) {
    return close({ zero: true }) ?? {};
  }
  if (factors.every((t) => t.zero === false)) f.zero = false;
  if (factors.every((t) => t.positive || t.negative)) {
    const negatives = factors.filter((t) => t.negative).length;
    f[negatives % 2 ? 'negative' : 'positive'] = true;
  }
  return close(f) ?? {};
}

function powerFacts(base: U, exponent: U): Facts {
  const b = facts(base);
  const f: Facts = {};
  if (base === symbol(E)) {
    // exp(u) is positive for real u and never 0
    const u = facts(exponent);
    return close(u.real ? { positive: true } : { zero: false }) ?? {};
  }
  if (b.zero === false) f.zero = false;
  if (isrational(exponent)) {
    const num = exponent.q.a.toJSNumber();
    const den = exponent.q.b.toJSNumber();
    if (den === 1) {
      // integer powers of a real base are real; even ones are >= 0
      if (b.real) f.real = true;
      if (b.integer && num > 0) f.integer = true;
      if (b.positive) f.positive = true;
      if (b.real && num % 2 === 0) f.negative = false;
      if (b.negative && num % 2 !== 0) f.negative = true;
      if (num < 0 && b.zero === false) f.zero = false;
    } else if (b.positive) {
      f.positive = true;
    } else if (b.real && b.negative === false) {
      f.negative = false;
      f.real = true;
    } else if (b.negative && den % 2 === 0) {
      // (-a)^(1/2) and the like: imaginary
      f.real = false;
    }
  } else if (b.positive && facts(exponent).real) {
    f.positive = true;
  }
  return close(f) ?? {};
}

function functionFacts(p: U): Facts {
  const f = car(p);
  const arg = facts(cadr(p));
  if (f === symbol(ABS)) {
    return close({ real: true, negative: false, zero: arg.zero }) ?? {};
  }
  if (arg.real) {
    if (f === symbol(COSH)) return close({ positive: true }) ?? {};
    if ([SIN, COS, SINH, TANH, ARCTAN, ARCSINH].some((n) => f === symbol(n))) {
      return { real: true };
    }
  }
  if (f === symbol(LOG) && arg.positive) {
    return { real: true };
  }
  return {};
}

// three-valued queries on an evaluated expression
export const isReal = (p: U) => facts(p).real;
export const isPositive = (p: U) => facts(p).positive;
export const isNegative = (p: U) => facts(p).negative;
export const isNonzero = (p: U) => (facts(p).zero === undefined ? undefined : !facts(p).zero);
export const isInteger = (p: U) => facts(p).integer;

// ---------------------------------------------------------- user functions

const answer = (value: boolean | undefined, call: U, arg: U): U =>
  value === undefined
    ? makeList(car(call), arg)
    : value
    ? Constants.one
    : Constants.zero;

export function Eval_isreal(p1: U) {
  const arg = Eval(cadr(p1));
  return answer(isReal(arg), p1, arg);
}

export function Eval_ispositive(p1: U) {
  const arg = Eval(cadr(p1));
  return answer(isPositive(arg), p1, arg);
}

export function Eval_isnegative(p1: U) {
  const arg = Eval(cadr(p1));
  return answer(isNegative(arg), p1, arg);
}

export function Eval_isnonzero(p1: U) {
  const arg = Eval(cadr(p1));
  return answer(isNonzero(arg), p1, arg);
}

export function Eval_isinteger(p1: U) {
  const arg = Eval(cadr(p1));
  return answer(isInteger(arg), p1, arg);
}

// assume(x, property) or assume(relation, ...): relations are read
// unevaluated, so x > 0 is taken apart and not tested
export function Eval_assume(p1: U) {
  const args = (p1 as any).tail() as U[];
  if (args.length === 2 && issymbol(args[1]) && !isRelation(args[1])) {
    const name = args[1].printname as Property;
    if (!(name in PROPERTIES)) {
      stop(`assume: unknown property ${name}, use real, positive, negative, nonzero or integer`);
    }
    addAssumption(args[0], PROPERTIES[name]);
  } else {
    for (const relation of args) {
      const [x, f] = parseRelation(relation);
      addAssumption(x, f);
    }
  }
  return symbol(NIL);
}

function isRelation(p: U): boolean {
  return [TESTGT, TESTGE, TESTLT, TESTLE, NOT].some((n) => car(p) === symbol(n));
}

// x > 0, x >= 0, x < 0, x <= 0, x != 0 (also 0 < x and so on)
function parseRelation(p: U): [U, Facts] {
  const flip: Record<string, string> = { [TESTGT]: TESTLT, [TESTGE]: TESTLE, [TESTLT]: TESTGT, [TESTLE]: TESTGE };
  let op = car(p);
  let lhs = cadr(p);
  let rhs = caddr(p);
  if (op === symbol(NOT) && car(cadr(p)) === symbol(TESTEQ)) {
    [op, lhs, rhs] = [symbol(TESTEQ), cadr(cadr(p)), caddr(cadr(p))];
  }
  if (isZeroAtomOrTensor(lhs) && issymbol(op) && flip[op.printname]) {
    [op, lhs, rhs] = [symbol(flip[op.printname]), rhs, lhs];
  }
  const byOp: Record<string, Facts> = {
    [TESTGT]: { positive: true },
    [TESTGE]: { real: true, negative: false },
    [TESTLT]: { negative: true },
    [TESTLE]: { real: true, positive: false },
    [TESTEQ]: { zero: false },
  };
  if (!issymbol(op) || !byOp[op.printname] || !isZeroAtomOrTensor(Eval(rhs))) {
    stop('assume: use x > 0, x >= 0, x < 0, x <= 0, x != 0 or assume(x, property)');
  }
  return [lhs, byOp[op.printname]];
}

function addAssumption(x: U, f: Facts) {
  if (!issymbol(x)) {
    stop(`assume: ${x} is not a symbol`);
  }
  const old = assumptions.get(x.printname) ?? {};
  const merged = merge(old, f);
  if (merged === null) {
    stop(`assume: ${x} can not be ${describe(f)}, it is already assumed ${describe(old)}`);
  }
  assumptions.set(x.printname, merged);
}

// the facts as user-level property names, leaving out implied ones
function describe(f: Facts): string {
  const names: string[] = [];
  if (f.real && !f.integer && !f.positive && !f.negative) names.push('real');
  if (f.integer) names.push('integer');
  if (f.positive) names.push('positive');
  else if (f.negative) names.push('negative');
  else {
    if (f.negative === false) names.push('nonnegative');
    if (f.positive === false) names.push('nonpositive');
    if (f.zero === false) names.push('nonzero');
  }
  return names.join(', ');
}

export function Eval_forget(p1: U) {
  const args = (p1 as any).tail() as U[];
  if (args.length === 0) {
    clearAssumptions();
  }
  for (const x of args) {
    if (!issymbol(x)) {
      stop(`forget: ${x} is not a symbol`);
    }
    assumptions.delete(x.printname);
  }
  return symbol(NIL);
}

export function Eval_assumptions() {
  if (assumptions.size === 0) {
    return symbol(NIL);
  }
  const lines = [...assumptions.keys()]
    .sort()
    .map((name) => new Str(`${name}: ${describe(assumptions.get(name))}`));
  return build_tensor(lines);
}
