import {
  cadr,
  Constants,
  isNumericAtom,
  istensor,
  Tensor,
  U
} from '../runtime/defs';
import { alloc_tensor } from '../runtime/alloc';
import { stop } from '../runtime/run';
import { subtract } from './add';
import { integer } from './bignum';
import { Eval } from './eval';
import { isZeroAtomOrTensor } from './is';
import { divide, multiply, negate } from './multiply';
import { simplify } from './simplify';
import { check_tensor_dimensions } from './tensor';

// rref(M): reduced row echelon form, exact arithmetic.
export function Eval_rref(p1: U) {
  const [rows] = rowReduce(matrixArg(p1, 'rref'));
  return matrix(rows);
}

// matrixrank(M): number of pivots. (rank() is the tensor rank.)
export function Eval_matrixrank(p1: U) {
  const [, pivots] = rowReduce(matrixArg(p1, 'matrixrank'));
  return integer(pivots.length);
}

// nullspace(M): a matrix whose rows are a basis of the null space. One
// vector per free column: 1 there, minus the rref entries at the pivots.
// With no free column the only solution is the zero vector, returned as the
// single row, since there is no empty-list value.
export function Eval_nullspace(p1: U) {
  const M = matrixArg(p1, 'nullspace');
  const n = M.dim[1];
  const [rows, pivots] = rowReduce(M);
  const basis: U[][] = [];
  for (let free = 0; free < n; free++) {
    if (pivots.includes(free)) {
      continue;
    }
    const v: U[] = new Array(n).fill(Constants.zero);
    v[free] = Constants.one;
    pivots.forEach((col, i) => (v[col] = negate(rows[i][free])));
    basis.push(v);
  }
  return matrix(basis.length ? basis : [new Array(n).fill(Constants.zero)]);
}

function matrixArg(p1: U, name: string): Tensor {
  const M = Eval(cadr(p1));
  if (!istensor(M) || M.ndim !== 2) {
    stop(name + ': matrix expected');
  }
  return M as Tensor;
}

function matrix(rows: U[][]): Tensor {
  const n = rows[0].length;
  const T = alloc_tensor(rows.length * n);
  T.ndim = 2;
  T.dim = [rows.length, n];
  T.elem = ([] as U[]).concat(...rows);
  check_tensor_dimensions(T);
  return T;
}

// Gauss-Jordan elimination. Returns the reduced rows and the pivot columns.
// The pivot is the first entry of the column that is not identically zero,
// so a symbolic entry counts as nonzero, as in other CAS. Symbolic entries
// are simplified after each step, otherwise zeros such as d/(d-b*c/a)-...
// are not recognised.
function rowReduce(M: Tensor): [U[][], number[]] {
  const tidy = (e: U) => (isNumericAtom(e) ? e : simplify(e));
  const [m, n] = M.dim;
  const R: U[][] = [];
  for (let i = 0; i < m; i++) {
    R.push(M.elem.slice(i * n, (i + 1) * n));
  }

  const pivots: number[] = [];
  for (let c = 0, r = 0; c < n && r < m; c++) {
    const p = R.findIndex((row, i) => i >= r && !isZeroAtomOrTensor(row[c]));
    if (p < 0) {
      continue;
    }
    [R[r], R[p]] = [R[p], R[r]];
    const pivot = R[r][c];
    R[r] = R[r].map((e) => tidy(divide(e, pivot)));
    for (let i = 0; i < m; i++) {
      const f = R[i][c];
      if (i !== r && !isZeroAtomOrTensor(f)) {
        R[i] = R[i].map((e, j) => tidy(subtract(e, multiply(f, R[r][j]))));
      }
    }
    pivots.push(c);
    r++;
  }
  return [R, pivots];
}
