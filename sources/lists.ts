import { caddr, cadddr, cadr, car, cdr, Constants, iscons, isdouble, issymbol, istensor, NIL, U } from '../runtime/defs';
import { alloc_tensor } from '../runtime/alloc';
import { stop } from '../runtime/run';
import { get_binding, set_binding, symbol, usr_symbol } from '../runtime/symbol';
import { add } from './add';
import { integer } from './bignum';
import { Eval, evaluate_integer } from './eval';
import { zzfloat } from './float';
import { makeList } from './list';
import { checkArgCount, cmp_expr } from './misc';
import { build_tensor } from './scan';

// List helpers. A list is a vector; build_tensor of vectors of one length
// gives a matrix, as the [..] syntax does.

// the elements of a vector, the rows of a matrix, or the value itself
function items(p: U): U[] {
  if (!istensor(p)) {
    return [p];
  }
  if (p.ndim === 1) {
    return p.elem;
  }
  const size = p.nelem / p.dim[0];
  return Array.from({ length: p.dim[0] }, (_, i) => {
    const row = alloc_tensor(size);
    row.ndim = p.ndim - 1;
    row.dim = p.dim.slice(1);
    row.elem = p.elem.slice(i * size, (i + 1) * size);
    return row;
  });
}

export function Eval_length(p1: U) {
  checkArgCount(p1, 1);
  const p = Eval(cadr(p1));
  return integer(istensor(p) ? p.dim[0] : 1);
}

export function Eval_append(p1: U) {
  const all: U[] = [];
  for (let p = cdr(p1); iscons(p); p = cdr(p)) {
    all.push(...items(Eval(car(p))));
  }
  return build_tensor(all);
}

// numbers by value, anything else in the canonical order of expressions
export function Eval_sort(p1: U) {
  checkArgCount(p1, 1);
  const list = items(Eval(cadr(p1)));
  const values = list.map((p) => {
    const f = zzfloat(p);
    return isdouble(f) ? f.d : NaN;
  });
  const numeric = values.every((v) => !Number.isNaN(v));
  const order = list.map((_, i) => i);
  order.sort((i, j) => (numeric ? values[i] - values[j] : cmp_expr(list[i], list[j])));
  return build_tensor(order.map((i) => list[i]));
}

// range(n) = [1..n], range(a, b), range(a, b, step)
export function Eval_range(p1: U) {
  checkArgCount(p1, 1, 3);
  const args = [cadr(p1), caddr(p1), cadddr(p1)].filter((p) => p !== symbol(NIL)).map(Eval);
  const [a, b, step] =
    args.length === 1 ? [Constants.one, args[0], Constants.one] : [args[0], args[1], args[2] || Constants.one];
  const num = (p: U) => {
    const f = zzfloat(p);
    return isdouble(f) ? f.d : NaN;
  };
  const s = num(step);
  if ([num(a), num(b), s].some(Number.isNaN) || s === 0) {
    return makeList(usr_symbol('range'), ...args);
  }
  const result: U[] = [];
  for (let v = a; s > 0 ? num(v) <= num(b) + 1e-12 : num(v) >= num(b) - 1e-12; v = add(v, step)) {
    result.push(v);
    if (result.length > 1e6) {
      stop('range: too many elements');
    }
  }
  return build_tensor(result);
}

// table(expr, k, a, b): the values of expr for k = a..b, like sum without adding
export function Eval_table(p1: U) {
  checkArgCount(p1, 4);
  const body = cadr(p1);
  const index = caddr(p1);
  if (!issymbol(index)) {
    stop('table: 2nd argument must be the index variable');
  }
  const a = evaluate_integer(cadddr(p1));
  const b = evaluate_integer(cadr(cdr(cdr(cdr(p1)))));
  if (isNaN(a) || isNaN(b)) {
    return p1;
  }
  const saved = get_binding(index);
  const result: U[] = [];
  try {
    for (let i = a; i <= b; i++) {
      set_binding(index, integer(i));
      result.push(Eval(body));
    }
  } finally {
    set_binding(index, saved);
  }
  return build_tensor(result);
}

// map(f, list): f applied to every element; f is a function name
export function Eval_map(p1: U) {
  checkArgCount(p1, 2);
  const f = cadr(p1);
  const list = Eval(caddr(p1));
  return build_tensor(items(list).map((el) => Eval(makeList(f, el))));
}
