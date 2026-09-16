"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_max = exports.Eval_min = void 0;
const defs_1 = require("../runtime/defs");
const eval_1 = require("./eval");
const list_1 = require("./list");
const test_1 = require("./test");
// Returns the arg on the `pick` side of every comparison, or the call
// unevaluated if any comparison is undecidable (symbolic args).
function extremum(p1, pick) {
    const args = p1.tail().map(eval_1.Eval);
    let best = args[0];
    for (const a of args.slice(1)) {
        const c = test_1.cmp_values(a, best);
        if (c === null) {
            return list_1.makeList(defs_1.car(p1), ...args);
        }
        if (c === pick) {
            best = a;
        }
    }
    return best;
}
function Eval_min(p1) {
    return extremum(p1, -1);
}
exports.Eval_min = Eval_min;
function Eval_max(p1) {
    return extremum(p1, 1);
}
exports.Eval_max = Eval_max;
