import { car, Cons, iscons, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { Eval } from './eval';
import { makeList } from './list';
import { compare } from './test';

// min/max: nested calls of the same kind are flattened, and an argument that
// can never be the extremum (by value or by the assumptions, a duplicate)
// is dropped.
// What is left is the result, or the call of the undecided arguments.
function extremum(p1: Cons, pick: 1 | -1): U {
  const args = p1
    .tail()
    .map(Eval)
    .reduce<U[]>((acc, a) => acc.concat(car(a) === car(p1) && iscons(a) ? a.tail() : [a]), []);
  if (args.length === 0) {
    stop(`${car(p1)}: no data`);
  }
  let kept: U[] = [];
  for (const a of args) {
    const beaten = kept.filter((k) => wins(a, k, pick));
    if (beaten.length === 0 && kept.some((k) => wins(k, a, pick))) {
      continue;
    }
    // a takes the place of the first argument it beats, the others go
    const at = beaten.length ? kept.indexOf(beaten[0]) : kept.length;
    kept = [...kept.slice(0, at), a, ...kept.slice(at + 1).filter((k) => !beaten.includes(k))];
  }
  return kept.length === 1 ? kept[0] : makeList(car(p1), ...kept);
}

// a is the extremum of a and b for sure (equal ones: both win)
function wins(a: U, b: U, pick: 1 | -1): boolean {
  const { sign, known } = compare(a, b);
  if (sign != null) {
    return sign === pick || sign === 0;
  }
  return (pick === 1 ? known.negative : known.positive) === false;
}

export function Eval_min(p1: Cons): U {
  return extremum(p1, -1);
}

export function Eval_max(p1: Cons): U {
  return extremum(p1, 1);
}
