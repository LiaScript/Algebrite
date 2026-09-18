import {
  BESSELJ,
  caddr,
  cadr,
  Constants,
  defs,
  isdouble,
  MEQUAL,
  MSIGN,
  NUM,
  PI,
  U
} from '../runtime/defs';
import { jn } from '../runtime/otherCFunctions';
import { symbol } from "../runtime/symbol";
import { subtract } from './add';
import { double, integer, nativeInt, rational } from './bignum';
import { cosine } from './cos';
import { Eval } from './eval';
import { isnegativeterm, ispositivenumber, isZeroAtomOrTensor } from './is';
import { makeList } from './list';
import { divide, multiply, negate } from './multiply';
import { power } from './power';
import { sine } from './sin';
import { checkArgCount } from './misc';

/* besselj =====================================================================

Tags
----
scripting, JS, internal, treenode, general concept

Parameters
----------
n,x

General description
-------------------

Returns a solution to the Bessel differential equation (Bessel function of first kind).

Recurrence relation:

  besselj(n,x) = (2/x) (n-1) besselj(n-1,x) - besselj(n-2,x)

  besselj(1/2,x) = sqrt(2/pi/x) sin(x)

  besselj(-1/2,x) = sqrt(2/pi/x) cos(x)

For negative n, reorder the recurrence relation as:

  besselj(n-2,x) = (2/x) (n-1) besselj(n-1,x) - besselj(n,x)

Substitute n+2 for n to obtain

  besselj(n,x) = (2/x) (n+1) besselj(n+1,x) - besselj(n+2,x)

Examples:

  besselj(3/2,x) = (1/x) besselj(1/2,x) - besselj(-1/2,x)

  besselj(-3/2,x) = -(1/x) besselj(-1/2,x) - besselj(1/2,x)

*/
export function Eval_besselj(p1: U) {
  checkArgCount(p1, 2);
  // besselj(n, x): order first, then the argument
  return besselj(Eval(caddr(p1)), Eval(cadr(p1)));
}

export function besselj(p1: U, p2: U): U {
  return yybesselj(p1, p2);
}

function yybesselj(X: U, N: U): U {
  const n = nativeInt(N);

  // numerical result
  if (isdouble(X) && !isNaN(n)) {
    const d = jn(n, X.d);
    return double(d);
  }

  // besselj(0,0) = 1
  if (isZeroAtomOrTensor(X) && isZeroAtomOrTensor(N)) {
    return Constants.one;
  }

  // J_n(0) = 0 for integer n != 0 and for n > 0
  if (isZeroAtomOrTensor(X) && (!isNaN(n) || ispositivenumber(N))) {
    return Constants.zero;
  }

  // half arguments
  if (N.k === NUM && MEQUAL(N.q.b, 2)) {
    // n = 1/2
    if (MEQUAL(N.q.a, 1)) {
      const twoOverPi = defs.evaluatingAsFloats
        ? double(2.0 / Math.PI)
        : divide(integer(2), symbol(PI));
      return multiply(power(divide(twoOverPi, X), rational(1, 2)), sine(X));
    }

    // n = -1/2
    if (MEQUAL(N.q.a, -1)) {
      const twoOverPi = defs.evaluatingAsFloats
        ? double(2.0 / Math.PI)
        : divide(integer(2), symbol(PI));
      return multiply(power(divide(twoOverPi, X), rational(1, 2)), cosine(X));
    }

    // J_n(x) = (2/x) (n-sgn(n)) J_(n-sgn(n))(x) - J_(n-2*sgn(n))(x)
    const SGN = integer(MSIGN(N.q.a));

    return subtract(
      multiply(
        multiply(divide(integer(2), X), subtract(N, SGN)),
        besselj(X, subtract(N, SGN))
      ),
      besselj(X, subtract(N, multiply(integer(2), SGN)))
    );
  }

  //if 0 # test cases needed
  if (isnegativeterm(X)) {
    return multiply(
      multiply(power(negate(X), N), power(X, negate(N))),
      makeList(symbol(BESSELJ), N, negate(X))
    );
  }

  if (isnegativeterm(N)) {
    return multiply(
      power(Constants.negOne, N),
      makeList(symbol(BESSELJ), negate(N), X)
    );
  }

  return makeList(symbol(BESSELJ), N, X);
}
