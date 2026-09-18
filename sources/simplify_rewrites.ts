import { count } from '../runtime/count';
import {
  caddr,
  cadr,
  car,
  Constants,
  COS,
  COSH,
  iscons,
  ismultiply,
  ispower,
  isrational,
  LOG,
  Num,
  SIN,
  SINH,
  TAN,
  TANH,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer } from './bignum';
import { denominator } from './denominator';
import { Eval } from './eval';
import { isinteger, isnegativenumber, isone, ispositivenumber } from './is';
import { makeList } from './list';
import { equal } from './misc';
import { divide, multiply } from './multiply';
import { numerator } from './numerator';
import { factor_number } from './pollard';
import { power } from './power';
import { rationalize } from './rationalize';
import { simplify_trig } from './simplify';

// Rewrites simplify() tries and keeps only when the result is shorter.

// Replaces every subexpression f maps to something, bottom-up untouched.
function mapTree(p: U, f: (q: U) => U | undefined): U {
  const r = f(p);
  if (r !== undefined) {
    return r;
  }
  return iscons(p) ? makeList(...p.map((el) => mapTree(el, f))) : p;
}

function shorter(candidate: U, p: U): U {
  return count(candidate) < count(p) ? candidate : p;
}

// log(8) = 3*log(2): logs of rationals are split over the prime factors, so
// that log(8)/log(2) = 3 and log(12)-log(3) = 2*log(2)
export function simplify_logs(p1: U): U {
  if (!Find(p1, symbol(LOG))) {
    return p1;
  }
  const split = mapTree(p1, (q) =>
    car(q) === symbol(LOG) && isrational(cadr(q)) && ispositivenumber(cadr(q))
      ? logOfRational(cadr(q) as Num)
      : undefined
  );
  return shorter(Eval(split), p1);
}

function logOfRational(q: Num): U {
  const part = (n: U): U => {
    if (isone(n)) {
      return Constants.zero;
    }
    const f = factor_number(n as Num);
    const factors = ismultiply(f) ? f.tail() : [f];
    return factors.reduce(
      (acc: U, t: U) =>
        add(
          acc,
          ispower(t)
            ? makeList(symbol('multiply'), caddr(t), makeList(symbol(LOG), cadr(t)))
            : makeList(symbol(LOG), t)
        ),
      Constants.zero
    );
  };
  return subtract(part(numerator(q)), part(denominator(q)));
}

// cosh^2 = 1+sinh^2 or sinh^2 = cosh^2-1, whichever gets shorter
export function simplify_hyperbolic(p1: U): U {
  if (!Find(p1, symbol(SINH)) && !Find(p1, symbol(COSH))) {
    return p1;
  }
  const evenPower = (fn: string, to: (u: U) => U) => (q: U) =>
    ispower(q) &&
    car(cadr(q)) === symbol(fn) &&
    isinteger(caddr(q)) &&
    !isnegativenumber(caddr(q)) &&
    (caddr(q) as Num).a.isEven()
      ? power(to(cadr(cadr(q))), divide(caddr(q), integer(2)))
      : undefined;
  const sq = (fn: string, u: U) => power(makeList(symbol(fn), u), integer(2));
  const viaSinh = Eval(
    mapTree(p1, evenPower(COSH, (u) => add(Constants.one, sq(SINH, u))))
  );
  const viaCosh = Eval(
    mapTree(p1, evenPower(SINH, (u) => subtract(sq(COSH, u), Constants.one)))
  );
  return shorter(viaCosh, shorter(viaSinh, p1));
}

// tan = sin/cos in both directions: tan is expanded when the trig rewrites
// then shorten the whole (1/(1+tan^2) = cos^2), and sin^n/cos^n is collected
// into tan^n. The same for sinh, cosh and tanh.
export function simplify_quotients(p1: U): U {
  if (Find(p1, symbol(TAN))) {
    const expanded = mapTree(p1, (q) =>
      car(q) === symbol(TAN)
        ? divide(makeList(symbol(SIN), cadr(q)), makeList(symbol(COS), cadr(q)))
        : undefined
    );
    p1 = shorter(simplify_trig(rationalize(Eval(expanded))), p1);
  }
  p1 = collectQuotient(p1, SIN, COS, TAN);
  return collectQuotient(p1, SINH, COSH, TANH);
}

function collectQuotient(p1: U, s: string, c: string, t: string): U {
  if (!Find(p1, symbol(s)) || !Find(p1, symbol(c))) {
    return p1;
  }
  const collected = mapTree(p1, (q) => {
    if (!ismultiply(q)) {
      return undefined;
    }
    const factors = q.tail();
    // [base, exponent] of a factor fn(u)^n with integer n
    const split = (f: U, fn: string): [U, number] | undefined => {
      const base = ispower(f) ? cadr(f) : f;
      const e = ispower(f) ? caddr(f) : Constants.one;
      return car(base) === symbol(fn) && isinteger(e)
        ? [base, (e as Num).a.toJSNumber()]
        : undefined;
    };
    for (const fs of factors) {
      const num = split(fs, s);
      if (!num || num[1] <= 0) {
        continue;
      }
      for (const fc of factors) {
        const den = split(fc, c);
        if (!den || den[1] >= 0 || !equal(cadr(den[0]), cadr(num[0]))) {
          continue;
        }
        const k = Math.min(num[1], -den[1]);
        const rest = factors.filter((f) => f !== fs && f !== fc);
        return [
          ...rest,
          power(makeList(symbol(t), cadr(num[0])), integer(k)),
          power(num[0], integer(num[1] - k)),
          power(den[0], integer(den[1] + k))
        ].reduce(multiply, Constants.one);
      }
    }
    return undefined;
  });
  return shorter(Eval(collected), p1);
}
