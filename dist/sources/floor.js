"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yfloor = exports.Eval_floor = void 0;
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const mmul_1 = require("./mmul");
const quantity_1 = require("./quantity");
function Eval_floor(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return quantity_1.mapQuantity(arg, yfloor) || yfloor(arg);
}
exports.Eval_floor = Eval_floor;
function yfloor(p1) {
    return yyfloor(p1);
}
exports.yfloor = yfloor;
function yyfloor(p1) {
    if (!defs_1.isNumericAtom(p1)) {
        return list_1.makeList(symbol_1.symbol(defs_1.FLOOR), p1);
    }
    if (defs_1.isdouble(p1)) {
        return bignum_1.double(Math.floor(p1.d));
    }
    if (is_1.isinteger(p1)) {
        return p1;
    }
    let p3 = new defs_1.Num(mmul_1.mdiv(p1.q.a, p1.q.b));
    if (is_1.isnegativenumber(p1)) {
        p3 = add_1.add(p3, defs_1.Constants.negOne);
    }
    return p3;
}
