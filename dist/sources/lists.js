"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_map = exports.Eval_table = exports.Eval_range = exports.Eval_sort = exports.Eval_append = exports.Eval_length = void 0;
const defs_1 = require("../runtime/defs");
const alloc_1 = require("../runtime/alloc");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const float_1 = require("./float");
const list_1 = require("./list");
const misc_1 = require("./misc");
const scan_1 = require("./scan");
// List helpers. A list is a vector; build_tensor of vectors of one length
// gives a matrix, as the [..] syntax does.
// the elements of a vector, the rows of a matrix, or the value itself
function items(p) {
    if (!defs_1.istensor(p)) {
        return [p];
    }
    if (p.ndim === 1) {
        return p.elem;
    }
    const size = p.nelem / p.dim[0];
    return Array.from({ length: p.dim[0] }, (_, i) => {
        const row = alloc_1.alloc_tensor(size);
        row.ndim = p.ndim - 1;
        row.dim = p.dim.slice(1);
        row.elem = p.elem.slice(i * size, (i + 1) * size);
        return row;
    });
}
function Eval_length(p1) {
    misc_1.checkArgCount(p1, 1);
    const p = eval_1.Eval(defs_1.cadr(p1));
    return bignum_1.integer(defs_1.istensor(p) ? p.dim[0] : 1);
}
exports.Eval_length = Eval_length;
function Eval_append(p1) {
    const all = [];
    for (let p = defs_1.cdr(p1); defs_1.iscons(p); p = defs_1.cdr(p)) {
        all.push(...items(eval_1.Eval(defs_1.car(p))));
    }
    return scan_1.build_tensor(all);
}
exports.Eval_append = Eval_append;
// numbers by value, anything else in the canonical order of expressions
function Eval_sort(p1) {
    misc_1.checkArgCount(p1, 1);
    const list = items(eval_1.Eval(defs_1.cadr(p1)));
    const values = list.map((p) => {
        const f = float_1.zzfloat(p);
        return defs_1.isdouble(f) ? f.d : NaN;
    });
    const numeric = values.every((v) => !Number.isNaN(v));
    const order = list.map((_, i) => i);
    order.sort((i, j) => (numeric ? values[i] - values[j] : misc_1.cmp_expr(list[i], list[j])));
    return scan_1.build_tensor(order.map((i) => list[i]));
}
exports.Eval_sort = Eval_sort;
// range(n) = [1..n], range(a, b), range(a, b, step)
function Eval_range(p1) {
    misc_1.checkArgCount(p1, 1, 3);
    const args = [defs_1.cadr(p1), defs_1.caddr(p1), defs_1.cadddr(p1)].filter((p) => p !== symbol_1.symbol(defs_1.NIL)).map(eval_1.Eval);
    const [a, b, step] = args.length === 1 ? [defs_1.Constants.one, args[0], defs_1.Constants.one] : [args[0], args[1], args[2] || defs_1.Constants.one];
    const num = (p) => {
        const f = float_1.zzfloat(p);
        return defs_1.isdouble(f) ? f.d : NaN;
    };
    const s = num(step);
    if ([num(a), num(b), s].some(Number.isNaN) || s === 0) {
        return list_1.makeList(symbol_1.usr_symbol('range'), ...args);
    }
    const result = [];
    for (let v = a; s > 0 ? num(v) <= num(b) + 1e-12 : num(v) >= num(b) - 1e-12; v = add_1.add(v, step)) {
        result.push(v);
        if (result.length > 1e6) {
            run_1.stop('range: too many elements');
        }
    }
    return scan_1.build_tensor(result);
}
exports.Eval_range = Eval_range;
// table(expr, k, a, b): the values of expr for k = a..b, like sum without adding
function Eval_table(p1) {
    misc_1.checkArgCount(p1, 4);
    const body = defs_1.cadr(p1);
    const index = defs_1.caddr(p1);
    if (!defs_1.issymbol(index)) {
        run_1.stop('table: 2nd argument must be the index variable');
    }
    const a = eval_1.evaluate_integer(defs_1.cadddr(p1));
    const b = eval_1.evaluate_integer(defs_1.cadr(defs_1.cdr(defs_1.cdr(defs_1.cdr(p1)))));
    if (isNaN(a) || isNaN(b)) {
        return p1;
    }
    const saved = symbol_1.get_binding(index);
    const result = [];
    try {
        for (let i = a; i <= b; i++) {
            symbol_1.set_binding(index, bignum_1.integer(i));
            result.push(eval_1.Eval(body));
        }
    }
    finally {
        symbol_1.set_binding(index, saved);
    }
    return scan_1.build_tensor(result);
}
exports.Eval_table = Eval_table;
// map(f, list): f applied to every element; f is a function name
function Eval_map(p1) {
    misc_1.checkArgCount(p1, 2);
    const f = defs_1.cadr(p1);
    const list = eval_1.Eval(defs_1.caddr(p1));
    return scan_1.build_tensor(items(list).map((el) => eval_1.Eval(list_1.makeList(f, el))));
}
exports.Eval_map = Eval_map;
