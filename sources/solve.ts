import {
  caddr,
  cadr,
  car,
  Constants,
  issymbol,
  istensor,
  NIL,
  Tensor,
  TESTEQ,
  U
} from '../runtime/defs';
import { alloc_tensor } from '../runtime/alloc';
import { stop } from '../runtime/run';
import { collectUserSymbols, symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { derivative } from './derivative';
import { det } from './det';
import { Eval } from './eval';
import { inner } from './inner';
import { inv } from './inv';
import { ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { multiply, negate } from './multiply';
import { violatesAssumptions } from './assume';
import { equationToExpr, keepAssumedRoots, normalizeEquation, roots } from './roots';
import { build_tensor } from './scan';
import { simplify } from './simplify';
import { subst } from './subst';
import { check_tensor_dimensions } from './tensor';

// solve(expr, x) / solve(lhs == rhs, x): polynomial equation solving only.
// Delegates to roots() for the actual solving — see roots.ts. Non-polynomial
// equations (e.g. transcendental) are explicitly out of scope for now.
//
// solve([eq1, eq2, ...], [x, y, ...]): linear system, see solveLinearSystem.
// Equations may use = or ==; without the variable list the variables are
// collected from the equations in order of first appearance.
export function Eval_solve(p1: U) {
  // A literal list of equations is converted element-wise before anything is
  // evaluated: Eval of [x+y=3] would treat x+y=3 as a function definition.
  const eqsArg = cadr(p1);
  const vars = Eval(caddr(p1));
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

  if (!ispolyexpandedform(POLY1, X1)) {
    stop(
      'solve: 1st argument is not a polynomial in the variable ' +
        X1 +
        ' — solve() currently only supports polynomial equations'
    );
  }

  return keepAssumedRoots(roots(POLY1, X1), X1, 'solve');
}

// Variables in order of first appearance.
function freeSymbols(p: U): U[] {
  const acc: U[] = [];
  collectUserSymbols(p, acc);
  return acc;
}

// Returns the solution vector in variable order. Coefficients come from the
// derivatives, constants from the equations at all-zero variables; rebuilding
// each equation from those and comparing catches any nonlinear term.
function solveLinearSystem(eqs: Tensor, vars: Tensor): U {
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

  eqs.elem.forEach((e, i) => {
    const eq =
      car(e) === symbol(TESTEQ) ? subtract(cadr(e), caddr(e)) : e;
    let rebuilt = Eval(
      vars.elem.reduce((acc, v) => subst(acc, v, Constants.zero), eq)
    );
    b.elem[i] = negate(rebuilt);
    vars.elem.forEach((v, j) => {
      const c = derivative(eq, v);
      A.elem[i * n + j] = c;
      rebuilt = add(rebuilt, multiply(c, v));
    });
    if (!isZeroAtomOrTensor(simplify(subtract(rebuilt, eq)))) {
      stop('solve: system is not linear in the given variables');
    }
  });
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
