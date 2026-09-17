"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_draw = exports.setDrawHandler = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const symbol_1 = require("../runtime/symbol");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const float_1 = require("./float");
let drawHandler;
let drawCallback;
function setDrawHandler(handler, callback) {
    drawHandler = handler;
    drawCallback = callback;
}
exports.setDrawHandler = setDrawHandler;
function toFloat(p) {
    const r = defs_1.evalFloats(() => eval_1.Eval(float_1.yyfloat(eval_1.Eval(p))));
    return defs_1.isNumericAtom(r) ? bignum_1.nativeDouble(r) : NaN;
}
function Eval_draw(p1) {
    if (!drawHandler) {
        return p1;
    }
    const body = defs_1.cadr(p1);
    const variable = defs_1.caddr(p1) === symbol_1.symbol(defs_1.NIL) ? symbol_1.symbol(defs_1.SYMBOL_X) : defs_1.caddr(p1);
    if (!defs_1.issymbol(variable)) {
        run_1.stop('draw: 2nd arg should be the variable to plot over');
    }
    const range = defs_1.cadddr(p1) === symbol_1.symbol(defs_1.NIL)
        ? undefined
        : [toFloat(defs_1.cadddr(p1)), toFloat(defs_1.caddddr(p1))];
    // ponytail: f binds the variable globally, so it is only valid while the
    // handler runs synchronously inside this Eval; sample eagerly if needed later.
    const f = (v) => {
        const saved = symbol_1.get_binding(variable);
        symbol_1.set_binding(variable, bignum_1.double(v));
        try {
            return toFloat(body);
        }
        catch (e) {
            return NaN;
        }
        finally {
            symbol_1.set_binding(variable, saved);
        }
    };
    drawHandler({
        expr: eval_1.Eval(body).toString(),
        variable: variable.toString(),
        range,
        f,
        callback: drawCallback,
    });
    return symbol_1.symbol(defs_1.NIL);
}
exports.Eval_draw = Eval_draw;
