import { count } from '../runtime/count';
import {
  AND,
  caddr,
  cadr,
  car,
  Constants,
  isadd,
  iscons,
  isdouble,
  ismultiply,
  isNumericAtom,
  isrational,
  isstr,
  issymbol,
  istensor,
  NOT,
  Num,
  OR,
  Sym,
  TESTEQ,
  TESTGE,
  TESTGT,
  TESTLE,
  TESTLT,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { collectUserSymbols, symbol } from '../runtime/symbol';
import { add, add_all, subtract } from './add';
import { allSymbolsReal, facts } from './assume';
import { gcd_numbers } from './bignum';
import { Eval, Eval_predicate } from './eval';
import { zzfloat } from './float';
import { gcd } from './gcd';
import {
  isfloating,
  isnegativenumber,
  ispolyexpandedform,
  isZeroAtomOrTensor,
  isZeroLikeOrNonZeroLikeOrUndetermined
} from './is';
import { makeList } from './list';
import { equal } from './misc';
import { divide, multiply, multiply_all, negate } from './multiply';
import { joinPieces } from './solve_inequality';
import { subst } from './subst';
import { cmp_values } from './test';

// Simplification of comparisons, and/or/not. All of it runs in the evaluator:
// every rule here holds for every real value (1 = always true, 0 = never, as
// in solve). Nothing is done to operands without an order: tensors, strings,
// imaginary parts, symbols assumed complex.

// the comparison with its sides exchanged, and its negation (tables built
// on use: the names are not there yet while the modules load)
const flip = (op: string): string =>
  ({ [TESTLT]: TESTGT, [TESTGT]: TESTLT, [TESTLE]: TESTGE, [TESTGE]: TESTLE, [TESTEQ]: TESTEQ }[op]);
const negated = (op: string): string =>
  ({ [TESTLT]: TESTGE, [TESTGE]: TESTLT, [TESTGT]: TESTLE, [TESTLE]: TESTGT }[op]);

const opName = (p: U): string => (issymbol(car(p)) ? (car(p) as Sym).printname : '');
const isComparison = (p: U) => flip(opName(p)) !== undefined;
const isLogical = (p: U) => isComparison(p) || [AND, OR, NOT].includes(opName(p));

export function comparable(...sides: U[]): boolean {
  return sides.every(
    (s) => !istensor(s) && !isstr(s) && !Find(s, Constants.imaginaryunit) && allSymbolsReal(s)
  );
}

const termsOf = (p: U): U[] => (isadd(p) ? p.tail() : [p]);
const coefficient = (t: U): U => (ismultiply(t) && isNumericAtom(cadr(t)) ? cadr(t) : Constants.one);

// An undecided comparison of evaluated sides: lhs-rhs is divided by its
// common factors of known sign (a negative one turns the relation, an
// equation only needs them nonzero) and by its numeric content, positive
// terms go to the left, the others to the right. x+y>y is x>0, -x<3 is
// x>-3, a*x>a is x>1 only for a known sign of a. The result is taken when it
// is smaller; a comparison that is solved for a symbol stays as it is.
export function simplifyComparison(op: string, lhs: U, rhs: U): U {
  const asTyped = makeList(symbol(op), lhs, rhs);
  const solvedFor = (a: U, b: U) => issymbol(a) && !Find(b, a);
  if (!comparable(lhs, rhs) || solvedFor(lhs, rhs) || solvedFor(rhs, lhs)) {
    return asTyped;
  }
  let terms = termsOf(subtract(lhs, rhs));

  // ponytail: gcd of at most 8 terms, it factors polynomials (exact ones)
  if (terms.length <= 8 && !terms.some((t) => isNumericAtom(t) || isfloating(t))) {
    const g = terms.reduce(gcd);
    for (const f of ismultiply(g) ? g.tail() : [g]) {
      const known = isNumericAtom(f) ? {} : facts(f);
      if (op === TESTEQ ? known.zero === false : known.positive || known.negative) {
        terms = termsOf(add_all(terms.map((t) => divide(t, f))));
        op = known.negative ? flip(op) : op;
      }
    }
  }

  // the numeric content, negative when no term is positive
  const rest = terms.filter((t) => !isNumericAtom(t));
  const coeffs = rest.map(coefficient);
  let k: U = Constants.one;
  if (rest.length === 1) {
    k = isnegativenumber(coeffs[0]) ? negate(coeffs[0]) : coeffs[0];
  } else if (coeffs.length > 0 && coeffs.every(isrational)) {
    k = (coeffs as Num[]).reduce(gcd_numbers);
  }
  if (coeffs.length > 0 && coeffs.every(isnegativenumber)) {
    k = negate(k);
    op = flip(op);
  }
  // a lone term loses its coefficient k (0.5*x/0.5 would be 1.0*x)
  terms = terms.map((t) =>
    rest.length === 1 && t === rest[0] && ismultiply(t) && isNumericAtom(cadr(t))
      ? multiply_all(t.tail().slice(1))
      : divide(t, k)
  );

  const left = terms.filter((t) => !isNumericAtom(t) && !isnegativenumber(coefficient(t)));
  const right = terms.filter((t) => !left.includes(t)).map(negate);
  const candidate = makeList(symbol(op), add_all(left), add_all(right));
  return count(candidate) < count(asTyped) ? Eval(candidate) : asTyped;
}

// 1/0 or the unknown parts of and(...)/or(...): nested calls are flattened,
// decided and repeated parts dropped, and the comparisons of one variable
// with numeric bounds are joined on the number line.
export function evalLogic(p1: U, isAnd: boolean): U {
  const op = car(p1);
  const absorbing = isAnd ? Constants.zero : Constants.one;
  let parts: U[] = [];
  for (const arg of iscons(p1) ? p1.tail() : []) {
    const value = Eval_predicate(arg);
    for (const part of car(value) === op && iscons(value) ? value.tail() : [value]) {
      const truth = isZeroLikeOrNonZeroLikeOrUndetermined(part);
      if (truth === !isAnd) {
        return absorbing;
      }
      if (truth == null && !parts.some((q) => equal(q, part))) {
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
    return isAnd ? Constants.one : Constants.zero;
  }
  return parts.length === 1 ? parts[0] : makeList(op, ...parts);
}

// not(...) of a comparison is the opposite comparison, of and/or of
// comparisons the or/and of the opposites; x!=1 stays not(x==1).
export function evalNot(p1: U): U {
  const arg = Eval_predicate(cadr(p1));
  const truth = isZeroLikeOrNonZeroLikeOrUndetermined(arg);
  if (truth != null) {
    return truth ? Constants.zero : Constants.one;
  }
  return negation(arg) ?? makeList(symbol(NOT), arg);
}

function negation(p: U): U | undefined {
  const name = opName(p);
  if (name === NOT) {
    return isLogical(cadr(p)) ? cadr(p) : undefined;
  }
  if (isComparison(p)) {
    if (!comparable(cadr(p), caddr(p))) {
      return undefined;
    }
    return name === TESTEQ
      ? makeList(symbol(NOT), p)
      : makeList(symbol(negated(name)), cadr(p), caddr(p));
  }
  if ((name === AND || name === OR) && iscons(p)) {
    const parts = p.tail().map(negation);
    if (parts.every((q) => q !== undefined)) {
      return Eval(makeList(symbol(name === AND ? OR : AND), ...parts));
    }
  }
  return undefined;
}

// A condition on one real variable: x op bound with a real number as bound,
// or and/or/not of such conditions on the same x.
interface Condition {
  x: U;
  op: string;
  bound?: U;
  index?: number; // of the bound among the sorted bounds
  parts?: Condition[];
}

function condition(p: U): Condition | undefined {
  const name = opName(p);
  if (isComparison(p)) {
    return linearComparison(name, cadr(p), caddr(p));
  }
  if ([AND, OR, NOT].includes(name) && iscons(p)) {
    const parts = p.tail().map(condition);
    if (parts.every((q) => q !== undefined && q.x === parts[0].x)) {
      return { x: parts[0].x, op: name, parts };
    }
  }
  return undefined;
}

// s*x + c op 0 with numbers s and c: x op -c/s, turned for a negative s
function linearComparison(op: string, lhs: U, rhs: U): Condition | undefined {
  if (!comparable(lhs, rhs)) {
    return undefined;
  }
  const E = subtract(lhs, rhs);
  const vars: U[] = [];
  collectUserSymbols(E, vars);
  if (vars.length !== 1 || !ispolyexpandedform(E, vars[0])) {
    return undefined;
  }
  const x = vars[0];
  const c = Eval(subst(E, x, Constants.zero));
  const s = subtract(Eval(subst(E, x, Constants.one)), c);
  const sign = cmp_values(s, Constants.zero);
  if (!sign || !isZeroAtomOrTensor(subtract(E, add(multiply(s, x), c)))) {
    return undefined; // no x left, or not linear
  }
  const bound = divide(negate(c), s);
  const value = zzfloat(bound);
  if (!isdouble(value) || !Number.isFinite(value.d)) {
    return undefined;
  }
  return { x, op: sign < 0 ? flip(op) : op, bound };
}

const leaves = (c: Condition): Condition[] =>
  c.parts ? c.parts.reduce<Condition[]>((acc, q) => acc.concat(leaves(q)), []) : [c];

// on segment i of the line cut at the bounds: even i is the open interval
// below bound i/2, odd i is bound (i-1)/2 itself
function holds(c: Condition, i: number): boolean {
  switch (c.op) {
    case AND:
      return c.parts.every((q) => holds(q, i));
    case OR:
      return c.parts.some((q) => holds(q, i));
    case NOT:
      return !holds(c.parts[0], i);
  }
  const sign = Math.sign(i - (2 * c.index + 1));
  return {
    [TESTLT]: sign < 0,
    [TESTLE]: sign <= 0,
    [TESTGT]: sign > 0,
    [TESTGE]: sign >= 0,
    [TESTEQ]: sign === 0
  }[c.op];
}

// The parts with two or more conditions on the same variable replaced by
// their normal form (the one of solve: pieces from left to right), at the
// place of the first one. undefined when and(...) became 0 or or(...) 1.
function numberLine(parts: U[], isAnd: boolean): U[] | undefined {
  const conditions = parts.map(condition);
  const result: U[] = [];
  for (let i = 0; i < parts.length; i++) {
    const group = conditions.filter((c) => c && c.x === conditions[i]?.x);
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
    } else if (isNumericAtom(joined)) {
      if (isZeroAtomOrTensor(joined) === isAnd) {
        return undefined;
      }
    } else {
      const same = opName(joined) === (isAnd ? AND : OR);
      result.push(...(same && iscons(joined) ? joined.tail() : [joined]));
    }
  }
  return result;
}

function joinConditions(group: Condition[], isAnd: boolean): U | undefined {
  const all = group.reduce<Condition[]>((acc, c) => acc.concat(leaves(c)), []);
  let ordered = true;
  const compare = (a: U, b: U) => {
    const sign = cmp_values(a, b);
    ordered = ordered && sign != null;
    return sign ?? 0;
  };
  const sorted = all.map((c) => c.bound).sort(compare);
  const pts = sorted.filter((b, i) => i === 0 || compare(sorted[i - 1], b) !== 0);
  for (const c of all) {
    c.index = pts.findIndex((b) => compare(b, c.bound) === 0);
  }
  if (!ordered) {
    return undefined;
  }
  const segments: boolean[] = [];
  for (let i = 0; i <= 2 * pts.length; i++) {
    segments.push(isAnd ? group.every((c) => holds(c, i)) : group.some((c) => holds(c, i)));
  }
  return joinPieces(group[0].x, pts, segments);
}
