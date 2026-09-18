"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_round = void 0;
const assume_1 = require("./assume");
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const eval_1 = require("./eval");
const floor_1 = require("./floor");
const is_1 = require("./is");
const list_1 = require("./list");
const quantity_1 = require("./quantity");
function Eval_round(p1) {
    const arg = eval_1.Eval(defs_1.cadr(p1));
    return quantity_1.mapQuantity(arg, yround) || yround(arg);
}
exports.Eval_round = Eval_round;
function yround(p1) {
    if (!defs_1.isNumericAtom(p1)) {
        // an integer by the assumptions, e.g. n or n^2+1 for integer n
        return assume_1.isInteger(p1) ? p1 : list_1.makeList(symbol_1.symbol(defs_1.ROUND), p1);
    }
    if (defs_1.isdouble(p1)) {
        return bignum_1.double(Math.round(p1.d));
    }
    if (is_1.isinteger(p1)) {
        return p1;
    }
    // exact, like Math.round: floor(x + 1/2)
    return floor_1.yfloor(add_1.add(p1, bignum_1.rational(1, 2)));
}
