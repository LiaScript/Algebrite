import { U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { ispolyexpandedform } from './is';
import { normalizeEquation, roots } from './roots';

// solve(expr, x) / solve(lhs == rhs, x): polynomial equation solving only.
// Delegates to roots() for the actual solving — see roots.ts. Non-polynomial
// equations (e.g. transcendental) are explicitly out of scope for now.
export function Eval_solve(p1: U) {
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
