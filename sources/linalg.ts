import { alloc_tensor } from '../runtime/alloc';
import {
  caddr,
  cadr,
  Constants,
  DERIVATIVE,
  E,
  isdouble,
  istensor,
  Tensor,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { isPositive } from './assume';
import { integer, rational } from './bignum';
import { conjugate } from './conj';
import { det } from './det';
import { Eval } from './eval';
import { factorial } from './factorial';
import { zzfloat } from './float';
import { inner } from './inner';
import { inv } from './inv';
import { isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { checkArgCount, equal } from './misc';
import { divide, multiply } from './multiply';
import { power } from './power';
import { matrix } from './rref';
import { simplify } from './simplify';

// Matrix helpers: rows of a square or rectangular rank-2 tensor.
function rowsOf(A: Tensor): U[][] {
  const [n, m] = A.dim;
  return Array.from({ length: n }, (_, i) => A.elem.slice(i * m, (i + 1) * m));
}

function squareArg(p1: U, fn: string): Tensor {
  const A = Eval(cadr(p1));
  if (!istensor(A) || A.ndim !== 2 || A.dim[0] !== A.dim[1]) {
    stop(`${fn}: square matrix expected`);
  }
  return A;
}

function identity(n: number): U[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? Constants.one : Constants.zero))
  );
}

// several matrices of one shape as a rank-3 tensor, so that F[1] is the first
function stack(mats: Tensor[]): Tensor {
  const T = alloc_tensor(mats.length * mats[0].nelem);
  T.ndim = 3;
  T.dim = [mats.length, ...mats[0].dim];
  T.elem = ([] as U[]).concat(...mats.map((m) => m.elem));
  return T;
}

const sum = (terms: U[]) => terms.reduce(add, Constants.zero);

// norm(v): sqrt of the sum of abs(element)^2, Euclidean for a vector and
// Frobenius for a matrix
export function Eval_norm(p1: U) {
  checkArgCount(p1, 1);
  const A = Eval(cadr(p1));
  const elems = istensor(A) ? A.elem : [A];
  return simplify(
    power(sum(elems.map((el) => multiply(el, conjugate(el)))), rational(1, 2))
  );
}

const d = (f: U, x: U) => Eval(makeList(symbol(DERIVATIVE), f, x));

// jacobian(f, vars) and gradient(f, vars): the derivative with respect to a
// vector; hessian(f, vars) is the jacobian of the gradient, laplacian its trace
export function Eval_jacobian(p1: U) {
  checkArgCount(p1, 2);
  return d(Eval(cadr(p1)), Eval(caddr(p1)));
}

export function Eval_hessian(p1: U) {
  checkArgCount(p1, 2);
  const vars = Eval(caddr(p1));
  return d(d(Eval(cadr(p1)), vars), vars);
}

export function Eval_laplacian(p1: U) {
  checkArgCount(p1, 2);
  const f = Eval(cadr(p1));
  const vars = Eval(caddr(p1));
  return sum((istensor(vars) ? vars.elem : [vars]).map((v) => d(d(f, v), v)));
}

// lu(A) = [L, U, P] with P*A = L*U, L unit lower triangular. Rows are only
// swapped for a zero pivot: the arithmetic is exact.
export function Eval_lu(p1: U) {
  checkArgCount(p1, 1);
  const A = squareArg(p1, 'lu');
  const n = A.dim[0];
  const Um = rowsOf(A);
  const L = identity(n);
  const P = identity(n);
  for (let k = 0; k < n; k++) {
    const pivot = Um.findIndex((row, i) => i >= k && !isZeroAtomOrTensor(simplify(row[k])));
    if (pivot < 0) {
      stop('lu: the matrix is singular');
    }
    if (pivot !== k) {
      [Um[k], Um[pivot]] = [Um[pivot], Um[k]];
      [P[k], P[pivot]] = [P[pivot], P[k]];
      for (let j = 0; j < k; j++) {
        [L[k][j], L[pivot][j]] = [L[pivot][j], L[k][j]];
      }
    }
    for (let i = k + 1; i < n; i++) {
      const factor = simplify(divide(Um[i][k], Um[k][k]));
      L[i][k] = factor;
      Um[i] = Um[i].map((v, j) => simplify(subtract(v, multiply(factor, Um[k][j]))));
    }
  }
  return stack([matrix(L), matrix(Um), matrix(P)]);
}

