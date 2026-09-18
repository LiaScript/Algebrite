"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval_choose = void 0;
const defs_1 = require("../runtime/defs");
const binomial_1 = require("./binomial");
const eval_1 = require("./eval");
/* choose =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
n,k

General description
-------------------

Returns the number of combinations of n items taken k at a time.
Same as binomial(n,k).

For example, the number of five card hands is choose(52,5)

```
                          n!
      choose(n,k) = -------------
                     k! (n - k)!
```
*/
function Eval_choose(p1) {
    const N = eval_1.Eval(defs_1.cadr(p1));
    const K = eval_1.Eval(defs_1.caddr(p1));
    return binomial_1.binomial(N, K);
}
exports.Eval_choose = Eval_choose;
