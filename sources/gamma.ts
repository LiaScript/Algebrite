import {
  cadr,
  car,
  cdr,
  Constants,
  GAMMA,
  isadd,
  isdouble,
  isrational,
  MEQUAL,
  Num,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from "../runtime/symbol";
import { add, subtract } from './add';
import { double, rational } from './bignum';
import { Eval } from './eval';
import { factorial } from './factorial';
import { isnegativeterm, isposint, ispositivenumber } from './is';
import { makeList } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { sine } from './sin';
import { checkArgCount } from './misc';

//-----------------------------------------------------------------------------
//
//  Author : philippe.billet@noos.fr
//
//  Gamma function gamma(x)
//
//-----------------------------------------------------------------------------
export function Eval_gamma(p1: U) {
  checkArgCount(p1, 1);
  return gamma(Eval(cadr(p1)));
}

function gamma(p1: U): U {
  return gammaf(p1);
}

function gammaf(p1: U): U {
  if (isrational(p1) && MEQUAL(p1.q.a, 1) && MEQUAL(p1.q.b, 2)) {
    return power(Constants.Pi(), rational(1, 2));
  }

  // Gamma(n) = (n-1)!, Gamma(n+1/2) = (n-1/2)*Gamma(n-1/2)
  if (isposint(p1)) {
    return factorial(subtract(p1, Constants.one));
  }
  if (isrational(p1) && MEQUAL(p1.q.b, 2) && ispositivenumber(p1)) {
    const p = subtract(p1, Constants.one);
    return multiply(p, gamma(p));
  }

  if (isdouble(p1)) {
    if (p1.d <= 0 && Number.isInteger(p1.d)) {
      stop('divide by zero');
    }
    return double(lanczos(p1.d));
  }

  if (isnegativeterm(p1)) {
    return divide(
      multiply(Constants.Pi(), Constants.negOne),
      multiply(
        multiply(sine(multiply(Constants.Pi(), p1)), p1),
        gamma(negate(p1))
      )
    );
  }

  if (isadd(p1)) {
    return gamma_of_sum(p1);
  }

  return makeList(symbol(GAMMA), p1);
}

function gamma_of_sum(p1: U): U {
  const p3 = cdr(p1);
  if (
    isrational(car(p3)) &&
    MEQUAL((car(p3) as Num).q.a, 1) &&
    MEQUAL((car(p3) as Num).q.b, 1)
  ) {
    return multiply(cadr(p3), gamma(cadr(p3)));
  }

  if (
    isrational(car(p3)) &&
    MEQUAL((car(p3) as Num).q.a, -1) &&
    MEQUAL((car(p3) as Num).q.b, 1)
  ) {
    return divide(gamma(cadr(p3)), add(cadr(p3), Constants.negOne));
  }

  return makeList(symbol(GAMMA), p1);
}

// Lanczos approximation (g = 7, 9 terms), about 15 significant digits
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function lanczos(x: number): number {
  if (Number.isInteger(x) && x > 0 && x < 172) {
    let f = 1;
    for (let i = 2; i < x; i++) {
      f *= i;
    }
    return f;
  }
  if (x < 0.5) {
    return Math.PI / (Math.sin(Math.PI * x) * lanczos(1 - x));
  }
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) {
    a += LANCZOS[i] / (x + i);
  }
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