// qr(A) = [Q, R] by Gram-Schmidt on the columns: Q has orthonormal columns,
// R = transpose(Q)*A is upper triangular
export function Eval_qr(p1: U) {
  checkArgCount(p1, 1);
  const A = squareArg(p1, 'qr');
  const n = A.dim[0];
  const rows = rowsOf(A);
  const column = (j: number) => rows.map((r) => r[j]);
  const dot = (u: U[], v: U[]) => sum(u.map((x, i) => multiply(conjugate(x), v[i])));
  const Q: U[][] = [];
  for (let j = 0; j < n; j++) {
    let u = column(j);
    for (const q of Q) {
      const c = dot(q, column(j));
      u = u.map((x, i) => subtract(x, multiply(c, q[i])));
    }
    const len = simplify(power(dot(u, u), rational(1, 2)));
    if (isZeroAtomOrTensor(len)) {
      stop('qr: the columns are linearly dependent');
    }
    Q.push(u.map((x) => simplify(divide(x, len))));
  }
  const Qm = matrix(rows.map((_, i) => Q.map((q) => q[i])));
  const R = matrix(Q.map((q) => rows[0].map((_, j) => simplify(dot(q, column(j))))));
  return stack([Qm, R]);
}

// cholesky(A) = L, lower triangular with L*transpose(L) = A, for a symmetric
// positive definite A
export function Eval_cholesky(p1: U) {
  checkArgCount(p1, 1);
  const A = squareArg(p1, 'cholesky');
  const n = A.dim[0];
  const a = rowsOf(A);
  const L = identity(n).map((r) => r.map(() => Constants.zero as U));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      if (!equal(a[i][j], a[j][i])) {
        stop('cholesky: the matrix is not symmetric');
      }
      const s = sum(Array.from({ length: j }, (_, k) => multiply(L[i][k], L[j][k])));
      const rest = simplify(subtract(a[i][j], s));
      if (i === j) {
        const f = zzfloat(rest);
        if (isdouble(f) ? f.d <= 0 : isPositive(rest) !== true) {
          stop('cholesky: the matrix is not positive definite');
        }
        L[i][j] = simplify(power(rest, rational(1, 2)));
      } else {
        L[i][j] = simplify(divide(rest, L[j][j]));
      }
    }
  }
  return matrix(L);
}

// exp(A): the finite series for a nilpotent A, otherwise P*exp(D)*inv(P)
// from the eigenvalues and eigenvectors.
// ponytail: a matrix that is neither nilpotent nor diagonalizable stops;
// the Jordan form would cover it
export function matrixExponential(A: Tensor): U {
  if (A.ndim !== 2 || A.dim[0] !== A.dim[1]) {
    stop('exp: square matrix expected');
  }
  const n = A.dim[0];
  let term: U = matrix(identity(n));
  let series: U = term;
  for (let k = 1; k <= n; k++) {
    term = inner(term, A);
    if (isZeroAtomOrTensor(term)) {
      return series;
    }
    series = add(series, divide(term, factorial(integer(k))));
  }
  const values = Eval(makeList(symbol('eigenvalues'), A));
  const vectors = Eval(makeList(symbol('eigenvectors'), A));
  if (!istensor(values) || !istensor(vectors) || vectors.dim[0] !== n) {
    stop('exp: the matrix is not diagonalizable');
  }
  // eigenvectors come as rows, P needs them as columns
  const vrows = rowsOf(vectors);
  const P = matrix(vrows[0].map((_, i) => vrows.map((v) => v[i])));
  if (isZeroAtomOrTensor(simplify(det(P)))) {
    stop('exp: the matrix is not diagonalizable');
  }
  const D = matrix(
    identity(n).map((r, i) =>
      r.map((_, j) => (i === j ? power(symbol(E), values.elem[i]) : Constants.zero))
    )
  );
  return simplify(inner(inner(P, D), inv(P)));
}
