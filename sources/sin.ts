import { isInteger } from './assume';
import {
  ARCSIN,
  ARCTAN,
  cadr,
  car,
  cdr,
  Constants,
  isadd,
  iscons,
  isdouble,
  ismultiply,
  isNumericAtom,
  PI,
  SIN,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { add, subtract } from './add';
import { double, integer, nativeInt, rational } from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { isnegative, isnpi } from './is';
import { makeList } from './list';
import { equal } from './misc';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { requireDimensionless } from './quantity';

// Sine function of numerical and symbolic arguments
export function Eval_sin(p1: U) {
  return sine(requireDimensionless(Eval(cadr(p1)), 'sin'));
}

export function sine(p1: U): U {
  if (isadd(p1)) {
    // sin of a sum can be further decomposed into
    //sin(alpha+beta) = sin(alpha)*cos(beta)+sin(beta)*cos(alpha)
    return sine_of_angle_sum(p1);
  }
  return sine_of_angle(p1);
}
//console.log "sine end ---- "

// Use angle sum formula for special angles.

// decompose sum sin(alpha+beta) into
// sin(alpha)*cos(beta)+sin(beta)*cos(alpha)
function sine_of_angle_sum(p1: U): U {
  let p2 = cdr(p1);
  while (iscons(p2)) {
    const B = car(p2);
    if (isnpi(B) || integerTimesPi(B)) {
      const A = subtract(p1, B);
      return add(multiply(sine(A), cosine(B)), multiply(cosine(A), sine(B)));
    }
    p2 = cdr(p2);
  }
  return sine_of_angle(p1);
}

// p = k*pi with k a symbolic integer (from the assumptions): k, else
// undefined. Numeric multiples are left to isnpi and the degree tables.
export function integerTimesPi(p: U): U | undefined {
  if (!ismultiply(p) || !p.tail().includes(symbol(PI))) {
    return undefined;
  }
  const k = divide(p, symbol(PI));
  return isInteger(k) && !isNumericAtom(k) ? k : undefined;
}

function sine_of_angle(p1: U): U {
  if (car(p1) === symbol(ARCSIN)) {
    return cadr(p1);
  }

  // sin(k*pi) = 0 for integer k
  if (integerTimesPi(p1)) {
    return Constants.zero;
  }

  if (isdouble(p1)) {
    let d = Math.sin(p1.d);
    if (Math.abs(d) < 1e-10) {
      d = 0.0;
    }
    return double(d);
  }

  // sine function is antisymmetric, sin(-x) = -sin(x)
  if (isnegative(p1)) {
    return negate(sine(negate(p1)));
  }

  // sin(arctan(x)) = x / sqrt(1 + x^2)

  // see p. 173 of the CRC Handbook of Mathematical Sciences
  if (car(p1) === symbol(ARCTAN)) {
    return multiply(
      cadr(p1),
      power(add(Constants.one, power(cadr(p1), integer(2))), rational(-1, 2))
    );
  }

  // multiply by 180/pi to go from radians to degrees.
  // we go from radians to degrees because it's much
  // easier to calculate symbolic results of most (not all) "classic"
  // angles (e.g. 30,45,60...) if we calculate the degrees
  // and the we do a switch on that.
  // Alternatively, we could look at the fraction of pi
  // (e.g. 60 degrees is 1/3 pi) but that's more
  // convoluted as we'd need to look at both numerator and
  // denominator.
  const n = nativeInt(divide(multiply(p1, integer(180)), Constants.Pi()));

  // most "good" (i.e. compact) trigonometric results
  // happen for a round number of degrees. There are some exceptions
  // though, e.g. 22.5 degrees, which we don't capture here.
  if (n < 0 || isNaN(n)) {
    return makeList(symbol(SIN), p1);
  }

  // values of some famous angles. Many more here:
  // https://en.wikipedia.org/wiki/Trigonometric_constants_expressed_in_real_radicals
  switch (n % 360) {
    case 0:
    case 180:
      return Constants.zero;
    case 30:
    case 150:
      return rational(1, 2);
    case 210:
    case 330:
      return rational(-1, 2);
    case 45:
    case 135:
      return multiply(rational(1, 2), power(integer(2), rational(1, 2)));
    case 225:
    case 315:
      return multiply(rational(-1, 2), power(integer(2), rational(1, 2)));
    case 60:
    case 120:
      return multiply(rational(1, 2), power(integer(3), rational(1, 2)));
    case 240:
    case 300:
      return multiply(rational(-1, 2), power(integer(3), rational(1, 2)));
    case 90:
      return Constants.one;
    case 270:
      return Constants.negOne;
    default:
      return specialSine(n % 360) || makeList(symbol(SIN), p1);
  }
}

// sin of n degrees, 0 <= n < 360, for the odd multiples of 15:
// sin(15) = (6^(1/2)-2^(1/2))/4, sin(75) = (6^(1/2)+2^(1/2))/4 and their
// mirror images. cos uses it through cos(n) = sin(90-n).
// ponytail: multiples of 18 degrees (pi/10) are left alone on purpose, their
// nested radicals make roots of unity and arg() results unreadable.
export function specialSine(n: number): U | undefined {
  if (n > 180) {
    const s = specialSine(n - 180);
    return s && negate(s);
  }
  if (n > 90) {
    return specialSine(180 - n);
  }
  const sqrt = (k: number) => power(integer(k), rational(1, 2));
  if (n === 15) {
    return multiply(rational(1, 4), subtract(sqrt(6), sqrt(2)));
  }
  if (n === 75) {
    return multiply(rational(1, 4), add(sqrt(6), sqrt(2)));
  }
  return undefined;
}

// the angle in degrees within [-90, 90] whose sine is the special value x
export function specialSineAngle(x: U): number | undefined {
  for (const n of [15, 75]) {
    if (equal(x, specialSine(n))) {
      return n;
    }
    if (equal(x, negate(specialSine(n)))) {
      return -n;
    }
  }
  return undefined;
}
