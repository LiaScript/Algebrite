import { caddr, cadr, U } from '../runtime/defs';
import { binomial } from './binomial';
import { Eval } from './eval';

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
export function Eval_choose(p1: U) {
  const N = Eval(cadr(p1));
  const K = Eval(caddr(p1));
  return binomial(N, K);
}
