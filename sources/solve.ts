import {
  caddr,
  cadr,
  car,
  Constants,
  istensor,
  Tensor,
  TESTEQ,
  U
} from '../runtime/defs';
import { alloc_tensor } from '../runtime/alloc';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { derivative } from './derivative';
import { det } from './det';
import { Eval } from './eval';
import { inner } from './inner';
import { inv } from './inv';
import { ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { multiply, negate } from './multiply';
import { normalizeEquation, roots } from './roots';
import { simplify } from './simplify';
import { subst } from './subst';
import { check_tensor_dimensions } from './tensor';

// solve(expr, x) / solve(lhs == rhs, x): polynomial equation solving only.
// Delegates to roots() for the actual solving — see roots.ts. Non-polynomial
// equations (e.g. transcendental) are explicitly out of scope for now.
//
// solve([eq1, eq2, ...], [x, y, ...]): linear system, see solveLinearSystem.
export function Eval_solve(p1: U) {
  // The 2nd arg is checked first: evaluating the 1st arg of solve(x=3,x)
  // would perform the assignment, so leave that to normalizeEquation.
  const vars = Eval(caddr(p1));
  if (istensor(vars)) {
    const eqs = Eval(cadr(p1));
    if (!istensor(eqs)) {
      stop('solve: a list of variables needs a list of equations');
    }
    return solveLinearSystem(eqs, vars);
  }

  const [POLY1, X1] = normalizeEquation(p1);

  if (!ispolyexpandedform(POLY1, X1)) {
    stop(
      'solve: 1st argument is not a polynomial in the variable ' +
        X1 +
        ' — solve() currently only supports polynomial equations'
    );
  }

  return roots(POLY1, X1);
}

// Returns the solution vector in variable order. Coefficients come from the
// derivatives, constants from the equations at all-zero variables; rebuilding
// each equation from those and comparing catches any nonlinear term.
function solveLinearSystem(eqs: Tensor, vars: Tensor): U {
  const n = vars.nelem;
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
  return inner(inv(A), b);
}
