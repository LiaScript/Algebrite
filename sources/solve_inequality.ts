import {
  AND,
  caddr,
  cadr,
  car,
  Constants,
  COS,
  iscons,
  isdouble,
  isNumericAtom,
  isrational,
  LOG,
  ispower,
  Num,
  OR,
  SIN,
  TAN,
  TESTEQ,
  TESTGE,
  TESTGT,
  TESTLE,
  TESTLT,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { subtract } from './add';
import { facts, violatesAssumptions } from './assume';
import { derivative } from './derivative';
import { divide, negate } from './multiply';
import { simplify } from './simplify';
import { double } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { zzfloat } from './float';
import { isinteger, isone } from './is';
import { makeList } from './list';
import { numerator } from './numerator';
import { rationalize } from './rationalize';
import { solveEquation } from './solve_transcendental';
import { subst } from './subst';

// solve(lhs < rhs, x) for a real x: the line is cut at the real roots of
// numerator and denominator of lhs-rhs, at the roots of every log or even
// radical argument (where the expression stops being real) and at 0, the
// inequality is tested on each open piece and at each cut, and the true
// pieces are joined. The answer is a comparison, and(...) of two, or(...)
// of several pieces, 1 when it always holds and 0 when it never does.
export function solveInequality(rel: U, x: U): U {
  return solveInequalities([rel], x);
}

// Several relations: the pieces of the line where all of them hold.
export function solveInequalities(rels: U[], x: U): U {
  const sides = rels.map((rel) => ({
    op: car(rel),
    E: subtract(Eval(cadr(rel)), Eval(caddr(rel)))
  }));

  if (sides.length === 1) {
    const linear = linearWithParameters(sides[0].op, sides[0].E, x);
    if (linear !== undefined) {
      return linear;
    }
  }

  const constant = sides.filter(({ E }) => !Find(E, x));
  for (const { op, E } of constant) {
    const t = truth(op, E);
    if (t === undefined) {
      stop('solve: inequalities with parameters are not supported');
    }
    if (!t) {
      return Constants.zero;
    }
  }
  const active = sides.filter(({ E }) => Find(E, x));
  if (active.length === 0) {
    return Constants.one;
  }
  if (active.some(({ E }) => hasTrig(E, x))) {
    stop('solve: periodic inequalities are not supported');
  }

  // per relation: the zeros of the numerator, and every other cut (poles and
  // the ends of the real domain)
  const cutSets = active.map(({ E }) => {
    const R = rationalize(E);
    return {
      zeros: realRoots(numerator(R), x),
      others: [denominator(R), ...domainArgs(E, x)].reduce<U[]>(
        (acc, p) => acc.concat(realRoots(p, x)),
        []
      )
    };
  });
  const cuts = cutSets
    .reduce<U[]>((acc, c) => acc.concat(c.zeros, c.others), [])
    .concat([Constants.zero]);
  const isAmong = (v: U, list: U[]) =>
    list.some((q) => Math.abs(toNumber(q) - toNumber(v)) <= 1e-12 * Math.max(1, Math.abs(toNumber(v))));
  const pts = cuts
    .filter((p, i) => cuts.findIndex((q) => toNumber(q) === toNumber(p)) === i)
    .sort((a, b) => toNumber(a) - toNumber(b));
  const n = pts.length;

  // segments alternate: interval before pts[0], pts[0], interval, ..., after
  let parametric = false;
  const holdsAt = (v: U) => {
    try {
      if (violatesAssumptions(v, x)) {
        return false;
      }
      return active.every(({ op, E }, i) => {
        // at a zero of E the value is exactly 0, whatever rounding says
        // about 3^x - 7^15 there: only <= and >= hold
        if (isAmong(v, cutSets[i].zeros) && !isAmong(v, cutSets[i].others)) {
          return op === symbol(TESTLE) || op === symbol(TESTGE);
        }
        const value = Eval(subst(E, x, v));
        const f = zzfloat(value);
        if (isdouble(f) && !Number.isFinite(f.d)) {
          return false; // log(0) and the like
        }
        // symbols left over: the sign depends on a parameter
        if (!isNumberLike(f)) {
          parametric = true;
        }
        return truth(op, value) === true;
      });
    } catch (e) {
      return false; // a pole
    }
  };
  const segments: boolean[] = [];
  for (let i = 0; i <= n; i++) {
    const lo = i === 0 ? toNumber(pts[0]) - 1 : toNumber(pts[i - 1]);
    const hi = i === n ? toNumber(pts[n - 1]) + 1 : toNumber(pts[i]);
    segments.push(holdsAt(double((lo + hi) / 2)));
    if (i < n) {
      segments.push(holdsAt(pts[i]));
    }
  }

  if (parametric) {
    stop('solve: inequalities with parameters are not supported');
  }

  return joinPieces(x, pts, segments);
}

// The runs of true segments as conditions on x: even indices are the open
// intervals (2*j is the one below pts[j]), odd indices 2*j+1 are pts[j].
// One piece, or(...) of several, 1 for the whole line, 0 for nothing.
export function joinPieces(x: U, pts: U[], segments: boolean[]): U {
  const pieces: U[] = [];
  let start = -1;
  for (let i = 0; i <= segments.length; i++) {
    if (i < segments.length && segments[i]) {
      if (start < 0) {
        start = i;
      }
      continue;
    }
    if (start >= 0) {
      pieces.push(piece(x, pts, start, i - 1));
      start = -1;
    }
  }
  if (pieces.length === 0) {
    return Constants.zero;
  }
  return pieces.length === 1 ? pieces[0] : makeList(symbol(OR), ...pieces);
}

// s*x + c op 0 with s free of x and symbols in the root: the sign of s
// decides the direction, x op -c/s or the flipped relation. undefined when
// E is not of that shape or has no parameters; stops when the sign of s is
// not known.
function linearWithParameters(op: U, E: U, x: U): U | undefined {
  const slope = derivative(E, x);
  if (!Find(E, x) || Find(slope, x)) {
    return undefined;
  }
  const root = simplify(negate(divide(Eval(subst(E, x, Constants.zero)), slope)));
  if (isdouble(zzfloat(root)) && isNumberLike(zzfloat(slope))) {
    return undefined; // all numbers: the general method handles it
  }
  const sign = facts(slope);
  if (!sign.positive && !sign.negative) {
    stop('solve: inequalities with parameters are not supported');
  }
  const flipped: { [op: string]: string } = {
    [TESTLT]: TESTGT,
    [TESTGT]: TESTLT,
    [TESTLE]: TESTGE,
    [TESTGE]: TESTLE
  };
  const name = (op as any).printname as string;
  return makeList(symbol(sign.positive ? name : flipped[name]), x, root);
}

// The condition for the run of segments a..b: even indices are open
// intervals (2*j is the one below pts[j]), odd indices 2*j+1 are pts[j].
function piece(x: U, pts: U[], a: number, b: number): U {
  const conds: U[] = [];
  if (a % 2 === 1) {
    conds.push(makeList(symbol(TESTGE), x, pts[(a - 1) / 2]));
  } else if (a > 0) {
    conds.push(makeList(symbol(TESTGT), x, pts[a / 2 - 1]));
  }
  if (b % 2 === 1) {
    if (a === b) {
      return makeList(symbol(TESTEQ), x, pts[(b - 1) / 2]);
    }
    conds.push(makeList(symbol(TESTLE), x, pts[(b - 1) / 2]));
  } else if (b / 2 < pts.length) {
    conds.push(makeList(symbol(TESTLT), x, pts[b / 2]));
  }
  if (conds.length === 0) {
    return Constants.one;
  }
  return conds.length === 1 ? conds[0] : makeList(symbol(AND), ...conds);
}

// true/false when v op 0 evaluates to 1/0, undefined when it cannot be
// decided (symbols), false when evaluating it fails (a pole)
function truth(op: U, v: U): boolean | undefined {
  try {
    const r = Eval(makeList(op, v, Constants.zero));
    if (isone(r)) {
      return true;
    }
    return isrational(r) || isdouble(r) ? false : undefined;
  } catch (e) {
    return false;
  }
}

function toNumber(p: U): number {
  const f = zzfloat(p);
  return isdouble(f) ? f.d : NaN;
}

// The real roots of p in x as exact values; a root with other symbols in it
// has no place on the line and stops.
function realRoots(p: U, x: U): U[] {
  if (!Find(p, x)) {
    return [];
  }
  let sols: U[];
  try {
    sols = solveEquation(p, x);
  } catch (e) {
    stop('solve: cannot solve the inequality for ' + x);
  }
  return sols.filter((s) => {
    const f = zzfloat(s);
    if (isdouble(f)) {
      return true;
    }
    if (!Find(f, x) && isNumberLike(f)) {
      return false; // complex
    }
    return stop('solve: inequalities with parameters are not supported');
  });
}

// a number after zzfloat: doubles combined by operators (complex values
// keep the (-1)^(1/2) of i), nothing symbolic
function isNumberLike(p: U): boolean {
  return isNumericAtom(p) || (iscons(p) && p.tail().every(isNumberLike));
}

function hasTrig(p: U, x: U): boolean {
  if (!iscons(p)) {
    return false;
  }
  if ([SIN, COS, TAN].some((f) => car(p) === symbol(f)) && Find(cadr(p), x)) {
    return true;
  }
  return p.tail().some((el) => hasTrig(el, x));
}

// arguments of log and of even radicals that contain x
function domainArgs(p: U, x: U, acc: U[] = []): U[] {
  if (!iscons(p)) {
    return acc;
  }
  if (car(p) === symbol(LOG) && Find(cadr(p), x)) {
    acc.push(cadr(p));
  }
  const e = caddr(p);
  if (
    ispower(p) &&
    Find(cadr(p), x) &&
    isrational(e) &&
    !isinteger(e) &&
    (e as Num).b.isEven()
  ) {
    acc.push(cadr(p));
  }
  p.tail().forEach((el) => domainArgs(el, x, acc));
  return acc;
}
