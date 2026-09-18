"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_div = exports.Eval_curl = exports.Eval_cross = void 0;
const alloc_1 = require("../runtime/alloc");
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const derivative_1 = require("./derivative");
const eval_1 = require("./eval");
const list_1 = require("./list");
const multiply_1 = require("./multiply");
const tensor_1 = require("./tensor");
/* cross, curl, div ==========================================================

cross(u,v) is the cross product of 3-vectors u and v, curl(v) and div(v) the
curl and divergence of the vector field v in x, y and z.
Anything but a 3-vector stops, instead of silently using the first three
components. Non-tensor arguments are left unevaluated.

*/
function Eval_cross(p1) {
    const u = eval_1.Eval(defs_1.cadr(p1));
    const v = eval_1.Eval(defs_1.caddr(p1));
    const a = vec3(u, 'cross');
    const b = vec3(v, 'cross');
    if (!a || !b) {
        return list_1.makeList(symbol_1.symbol(defs_1.CROSS), u, v);
    }
    const c = (i, j) => add_1.subtract(multiply_1.multiply(a[i], b[j]), multiply_1.multiply(a[j], b[i]));
    return vector([c(1, 2), c(2, 0), c(0, 1)]);
}
exports.Eval_cross = Eval_cross;
function Eval_curl(p1) {
    const v = eval_1.Eval(defs_1.cadr(p1));
    const a = vec3(v, 'curl');
    if (!a) {
        return list_1.makeList(symbol_1.symbol(defs_1.CURL), v);
    }
    const [x, y, z] = ['x', 'y', 'z'].map(symbol_1.usr_symbol);
    const c = (i, s, j, t) => add_1.subtract(derivative_1.derivative(a[i], s), derivative_1.derivative(a[j], t));
    return vector([c(2, y, 1, z), c(0, z, 2, x), c(1, x, 0, y)]);
}
exports.Eval_curl = Eval_curl;
function Eval_div(p1) {
    const v = eval_1.Eval(defs_1.cadr(p1));
    const a = vec3(v, 'div');
    if (!a) {
        return list_1.makeList(symbol_1.symbol(defs_1.DIV), v);
    }
    return ['x', 'y', 'z']
        .map((s, i) => derivative_1.derivative(a[i], symbol_1.usr_symbol(s)))
        .reduce((acc, t) => add_1.add(acc, t));
}
exports.Eval_div = Eval_div;
function vec3(p, name) {
    if (!defs_1.istensor(p)) {
        return undefined;
    }
    if (p.tensor.ndim !== 1 || p.tensor.dim[0] !== 3) {
        run_1.stop(name + ': 3-vector expected');
    }
    return p.tensor.elem;
}
function vector(elem) {
    const T = alloc_1.alloc_tensor(3);
    T.tensor.ndim = 1;
    T.tensor.dim[0] = 3;
    T.tensor.elem = elem;
    tensor_1.check_tensor_dimensions(T);
    return T;
}
