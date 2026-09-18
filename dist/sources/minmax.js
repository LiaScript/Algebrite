"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_max = exports.Eval_min = void 0;
const defs_1 = require("../runtime/defs");
const run_1 = require("../runtime/run");
const eval_1 = require("./eval");
const list_1 = require("./list");
const test_1 = require("./test");
// min/max: nested calls of the same kind are flattened, and an argument that
// can never be the extremum (by value or by the assumptions, a duplicate)
// is dropped.
// What is left is the result, or the call of the undecided arguments.
function extremum(p1, pick) {
    const args = p1
        .tail()
        .map(eval_1.Eval)
        .reduce((acc, a) => acc.concat(defs_1.car(a) === defs_1.car(p1) && defs_1.iscons(a) ? a.tail() : [a]), []);
    if (args.length === 0) {
        run_1.stop(`${defs_1.car(p1)}: no data`);
    }
    let kept = [];
    for (const a of args) {
        const beaten = kept.filter((k) => wins(a, k, pick));
        if (beaten.length === 0 && kept.some((k) => wins(k, a, pick))) {
            continue;
        }
        // a takes the place of the first argument it beats, the others go
        const at = beaten.length ? kept.indexOf(beaten[0]) : kept.length;
        kept = [...kept.slice(0, at), a, ...kept.slice(at + 1).filter((k) => !beaten.includes(k))];
    }
    return kept.length === 1 ? kept[0] : list_1.makeList(defs_1.car(p1), ...kept);
}
// a is the extremum of a and b for sure (equal ones: both win)
function wins(a, b, pick) {
    const { sign, known } = test_1.compare(a, b);
    if (sign != null) {
        return sign === pick || sign === 0;
    }
    return (pick === 1 ? known.negative : known.positive) === false;
}
function Eval_min(p1) {
    return extremum(p1, -1);
}
exports.Eval_min = Eval_min;
function Eval_max(p1) {
    return extremum(p1, 1);
}
exports.Eval_max = Eval_max;
