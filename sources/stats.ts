import { car, Cons, istensor, U } from '../runtime/defs';
import { stop } from '../runtime/run';
import { add, subtract } from './add';
import { double, integer, nativeInt, rational } from './bignum';
import { Eval } from './eval';
import { makeList } from './list';
import { divide, multiply } from './multiply';
import { power } from './power';
import { cmp_values } from './test';

// Data is either one vector, mean([1,2,3]), or the argument list, mean(1,2,3).
function values(p1: Cons): U[] {
  const args = p1.tail().map(Eval);
  const data = args.length === 1 && istensor(args[0]) ? args[0].elem : args;
  if (data.length === 0) {
    stop(`${car(p1)}: no data`);
  }
  return data;
}

function mean(data: U[]): U {
  return divide(data.reduce(add), integer(data.length));
}

// Sum of squared deviations divided by n - ddof (0: population, 1: sample).
function variance(data: U[], ddof: number): U {
  if (data.length <= ddof) {
    stop('variance: not enough data');
  }
  const m = mean(data);
  const ss = data
    .map((x) => {
      const d = subtract(x, m);
      return multiply(d, d);
    })
    .reduce(add);
  return divide(ss, integer(data.length - ddof));
}

const sqrt = (p: U): U => power(p, rational(1, 2));

export function Eval_mean(p1: Cons): U {
  return mean(values(p1));
}

export function Eval_variance(p1: Cons): U {
  return variance(values(p1), 0);
}

export function Eval_svariance(p1: Cons): U {
  return variance(values(p1), 1);
}

export function Eval_sd(p1: Cons): U {
  return sqrt(variance(values(p1), 0));
}

export function Eval_ssd(p1: Cons): U {
  return sqrt(variance(values(p1), 1));
}

// Unevaluated when the order of the data is undecidable (symbolic values),
// like min/max.
export function Eval_median(p1: Cons): U {
  const data = values(p1);
  let undecidable = false;
  const sorted = [...data].sort((a, b) => {
    const c = cmp_values(a, b);
    if (c === null) {
      undecidable = true;
      return 0;
    }
    return c;
  });
  if (undecidable) {
    return makeList(car(p1), ...p1.tail().map(Eval));
  }
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : mean([sorted[mid - 1], sorted[mid]]);
}

// random(): float in [0,1); random(a,b): integer in [a,b].
export function Eval_random(p1: Cons): U {
  const args = p1.tail().map(Eval);
  if (args.length === 0) {
    return double(Math.random());
  }
  const a = nativeInt(args[0]);
  const b = nativeInt(args[1]);
  if (args.length !== 2 || isNaN(a) || isNaN(b) || a > b) {
    stop('random: use random() or random(a,b) with integers a <= b');
  }
  return integer(a + Math.floor(Math.random() * (b - a + 1)));
}
