import {
  ABS,
  AND,
  caddr,
  cadr,
  car,
  Constants,
  INF,
  iscons,
  isadd,
  isdouble,
  ismultiply,
  isNumericAtom,
  ispower,
  isstr,
  issymbol,
  istensor,
  MAX,
  MIN,
  NOT,
  OR,
  SGN,
  TESTEQ,
  TESTGE,
  TESTGT,
  TESTLE,
  TESTLT,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { get_binding, symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { isReal } from './assume';
import { double } from './bignum';
import { derivative } from './derivative';
import { Eval } from './eval';
import { zzfloat } from './float';
import { integral } from './integral';
import { isplusone, isZeroAtomOrTensor } from './is';
import { limit } from './limit';
import { makeList } from './list';
import { checkArgCount, equal } from './misc';
import { divide, negate } from './multiply';
import { subst } from './subst';

/* piecewise =====================================================================

Parameters
----------
value1, condition1, value2, condition2, ..., [default]

General description
-------------------
A function defined by cases. The conditions are tested in order: the first
true one selects its value, a false one drops its branch, an undecided one
keeps the branch symbolic. A trailing unpaired argument is the value
otherwise. The values of branches that are not taken are not evaluated.

*/
const NAME = 'piecewise';
const USAGE = 'value1, condition1, ..., [default]';

type Branch = [value: U, condition: U];

// a call of the builtin, not of a function the user bound to the name
export function isPiecewise(p: U): boolean {
  const head = car(p);
  return iscons(p) && issymbol(head) && head.printname === NAME && get_binding(head) === head;
}

export function hasPiecewise(p: U): boolean {
  return iscons(p) && (isPiecewise(p) || p.tail().some(hasPiecewise));
}

function branches(p: U): { pairs: Branch[]; otherwise?: U } {
  const args = iscons(p) ? p.tail() : [];
  const pairs: Branch[] = [];
  for (let i = 0; i + 1 < args.length; i += 2) {
    pairs.push([args[i], args[i + 1]]);
  }
  return { pairs, otherwise: args.length % 2 ? args[args.length - 1] : undefined };
}

// the same value in every branch and otherwise is that value
function build(pairs: Branch[], otherwise?: U): U {
  if (otherwise !== undefined && pairs.every(([v]) => equal(v, otherwise))) {
    return otherwise;
  }
  const args = ([] as U[]).concat(...pairs);
  return makeList(usr_symbol(NAME), ...args, ...(otherwise === undefined ? [] : [otherwise]));
}

export function Eval_piecewise(p1: U): U {
  const { pairs, otherwise } = branches(p1);
  if (pairs.length === 0 && otherwise === undefined) {
    stop(`piecewise: expected ${USAGE}`);
  }
  const kept: Branch[] = [];
  for (const [value, condition] of pairs) {
    const c = evalCondition(condition);
    if (!isNumericAtom(c)) {
      kept.push([Eval(value), c]);
    } else if (!isZeroAtomOrTensor(c)) {
      return build(kept, Eval(value)); // true: the value otherwise
    }
  }
  if (kept.length === 0 && otherwise === undefined) {
    stop('piecewise: no condition holds and there is no default value');
  }
  return build(kept, otherwise === undefined ? undefined : Eval(otherwise));
}

const isRelation = (p: U) =>
  [TESTLT, TESTLE, TESTGT, TESTGE, TESTEQ].some((r) => car(p) === symbol(r));

// 1, 0 or the condition as the evaluator leaves it: comparisons cancel,
// and/or/not join their bounds and lose their decided parts
// (logic_simplify.ts). What cannot be a condition stops: 2, x+1, -x
function evalCondition(c: U): U {
  const v = Eval(c);
  if (iscons(v) && !equal(v, c) && (isRelation(v) || [AND, OR, NOT].some((h) => car(v) === symbol(h)))) {
    return evalCondition(v); // a symbol bound to a condition
  }
  const bad = isNumericAtom(v)
    ? !isZeroAtomOrTensor(v) && !isplusone(v)
    : istensor(v) || isstr(v) || isadd(v) || ismultiply(v) || ispower(v);
  if (bad) {
    stop(`piecewise: ${v} is not a condition, the arguments are ${USAGE}`);
  }
  return v;
}

// f applied to the value of every branch, conditions kept
export function mapPiecewiseValues(p: U, f: (value: U) => U): U {
  const { pairs, otherwise } = branches(p);
  return build(
    pairs.map(([v, c]): Branch => [f(v), c]),
    otherwise === undefined ? undefined : f(otherwise)
  );
}

// mapPiecewiseValues on every piecewise inside p
export function mapPiecewise(p: U, f: (value: U) => U): U {
  if (!iscons(p)) {
    return p;
  }
  if (isPiecewise(p)) {
    return mapPiecewiseValues(p, f);
  }
  return makeList(car(p), ...p.tail().map((q) => mapPiecewise(q, f)));
}

// the (unevaluated) value of the branch that holds at X = at, undefined
// when a condition is undecided there or no branch holds
export function activeBranch(p: U, X: U, at: U): U | undefined {
  const { pairs, otherwise } = branches(p);
  for (const [value, condition] of pairs) {
    const c = evalCondition(subst(condition, X, at));
    if (!isNumericAtom(c)) {
      return undefined;
    }
    if (!isZeroAtomOrTensor(c)) {
      return value;
    }
  }
  return otherwise;
}

// p with every piecewise replaced by its branch at X = at
export function resolvePiecewise(p: U, X: U, at: U): U | undefined {
  if (!iscons(p)) {
    return p;
  }
  if (isPiecewise(p)) {
    const branch = activeBranch(p, X, at);
    return branch === undefined ? undefined : resolvePiecewise(branch, X, at);
  }
  const parts = p.tail().map((q) => resolvePiecewise(q, X, at));
  return parts.some((q) => q === undefined) ? undefined : makeList(car(p), ...parts);
}

type Cut = { u: U; d: number };

// The break points of the piecewise functions in p: the zeros of l-r for
// every comparison of their conditions, sorted. undefined when one cannot
// be found.
// ponytail: only comparisons linear in X with numeric coefficients, roots()
// on l-r would add polynomial conditions such as x^2<1
function breakPoints(p: U, X: U): Cut[] | undefined {
  const cuts: Cut[] = [];
  const walk = (q: U, inCondition: boolean): boolean => {
    if (!iscons(q) || !Find(q, X)) {
      return true;
    }
    if (isPiecewise(q)) {
      return q.tail().every((arg, i) => walk(arg, inCondition || i % 2 === 1));
    }
    if (!inCondition) {
      return q.tail().every((arg) => walk(arg, false));
    }
    if ([AND, OR, NOT].some((h) => car(q) === symbol(h))) {
      return q.tail().every((arg) => walk(arg, true));
    }
    if (!isRelation(q)) {
      return false;
    }
    const g = subtract(cadr(q), caddr(q));
    const slope = derivative(g, X);
    if (!isdouble(zzfloat(slope))) {
      return false;
    }
    if (isZeroAtomOrTensor(slope)) {
      return true;
    }
    const u = negate(divide(Eval(subst(g, X, Constants.zero)), slope));
    const d = zzfloat(u);
    if (!isdouble(d)) {
      return false;
    }
    if (!cuts.some((c) => c.d === d.d)) {
      cuts.push({ u, d: d.d });
    }
    return true;
  };
  return walk(p, false) ? cuts.sort((a, b) => a.d - b.d) : undefined;
}

// a point inside (lo, hi), either may be infinite
function inside(lo: number, hi: number): number {
  if (lo === -Infinity) {
    return hi === Infinity ? 0 : hi - 1;
  }
  return hi === Infinity ? lo + 1 : (lo + hi) / 2;
}

function pieceAt(F: U, X: U, at: number): U | undefined {
  const G = resolvePiecewise(F, X, double(at));
  return G === undefined ? undefined : Eval(G);
}

// The integral of F from A to B (a and b as numbers, infinite allowed): the
// interval is split at the break points and `definite` integrates the
// active branch on every piece. undefined when the break points or the
// branch of a piece cannot be found.
export function piecewiseDefint(
  F: U,
  X: U,
  [A, a]: [U, number],
  [B, b]: [U, number],
  definite: (F: U, A: U, B: U) => U
): U | undefined {
  if (a > b) {
    const reversed = piecewiseDefint(F, X, [B, b], [A, a], definite);
    return reversed === undefined ? undefined : negate(reversed);
  }
  if (a === b) {
    return Constants.zero;
  }
  const cuts = breakPoints(F, X);
  if (cuts === undefined) {
    return undefined;
  }
  const points = [{ u: A, d: a }, ...cuts.filter((c) => c.d > a && c.d < b), { u: B, d: b }];
  let total: U = Constants.zero;
  for (let i = 0; i + 1 < points.length; i++) {
    const G = pieceAt(F, X, inside(points[i].d, points[i + 1].d));
    if (G === undefined) {
      return undefined;
    }
    total = add(total, definite(G, points[i].u, points[i + 1].u));
  }
  return total;
}

// The continuous antiderivative: the antiderivative of the active branch
// between the break points, plus the constant that joins it to the piece
// on its left, as piecewise(G0, X<c1, G1+K1, X<c2, ...). undefined when the
// break points or a branch cannot be found, or a piece has no finite limit
// at its break point (log(x) at 0).
export function piecewiseIntegral(F: U, X: U): U | undefined {
  const cuts = breakPoints(F, X);
  if (cuts === undefined || cuts.length === 0) {
    return undefined;
  }
  const bounds = [-Infinity, ...cuts.map((c) => c.d), Infinity];
  const pieces = cuts.map((_, i) => i).concat(cuts.length).map((i) => pieceAt(F, X, inside(bounds[i], bounds[i + 1])));
  if (pieces.some((p) => p === undefined)) {
    return undefined;
  }
  let current = integral(pieces[0], X);
  const pairs: Branch[] = [];
  try {
    cuts.forEach((c, i) => {
      if (equal(pieces[i], pieces[i + 1])) {
        return; // a single point (x==0) or the break point of another piece
      }
      pairs.push([current, makeList(symbol(TESTLT), X, c.u)]);
      const next = integral(pieces[i + 1], X);
      const K = subtract(limit(current, X, c.u, [-1]), limit(next, X, c.u, [1]));
      if (Find(K, symbol(INF))) {
        throw new Error('no continuous antiderivative');
      }
      current = add(next, K);
    });
  } catch (e) {
    return undefined;
  }
  return build(pairs, current);
}

// aspiecewise(expr): abs, sgn of real arguments and min, max of two
// arguments written as cases
export function Eval_aspiecewise(p1: U): U {
  checkArgCount(p1, 1);
  return Eval(asPiecewise(Eval(cadr(p1))));
}

function asPiecewise(p: U): U {
  if (!iscons(p)) {
    return p;
  }
  const args = p.tail().map(asPiecewise);
  const [a, b] = args;
  const cases = (...list: U[]) => makeList(usr_symbol(NAME), ...list);
  const rel = (name: string, l: U, r: U) => makeList(symbol(name), l, r);
  const { zero, one, negOne } = Constants;
  if (args.length === 1 && isReal(a) === true) {
    if (car(p) === symbol(ABS)) {
      return cases(negate(a), rel(TESTLT, a, zero), a);
    }
    if (car(p) === symbol(SGN)) {
      return cases(negOne, rel(TESTLT, a, zero), zero, rel(TESTEQ, a, zero), one);
    }
  }
  if (args.length === 2 && (car(p) === symbol(MIN) || car(p) === symbol(MAX))) {
    return cases(a, rel(car(p) === symbol(MIN) ? TESTLE : TESTGE, a, b), b);
  }
  return makeList(car(p), ...args);
}
