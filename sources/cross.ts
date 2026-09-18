import { alloc_tensor } from '../runtime/alloc';
import {
  caddr,
  cadr,
  CROSS,
  CURL,
  DIV,
  istensor,
  Tensor,
  U,
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { derivative } from './derivative';
import { Eval } from './eval';
import { makeList } from './list';
import { multiply } from './multiply';
import { check_tensor_dimensions } from './tensor';

/* cross, curl, div ==========================================================

cross(u,v) is the cross product of 3-vectors u and v, curl(v) and div(v) the
curl and divergence of the vector field v in x, y and z.
Anything but a 3-vector stops, instead of silently using the first three
components. Non-tensor arguments are left unevaluated.

*/
export function Eval_cross(p1: U) {
  const u = Eval(cadr(p1));
  const v = Eval(caddr(p1));
  const a = vec3(u, 'cross');
  const b = vec3(v, 'cross');
  if (!a || !b) {
    return makeList(symbol(CROSS), u, v);
  }
  const c = (i: number, j: number) =>
    subtract(multiply(a[i], b[j]), multiply(a[j], b[i]));
  return vector([c(1, 2), c(2, 0), c(0, 1)]);
}

export function Eval_curl(p1: U) {
  const v = Eval(cadr(p1));
  const a = vec3(v, 'curl');
  if (!a) {
    return makeList(symbol(CURL), v);
  }
  const [x, y, z] = ['x', 'y', 'z'].map(usr_symbol);
  const c = (i: number, s: U, j: number, t: U) =>
    subtract(derivative(a[i], s), derivative(a[j], t));
  return vector([c(2, y, 1, z), c(0, z, 2, x), c(1, x, 0, y)]);
}

export function Eval_div(p1: U) {
  const v = Eval(cadr(p1));
  const a = vec3(v, 'div');
  if (!a) {
    return makeList(symbol(DIV), v);
  }
  return ['x', 'y', 'z']
    .map((s, i) => derivative(a[i], usr_symbol(s)))
    .reduce((acc, t) => add(acc, t));
}

function vec3(p: U, name: string): U[] | undefined {
  if (!istensor(p)) {
    return undefined;
  }
  if (p.tensor.ndim !== 1 || p.tensor.dim[0] !== 3) {
    stop(name + ': 3-vector expected');
  }
  return p.tensor.elem;
}

function vector(elem: U[]): Tensor {
  const T = alloc_tensor(3);
  T.tensor.ndim = 1;
  T.tensor.dim[0] = 3;
  T.tensor.elem = elem;
  check_tensor_dimensions(T);
  return T;
}
