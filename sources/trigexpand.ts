import {
  cadr,
  car,
  COS,
  isadd,
  iscons,
  ismultiply,
  istensor,
  SIN,
  TAN,
  U,
} from '../runtime/defs';
import { symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, nativeInt } from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { isinteger } from './is';
import { divide, multiply } from './multiply';
import { sine } from './sin';
import { copy_tensor } from './tensor';

// trigexpand(x): expands sin/cos/tan of sums and integer multiples,
// e.g. sin(2x) -> 2 sin(x) cos(x), cos(x+y) -> cos(x) cos(y) - sin(x) sin(y).
export function Eval_trigexpand(p1: U) {
  return trigexpand(Eval(cadr(p1)));
}

export function trigexpand(p: U): U {
  if (istensor(p)) {
    const t = copy_tensor(p);
    t.tensor.elem = t.tensor.elem.map(trigexpand);
    return t;
  }
  if (!iscons(p)) {
    return p;
  }
  const f = car(p);
  if (f === symbol(SIN) || f === symbol(COS) || f === symbol(TAN)) {
    const [s, c] = sincos(trigexpand(cadr(p)));
    return f === symbol(SIN) ? s : f === symbol(COS) ? c : divide(s, c);
  }
  return Eval(p.map(trigexpand));
}

// [sin(u), cos(u)], each expanded.
function sincos(u: U): [U, U] {
  let a: U, b: U;
  if (isadd(u)) {
    // u = a + b, b being all remaining terms
    a = cadr(u);
    b = subtract(u, a);
  } else {
    const n = integerFactor(u);
    if (!(n >= 2)) {
      return [sine(u), cosine(u)];
    }
    // u = x + (n-1) x
    a = divide(u, integer(n));
    b = subtract(u, a);
  }
  const [sa, ca] = sincos(a);
  const [sb, cb] = sincos(b);
  return [
    add(multiply(sa, cb), multiply(ca, sb)),
    subtract(multiply(ca, cb), multiply(sa, sb)),
  ];
}

// n of n*x for a small integer n (negative n are handled by sin/cos
// themselves, which pull the sign out), otherwise NaN.
// ponytail: n capped at 12, the expanded form grows with n; raise if needed.
function integerFactor(u: U): number {
  if (ismultiply(u) && isinteger(cadr(u))) {
    const n = nativeInt(cadr(u));
    return n <= 12 ? n : NaN;
  }
  return NaN;
}
