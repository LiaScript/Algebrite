import { alloc_tensor } from '../runtime/alloc';
import { cadr, iscons, U } from '../runtime/defs';
import { Eval } from './eval';

// atomize(expr): the top-level arguments of expr as a vector,
// the single argument if there is only one, or expr itself if it is an atom.
export function Eval_atomize(p1: U) {
  return atomize(Eval(cadr(p1)));
}

export function atomize(p1: U): U {
  if (!iscons(p1)) {
    return p1;
  }
  const args = p1.tail();
  if (args.length === 1) {
    return args[0];
  }
  const t = alloc_tensor(args.length);
  t.tensor.ndim = 1;
  t.tensor.dim[0] = args.length;
  t.tensor.elem = args;
  return t;
}
