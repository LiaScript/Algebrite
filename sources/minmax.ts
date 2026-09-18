import { car, Cons, Sign, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { Eval } from './eval';
import { makeList } from './list';
import { cmp_values } from './test';

// Returns the arg on the `pick` side of every comparison, or the call
// unevaluated if any comparison is undecidable (symbolic args).
function extremum(p1: Cons, pick: Sign): U {
  const args = p1.tail().map(Eval);
  if (args.length === 0) {
    stop(`${car(p1)}: no data`);
  }
  let best = args[0];
  for (const a of args.slice(1)) {
    const c = cmp_values(a, best);
    if (c === null) {
      return makeList(car(p1), ...args);
    }
    if (c === pick) {
      best = a;
    }
  }
  return best;
}

export function Eval_min(p1: Cons): U {
  return extremum(p1, -1);
}

export function Eval_max(p1: Cons): U {
  return extremum(p1, 1);
}
