import { facts } from './assume';
import {
  ARG,
  ASSUME_REAL_VARIABLES,
  breakpoint,
  caddr,
  cadr,
  car,
  Constants,
  COS,
  defs,
  E,
  isadd,
  isdouble,
  ismultiply,
  ispower,
  issymbol,
  istensor,
  PI,
  SIN,
  U
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { get_binding, symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { integer, rational } from './bignum';
import { arctan } from './arctan';
import { denominator } from './denominator';
import { Eval } from './eval';
import { imag } from './imag';
import {
  equaln,
  isnegative,
  isnegativenumber,
  isoneovertwo,
  ispositivenumber,
  isZeroAtomOrTensor,
  realconstant
} from './is';
import { makeList } from './list';
import { equal } from './misc';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { real } from './real';
import { rect } from './rect';
import { mapQuantity } from './quantity';
import { copy_tensor } from './tensor';

/* arg =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
z

General description
-------------------
Returns the angle of complex z.

*/

/*
 Argument (angle) of complex z

  z    arg(z)
  -    ------

  a    0

  -a    -pi      See note 3 below

  (-1)^a    a pi

  exp(a + i b)  b

  a b    arg(a) + arg(b)

  a + i b    arctan(b/a)

Result by quadrant

  z    arg(z)
  -    ------

  1 + i    1/4 pi

  1 - i    -1/4 pi

  -1 + i    3/4 pi

  -1 - i    -3/4 pi

Notes

  1. Handles mixed polar and rectangular forms, e.g. 1 + exp(i pi/3)

  2. Symbols in z are assumed to be positive and real.

  3. Negative direction adds -pi to angle.

     Example: z = (-1)^(1/3), abs(z) = 1/3 pi, abs(-z) = -2/3 pi

  4. jean-francois.debroux reports that when z=(a+i*b)/(c+i*d) then

    arg(numerator(z)) - arg(denominator(z))

     must be used to get the correct answer. Now the operation is
     automatic.
*/

const DEBUG_ARG = false;

export function Eval_arg(z: U) {
  return arg(Eval(cadr(z)));
}

export function arg(z: U): U {
  if (istensor(z)) {
    const t = copy_tensor(z);
    t.tensor.elem = t.tensor.elem.map(arg);
    return t;
  }
  return (
    mapQuantity(z, arg, false) ||
    principal(subtract(yyarg(numerator(z)), yyarg(denominator(z))))
  );
}

// a constant angle is brought into the principal range (-pi, pi]
function principal(a: U): U {
  if (Find(a, symbol(ARG))) {
    return a; // not constant, and floating it would re-enter arg()
  }
  const k = Math.ceil(realconstant(a) / (2 * Math.PI) - 0.5 - 1e-12);
  return k ? subtract(a, multiply(integer(2 * k), Constants.Pi())) : a;
}

function yyarg(p1: U): U {
  // case of plain number
  if (ispositivenumber(p1) || p1 === symbol(PI)) {
    return isdouble(p1) || defs.evaluatingAsFloats
      ? Constants.zeroAsDouble
      : Constants.zero;
  }

  if (isnegativenumber(p1)) {
    return isdouble(p1) || defs.evaluatingAsFloats
      ? Constants.piAsDouble
      : symbol(PI);
  }

  // arg(a) is 0 for a > 0 and pi for a < 0, so without a known sign a
  // symbol is left unexpressed
  // real and >= 0 (arg(0) = 0 by convention), or < 0
  const known = facts(p1);
  const nonnegative = known.real && known.negative === false;
  if (nonnegative || known.negative) {
    const float = isdouble(p1) || defs.evaluatingAsFloats;
    return nonnegative
      ? float ? Constants.zeroAsDouble : Constants.zero
      : float ? Constants.piAsDouble : symbol(PI);
  }

  if (issymbol(p1)) {
    return makeList(symbol(ARG), p1);
  }

  if (ispower(p1) && equaln(cadr(p1), -1)) {
    // -1 to a power
    return multiply(Constants.Pi(), caddr(p1));
  }

  if (ispower(p1) && cadr(p1) === symbol(E)) {
    // exponential
    // arg(a^(1/2)) is always equal to 1/2 * arg(a)
    // this can obviously be made more generic TODO
    return imag(caddr(p1));
  }

  if (ispower(p1) && isoneovertwo(caddr(p1))) {
    const arg1 = arg(cadr(p1));
    if (DEBUG_ARG) {
      console.log(`arg of a sqrt: ${p1}`);
      breakpoint;
      console.log(` = 1/2 * ${arg1}`);
    }
    return multiply(arg1, caddr(p1));
  }

  if (ismultiply(p1)) {
    // product of factors (of a numerator, so no denominators to split
    // off: arg() would loop on numerator(1.0+1.0*i) = 1.0*(1.0+1.0*i))
    return p1.tail().map(yyarg).reduce(add, Constants.zero);
  }

  if (isadd(p1)) {
    // sum of terms: the quadrant needs the signs of the real and imaginary
    // parts; when one is unknown, arg stays unevaluated
    const unknown = makeList(symbol(ARG), p1);
    p1 = rect(p1);
    const RE = real(p1);
    const IM = imag(p1);
    if (isZeroAtomOrTensor(RE)) {
      // on the imaginary axis: +-pi/2 (this gave +-pi)
      const s = signOf(IM);
      if (s === null || s === 0) {
        return s === 0 ? Constants.zero : unknown;
      }
      return multiply(Constants.Pi(), rational(s, 2));
    } else {
      const ratio = divide(IM, RE);
      const S = numerator(ratio);
      const C = denominator(ratio);
      if (
        car(S) === symbol(SIN) &&
        car(C) === symbol(COS) &&
        equal(cadr(S), cadr(C))
      ) {
        // z = r (cos(a) + i sin(a)): the angle is a, turned by pi if r < 0
        const a = cadr(S);
        const r = signOf(divide(RE, C));
        if (r === null) {
          return unknown;
        }
        if (r >= 0) {
          return a;
        }
        return realconstant(a) < 0
          ? add(a, Constants.Pi())
          : subtract(a, Constants.Pi());
      }
      const arg1 = arctan(ratio);
      const re = signOf(RE);
      if (re === null) {
        return unknown;
      }
      if (re < 0) {
        const im = signOf(IM);
        if (im === null) {
          return unknown;
        }
        if (im < 0) {
          return subtract(arg1, Constants.Pi()); // quadrant 1 -> 3
        } else {
          return add(arg1, Constants.Pi()); // quadrant 4 -> 2
        }
      }
      return arg1;
    }
  }
  // a real value of unknown sign has arg 0 or pi: nothing to say (this
  // returned 0, silently assuming it positive: arg(a-b) = 0)

  // if we don't assume all passed values are real, all
  // we con do is to leave unexpressed
  return makeList(symbol(ARG), p1);
}

// numeric sign test when possible (-cos(4/5*pi) > 0, cos(8/9*pi) < 0),
// else the syntactic one (symbols are assumed positive)
// sign of a real value, numerically or from the assumptions; null if unknown
function signOf(p: U): number | null {
  const d = realconstant(p);
  if (!isNaN(d)) {
    return Math.sign(d);
  }
  const f = facts(p);
  return f.positive ? 1 : f.negative ? -1 : f.zero ? 0 : null;
}

function isbelowzero(p: U): boolean {
  const d = realconstant(p);
  return isNaN(d) ? isnegative(p) : d < 0;
}
