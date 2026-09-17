"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_nullspace = exports.Eval_matrixrank = exports.Eval_rref = void 0;
const defs_1 = require("../runtime/defs");
const alloc_1 = require("../runtime/alloc");
const run_1 = require("../runtime/run");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const simplify_1 = require("./simplify");
const tensor_1 = require("./tensor");
// rref(M): reduced row echelon form, exact arithmetic.
function Eval_rref(p1) {
    const [rows] = rowReduce(matrixArg(p1, 'rref'));
    return matrix(rows);
}
exports.Eval_rref = Eval_rref;
// matrixrank(M): number of pivots. (rank() is the tensor rank.)
function Eval_matrixrank(p1) {
    const [, pivots] = rowReduce(matrixArg(p1, 'matrixrank'));
    return bignum_1.integer(pivots.length);
}
exports.Eval_matrixrank = Eval_matrixrank;
// nullspace(M): a matrix whose rows are a basis of the null space. One
// vector per free column: 1 there, minus the rref entries at the pivots.
// With no free column the only solution is the zero vector, returned as the
// single row, since there is no empty-list value.
function Eval_nullspace(p1) {
    const M = matrixArg(p1, 'nullspace');
    const n = M.dim[1];
    const [rows, pivots] = rowReduce(M);
    const basis = [];
    for (let free = 0; free < n; free++) {
        if (pivots.includes(free)) {
            continue;
        }
        const v = new Array(n).fill(defs_1.Constants.zero);
        v[free] = defs_1.Constants.one;
        pivots.forEach((col, i) => (v[col] = multiply_1.negate(rows[i][free])));
        basis.push(v);
    }
    return matrix(basis.length ? basis : [new Array(n).fill(defs_1.Constants.zero)]);
}
exports.Eval_nullspace = Eval_nullspace;
function matrixArg(p1, name) {
    const M = eval_1.Eval(defs_1.cadr(p1));
    if (!defs_1.istensor(M) || M.ndim !== 2) {
        run_1.stop(name + ': matrix expected');
    }
    return M;
}
function matrix(rows) {
    const n = rows[0].length;
    const T = alloc_1.alloc_tensor(rows.length * n);
    T.ndim = 2;
    T.dim = [rows.length, n];
    T.elem = [].concat(...rows);
    tensor_1.check_tensor_dimensions(T);
    return T;
}
// Gauss-Jordan elimination. Returns the reduced rows and the pivot columns.
// The pivot is the first entry of the column that is not identically zero,
// so a symbolic entry counts as nonzero, as in other CAS. Symbolic entries
// are simplified after each step, otherwise zeros such as d/(d-b*c/a)-...
// are not recognised.
function rowReduce(M) {
    const tidy = (e) => (defs_1.isNumericAtom(e) ? e : simplify_1.simplify(e));
    const [m, n] = M.dim;
    const R = [];
    for (let i = 0; i < m; i++) {
        R.push(M.elem.slice(i * n, (i + 1) * n));
    }
    const pivots = [];
    for (let c = 0, r = 0; c < n && r < m; c++) {
        const p = R.findIndex((row, i) => i >= r && !is_1.isZeroAtomOrTensor(row[c]));
        if (p < 0) {
            continue;
        }
        [R[r], R[p]] = [R[p], R[r]];
        const pivot = R[r][c];
        R[r] = R[r].map((e) => tidy(multiply_1.divide(e, pivot)));
        for (let i = 0; i < m; i++) {
            const f = R[i][c];
            if (i !== r && !is_1.isZeroAtomOrTensor(f)) {
                R[i] = R[i].map((e, j) => tidy(add_1.subtract(e, multiply_1.multiply(f, R[r][j]))));
            }
        }
        pivots.push(c);
        r++;
    }
    return [R, pivots];
}
