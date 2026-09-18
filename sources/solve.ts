import {
  cadddr,
  caddr,
  cadr,
  car,
  Constants,
  iscons,
  issymbol,
  istensor,
  NIL,
  Tensor,
  TESTEQ,
  TESTGE,
  TESTGT,
  TESTLE,
  TESTLT,
  U
} from '../runtime/defs';
import { alloc_tensor } from '../runtime/alloc';
import { stop } from '../runtime/run';
import { Find } from '../runtime/find';
import { collectUserSymbols, is_usr_symbol, symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { derivative } from './derivative';
import { det } from './det';
import { Eval } from './eval';
import { evalExactly } from './float';
import { inner } from './inner';
import { inv } from './inv';
import { ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { multiply, negate } from './multiply';
import { violatesAssumptions } from './assume';
import { coeff } from './coeff';
import { cmp_expr } from './misc';
import { resultant } from './resultant';
import {
  equationToExpr,
  keepAssumedRoots,
  normalizeEquation,
  roots,
  rootsList
} from './roots';
import { matrix } from './rref';
import { build_tensor } from './scan';
import { simplify } from './simplify';
import { solveInequalities, solveInequality } from './solve_inequality';
import { solveWithFamily, tidySolutions } from './solve_transcendental';
import { subst } from './subst';
import { guess } from './guess';
import { check_tensor_dimensions } from './tensor';

// solve(expr, x) / solve(lhs == rhs, x): polynomial equations go to roots()
// (see roots.ts), everything else to solveEquation (solve_transcendental.ts)
// and inequalities to solveInequality (solve_inequality.ts).
//
// solve([eq1, eq2, ...], [x, y, ...]): linear system, see solveLinearSystem,
// or polynomial system, see solvePolySystem. Equations may use = or ==;
// without the variable list the variables are collected from the equations
// in order of first appearance.
// float(solve(...)) solves exactly and converts the solutions afterwards:
// the polynomial routines cannot work with float coefficients
export function Eval_solve(p1: U) {
  return evalExactly(solve, p1);
}

function solve(p1: U): U {
  // A literal list of equations is converted element-wise before anything is
  // evaluated: Eval of [x+y=3] would treat x+y=3 as a function definition.
  const eqsArg = cadr(p1);
  const vars = Eval(caddr(p1));
  if (isInequality(eqsArg)) {
    const x =
      vars === symbol(NIL)
        ? guess(subtract(Eval(cadr(eqsArg)), Eval(caddr(eqsArg))))
        : vars;
    return solveInequality(eqsArg, x);
  }
  // a list of inequalities in one variable: where all of them hold
  if (istensor(eqsArg) && eqsArg.elem.length > 0 && eqsArg.elem.every(isInequality)) {
    const first = eqsArg.elem[0];
    const x =
      vars === symbol(NIL)
        ? guess(subtract(Eval(cadr(first)), Eval(caddr(first))))
        : vars;
    return solveInequalities(eqsArg.elem, x);
  }
  if (istensor(eqsArg) || istensor(vars)) {
    const eqs = istensor(eqsArg)
      ? build_tensor(eqsArg.elem.map(equationToExpr))
      : Eval(eqsArg);
    if (!istensor(eqs)) {
      stop('solve: a list of variables needs a list of equations');
    }
    return solveLinearSystem(
      eqs,
      istensor(vars)
        ? vars
        : build_tensor(vars === symbol(NIL) ? freeSymbols(eqs) : [vars])
    );
  }

  const [POLY1, X1] = normalizeEquation(p1);

  if (!Find(POLY1, X1)) {
    stop('solve: 1st argument does not contain the variable ' + X1);
  }
  if (ispolyexpandedform(POLY1, X1)) {
    return keepAssumedRoots(roots(POLY1, X1), X1, 'solve');
  }
  // solve(eq, x, n): n names the integer of a periodic solution family
  const family = cadddr(p1) === symbol(NIL) ? undefined : Eval(cadddr(p1));
  if (family !== undefined) {
    if (!is_usr_symbol(family)) {
      stop('solve: 3rd argument must be a symbol');
    }
    if (Find(POLY1, family)) {
      stop(`solve: the parameter ${family} occurs in the equation`);
    }
  }
  const sols = tidySolutions(solveWithFamily(POLY1, X1, family), family);
  if (sols.length === 0) {
    stop('solve: no solution');
  }
  return keepAssumedRoots(
    sols.length === 1 ? sols[0] : build_tensor(sols),
    X1,
    'solve'
  );
}

function isInequality(p: U): boolean {
  return (
    iscons(p) &&
    [TESTLT, TESTLE, TESTGT, TESTGE].some((op) => car(p) === symbol(op))
  );
}

// Variables in order of first appearance.
function freeSymbols(p: U): U[] {
  const acc: U[] = [];
  collectUserSymbols(p, acc);
  return acc;
}

// Returns the solution vector in variable order. Coefficients come from the
// derivatives, constants from the equations at all-zero variables; rebuilding
// each equation from those and comparing catches any nonlinear term, which
// hands the system to solvePolySystem.
export function solveLinearSystem(eqs: Tensor, vars: Tensor): U {
  const n = vars.nelem;
  if (!vars.elem.every(issymbol) || new Set(vars.elem).size !== n) {
    stop('solve: variables must be distinct symbols');
  }
  if (eqs.nelem !== n) {
    stop('solve: need as many equations as variables');
  }

  const A = alloc_tensor(n * n);
  A.ndim = 2;
  A.dim = [n, n];
  const b = alloc_tensor(n);
  b.ndim = 1;
  b.dim = [n];

  const exprs = eqs.elem.map((e) =>
    car(e) === symbol(TESTEQ) ? subtract(cadr(e), caddr(e)) : e
  );
  let linear = true;
  exprs.forEach((eq, i) => {
    let rebuilt = Eval(
      vars.elem.reduce((acc, v) => subst(acc, v, Constants.zero), eq)
    );
    b.elem[i] = negate(rebuilt);
    vars.elem.forEach((v, j) => {
      const c = derivative(eq, v);
      A.elem[i * n + j] = c;
      rebuilt = add(rebuilt, multiply(c, v));
    });
    linear = linear && isZeroAtomOrTensor(simplify(subtract(rebuilt, eq)));
  });
  if (!linear) {
    return solvePolySystemMatrix(exprs, vars.elem);
  }
  check_tensor_dimensions(A);
  check_tensor_dimensions(b);

  if (isZeroAtomOrTensor(det(A))) {
    stop('solve: system has no unique solution');
  }
  const solution = inner(inv(A), b) as Tensor;
  vars.elem.forEach((v, i) => {
    if (violatesAssumptions(solution.elem[i], v)) {
      stop(`solve: no solution satisfies the assumptions about ${v}`);
    }
  });
  return solution;
}

// Solutions as a matrix, one row per solution, even for a single one.
function solvePolySystemMatrix(eqs: U[], vars: U[]): U {
  eqs.forEach((e) =>
    vars.forEach((v) => {
      if (Find(e, v) && !ispolyexpandedform(e, v)) {
        stop('solve: system is not polynomial in the given variables');
      }
    })
  );
  const rows = solvePolySystem(eqs, vars)
    .sort(cmpRows)
    .filter((r, i, all) => i === 0 || cmpRows(r, all[i - 1]) !== 0);
  if (rows.length === 0) {
    stop('solve: system has no solution');
  }
  const kept = rows.filter(
    (r) => !r.some((value, i) => violatesAssumptions(value, vars[i]))
  );
  if (kept.length === 0) {
    stop('solve: no solution satisfies the assumptions about ' + vars.join(','));
  }
  return matrix(kept);
}

function cmpRows(a: U[], b: U[]): number {
  for (let i = 0; i < a.length; i++) {
    const c = cmp_expr(a[i], b[i]);
    if (c !== 0) {
      return c;
    }
  }
  return 0;
}

// Rows of values in variable order. The last variable is eliminated with
// resultants against the equation of lowest degree in it, the smaller system
// is solved recursively, then each of its solutions is substituted back and
// the roots in the last variable that satisfy every equation are kept:
// the resultant can have roots that extend to no common solution.
// ponytail: the back check needs simplify() to reach exactly 0, nested
// radicals it can't denest drop real solutions; add a numeric check then.
function solvePolySystem(eqs: U[], vars: U[]): U[][] {
  const v = vars[vars.length - 1];
  const rest = vars.slice(0, -1);
  const partials = rest.length === 0 ? [[]] : solvePolySystem(eliminate(eqs, v), rest);
  const rows: U[][] = [];
  for (const partial of partials) {
    const sub = eqs.map((e) =>
      Eval(rest.reduce((acc, w, i) => subst(acc, w, partial[i]), e))
    );
    const pivot = pivotFor(sub, v);
    if (pivot === undefined) {
      if (sub.every((e) => isZeroAtomOrTensor(simplify(e)))) {
        stop('solve: system has infinitely many solutions');
      }
      continue;
    }
    for (const r of rootsList(pivot, v)) {
      if (sub.every((e) => isZeroAtomOrTensor(simplify(Eval(subst(e, v, r)))))) {
        rows.push([...partial, r]);
      }
    }
  }
  return rows;
}

function eliminate(eqs: U[], v: U): U[] {
  const pivot = pivotFor(eqs, v);
  return eqs
    .filter((e) => e !== pivot)
    .map((g) => {
      if (!Find(g, v)) {
        return g;
      }
      const r = resultant(pivot, g, v);
      if (isZeroAtomOrTensor(r)) {
        // a common factor in v: a whole curve of solutions
        stop('solve: system has infinitely many solutions');
      }
      return r;
    });
}

// The equation of lowest degree in v, undefined if none contains v.
function pivotFor(eqs: U[], v: U): U | undefined {
  const degree = (e: U) => coeff(e, v).length;
  return eqs
    .filter((e) => Find(e, v))
    .reduce<U | undefined>((best, e) => (best === undefined || degree(e) < degree(best) ? e : best), undefined);
}
