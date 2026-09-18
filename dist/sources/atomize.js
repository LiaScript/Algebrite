"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomize = exports.Eval_atomize = void 0;
const alloc_1 = require("../runtime/alloc");
const defs_1 = require("../runtime/defs");
const eval_1 = require("./eval");
// atomize(expr): the top-level arguments of expr as a vector,
// the single argument if there is only one, or expr itself if it is an atom.
function Eval_atomize(p1) {
    return atomize(eval_1.Eval(defs_1.cadr(p1)));
}
exports.Eval_atomize = Eval_atomize;
function atomize(p1) {
    if (!defs_1.iscons(p1)) {
        return p1;
    }
    const args = p1.tail();
    if (args.length === 1) {
        return args[0];
    }
    const t = alloc_1.alloc_tensor(args.length);
    t.tensor.ndim = 1;
    t.tensor.dim[0] = args.length;
    t.tensor.elem = args;
    return t;
}
exports.atomize = atomize;
