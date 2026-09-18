"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matrixExponential = exports.Eval_cholesky = exports.Eval_qr = exports.Eval_lu = exports.Eval_laplacian = exports.Eval_hessian = exports.Eval_jacobian = exports.Eval_norm = void 0;
const alloc_1 = require("../runtime/alloc");
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const assume_1 = require("./assume");
const bignum_1 = require("./bignum");
const conj_1 = require("./conj");
const det_1 = require("./det");
const eval_1 = require("./eval");
const factorial_1 = require("./factorial");
const float_1 = require("./float");
const inner_1 = require("./inner");
const inv_1 = require("./inv");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const rref_1 = require("./rref");
const simplify_1 = require("./simplify");
// Matrix helpers: rows of a square or rectangular rank-2 tensor.
function rowsOf(A) {
    const [n, m] = A.dim;
    return Array.from({ length: n }, (_, i) => A.elem.slice(i * m, (i + 1) * m));
}
function squareArg(p1, fn) {
    const A = eval_1.Eval(defs_1.cadr(p1));
    if (!defs_1.istensor(A) || A.ndim !== 2 || A.dim[0] !== A.dim[1]) {
        run_1.stop(`${fn}: square matrix expected`);
    }
    return A;
}
function identity(n) {
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? defs_1.Constants.one : defs_1.Constants.zero)));
}
// several matrices of one shape as a rank-3 tensor, so that F[1] is the first
function stack(mats) {
    const T = alloc_1.alloc_tensor(mats.length * mats[0].nelem);
    T.ndim = 3;
    T.dim = [mats.length, ...mats[0].dim];
    T.elem = [].concat(...mats.map((m) => m.elem));
    return T;
}
const sum = (terms) => terms.reduce(add_1.add, defs_1.Constants.zero);
// norm(v): sqrt of the sum of abs(element)^2, Euclidean for a vector and
// Frobenius for a matrix
function Eval_norm(p1) {
    misc_1.checkArgCount(p1, 1);
    const A = eval_1.Eval(defs_1.cadr(p1));
    const elems = defs_1.istensor(A) ? A.elem : [A];
    return simplify_1.simplify(power_1.power(sum(elems.map((el) => multiply_1.multiply(el, conj_1.conjugate(el)))), bignum_1.rational(1, 2)));
}
exports.Eval_norm = Eval_norm;
const d = (f, x) => eval_1.Eval(list_1.makeList(symbol_1.symbol(defs_1.DERIVATIVE), f, x));
// jacobian(f, vars) and gradient(f, vars): the derivative with respect to a
// vector; hessian(f, vars) is the jacobian of the gradient, laplacian its trace
function Eval_jacobian(p1) {
    misc_1.checkArgCount(p1, 2);
    return d(eval_1.Eval(defs_1.cadr(p1)), eval_1.Eval(defs_1.caddr(p1)));
}
exports.Eval_jacobian = Eval_jacobian;
function Eval_hessian(p1) {
    misc_1.checkArgCount(p1, 2);
    const vars = eval_1.Eval(defs_1.caddr(p1));
    return d(d(eval_1.Eval(defs_1.cadr(p1)), vars), vars);
}
exports.Eval_hessian = Eval_hessian;
function Eval_laplacian(p1) {
    misc_1.checkArgCount(p1, 2);
    const f = eval_1.Eval(defs_1.cadr(p1));
    const vars = eval_1.Eval(defs_1.caddr(p1));
    return sum((defs_1.istensor(vars) ? vars.elem : [vars]).map((v) => d(d(f, v), v)));
}
exports.Eval_laplacian = Eval_laplacian;
// lu(A) = [L, U, P] with P*A = L*U, L unit lower triangular. Rows are only
// swapped for a zero pivot: the arithmetic is exact.
function Eval_lu(p1) {
    misc_1.checkArgCount(p1, 1);
    const A = squareArg(p1, 'lu');
    const n = A.dim[0];
    const Um = rowsOf(A);
    const L = identity(n);
    const P = identity(n);
    for (let k = 0; k < n; k++) {
        const pivot = Um.findIndex((row, i) => i >= k && !is_1.isZeroAtomOrTensor(simplify_1.simplify(row[k])));
        if (pivot < 0) {
            run_1.stop('lu: the matrix is singular');
        }
        if (pivot !== k) {
            [Um[k], Um[pivot]] = [Um[pivot], Um[k]];
            [P[k], P[pivot]] = [P[pivot], P[k]];
            for (let j = 0; j < k; j++) {
                [L[k][j], L[pivot][j]] = [L[pivot][j], L[k][j]];
            }
        }
        for (let i = k + 1; i < n; i++) {
            const factor = simplify_1.simplify(multiply_1.divide(Um[i][k], Um[k][k]));
            L[i][k] = factor;
            Um[i] = Um[i].map((v, j) => simplify_1.simplify(add_1.subtract(v, multiply_1.multiply(factor, Um[k][j]))));
        }
    }
    return stack([rref_1.matrix(L), rref_1.matrix(Um), rref_1.matrix(P)]);
}
exports.Eval_lu = Eval_lu;
// qr(A) = [Q, R] by Gram-Schmidt on the columns: Q has orthonormal columns,
// R = transpose(Q)*A is upper triangular
function Eval_qr(p1) {
    misc_1.checkArgCount(p1, 1);
    const A = squareArg(p1, 'qr');
    const n = A.dim[0];
    const rows = rowsOf(A);
    const column = (j) => rows.map((r) => r[j]);
    const dot = (u, v) => sum(u.map((x, i) => multiply_1.multiply(conj_1.conjugate(x), v[i])));
    const Q = [];
    for (let j = 0; j < n; j++) {
        let u = column(j);
        for (const q of Q) {
            const c = dot(q, column(j));
            u = u.map((x, i) => add_1.subtract(x, multiply_1.multiply(c, q[i])));
        }
        const len = simplify_1.simplify(power_1.power(dot(u, u), bignum_1.rational(1, 2)));
        if (is_1.isZeroAtomOrTensor(len)) {
            run_1.stop('qr: the columns are linearly dependent');
        }
        Q.push(u.map((x) => simplify_1.simplify(multiply_1.divide(x, len))));
    }
    const Qm = rref_1.matrix(rows.map((_, i) => Q.map((q) => q[i])));
    const R = rref_1.matrix(Q.map((q) => rows[0].map((_, j) => simplify_1.simplify(dot(q, column(j))))));
    return stack([Qm, R]);
}
exports.Eval_qr = Eval_qr;
// cholesky(A) = L, lower triangular with L*transpose(L) = A, for a symmetric
// positive definite A
function Eval_cholesky(p1) {
    misc_1.checkArgCount(p1, 1);
    const A = squareArg(p1, 'cholesky');
    const n = A.dim[0];
    const a = rowsOf(A);
    const L = identity(n).map((r) => r.map(() => defs_1.Constants.zero));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            if (!misc_1.equal(a[i][j], a[j][i])) {
                run_1.stop('cholesky: the matrix is not symmetric');
            }
            const s = sum(Array.from({ length: j }, (_, k) => multiply_1.multiply(L[i][k], L[j][k])));
            const rest = simplify_1.simplify(add_1.subtract(a[i][j], s));
            if (i === j) {
                const f = float_1.zzfloat(rest);
                if (defs_1.isdouble(f) ? f.d <= 0 : assume_1.isPositive(rest) !== true) {
                    run_1.stop('cholesky: the matrix is not positive definite');
                }
                L[i][j] = simplify_1.simplify(power_1.power(rest, bignum_1.rational(1, 2)));
            }
            else {
                L[i][j] = simplify_1.simplify(multiply_1.divide(rest, L[j][j]));
            }
        }
    }
    return rref_1.matrix(L);
}
exports.Eval_cholesky = Eval_cholesky;
// exp(A): the finite series for a nilpotent A, otherwise P*exp(D)*inv(P)
// from the eigenvalues and eigenvectors.
// ponytail: a matrix that is neither nilpotent nor diagonalizable stops;
// the Jordan form would cover it
function matrixExponential(A) {
    if (A.ndim !== 2 || A.dim[0] !== A.dim[1]) {
        run_1.stop('exp: square matrix expected');
    }
    const n = A.dim[0];
    let term = rref_1.matrix(identity(n));
    let series = term;
    for (let k = 1; k <= n; k++) {
        term = inner_1.inner(term, A);
        if (is_1.isZeroAtomOrTensor(term)) {
            return series;
        }
        series = add_1.add(series, multiply_1.divide(term, factorial_1.factorial(bignum_1.integer(k))));
    }
    const values = eval_1.Eval(list_1.makeList(symbol_1.symbol('eigenvalues'), A));
    const vectors = eval_1.Eval(list_1.makeList(symbol_1.symbol('eigenvectors'), A));
    if (!defs_1.istensor(values) || !defs_1.istensor(vectors) || vectors.dim[0] !== n) {
        run_1.stop('exp: the matrix is not diagonalizable');
    }
    // eigenvectors come as rows, P needs them as columns
    const vrows = rowsOf(vectors);
    const P = rref_1.matrix(vrows[0].map((_, i) => vrows.map((v) => v[i])));
    if (is_1.isZeroAtomOrTensor(simplify_1.simplify(det_1.det(P)))) {
        run_1.stop('exp: the matrix is not diagonalizable');
    }
    const D = rref_1.matrix(identity(n).map((r, i) => r.map((_, j) => (i === j ? power_1.power(symbol_1.symbol(defs_1.E), values.elem[i]) : defs_1.Constants.zero))));
    return simplify_1.simplify(inner_1.inner(inner_1.inner(P, D), inv_1.inv(P)));
}
exports.matrixExponential = matrixExponential;
