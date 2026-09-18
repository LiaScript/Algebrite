import { countOccurrencesOfSymbol } from '../runtime/count';
import {
  ADD,
  caddr,
  cadr,
  car,
  Constants,
  DEBUG,
  defs,
  E,
  INF,
  evalFloats,
  noFloats,
  iscons,
  isrational,
  istensor,
  MULTIPLY,
  NIL,
  PI,
  POWER,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { symbol } from "../runtime/symbol";
import { bigFloat, MAX_DIGITS } from './bigfloat';
import { bignum_float, double, nativeInt } from './bignum';
import { Eval } from './eval';
import { makeList } from './list';
import { copy_tensor } from './tensor';

// float(x) in double precision, float(x, n) to n significant digits
export function Eval_float(p1: U) {
  if (caddr(p1) !== symbol(NIL)) {
    const n = nativeInt(Eval(caddr(p1)));
    if (isNaN(n) || n < 1 || n > MAX_DIGITS) {
      stop(`float: 2nd argument must be a number of digits from 1 to ${MAX_DIGITS}`);
    }
    return bigFloat(noFloats(Eval, cadr(p1)), n);
  }
  // exactly first, like N[] elsewhere: gcd, roots, the integral table and
  // primality tests give wrong answers or none on float input
  const exact = noFloats(Eval, cadr(p1));
  return evalFloats(() => Eval(yyfloat(exact)));
}

function checkFloatHasWorkedOutCompletely(nodeToCheck) {
  const numberOfPowers = countOccurrencesOfSymbol(symbol(POWER), nodeToCheck);
  const numberOfPIs = countOccurrencesOfSymbol(symbol(PI), nodeToCheck);
  const numberOfEs = countOccurrencesOfSymbol(symbol(E), nodeToCheck);
  const numberOfMults = countOccurrencesOfSymbol(symbol(MULTIPLY), nodeToCheck);
  const numberOfSums = countOccurrencesOfSymbol(symbol(ADD), nodeToCheck);
  if (DEBUG) {
    console.log(`     ... numberOfPowers: ${numberOfPowers}`);
    console.log(`     ... numberOfPIs: ${numberOfPIs}`);
    console.log(`     ... numberOfEs: ${numberOfEs}`);
    console.log(`     ... numberOfMults: ${numberOfMults}`);
    console.log(`     ... numberOfSums: ${numberOfSums}`);
  }
  if (
    numberOfPowers > 1 ||
    numberOfPIs > 0 ||
    numberOfEs > 0 ||
    numberOfMults > 1 ||
    numberOfSums > 1
  ) {
    return stop('float: some unevalued parts in ' + nodeToCheck);
  }
}

// Runs an exact algorithm (roots, integral tables, ...) with float evaluation
// off and converts its result afterwards when it was asked for inside
// float(): those algorithms cannot match or factor float coefficients.
export function evalExactly(f: (p1: U) => U, p1: U): U {
  const asFloats = defs.evaluatingAsFloats;
  const result = noFloats(f, p1);
  // an unevaluated call comes back as it is, also inside the result
  // (a*defint(...)): converting it would evaluate it again, without end
  const unevaluated = (p: U): boolean =>
    iscons(p) && (car(p) === car(p1) || p.tail().some(unevaluated));
  if (!asFloats || unevaluated(result)) {
    return result;
  }
  return zzfloat(result);
}

export function zzfloat(p1: U): U {
  evalFloats(() => {
    //p1 = pop()
    //push(cadr(p1))
    //push(p1)
    p1 = Eval(p1);
    p1 = yyfloat(p1);
    p1 = Eval(p1); // normalize
  });
  return p1;
}
// zzfloat doesn't necessarily result in a double
// , for example if there are variables. But
// in many of the tests there should be indeed
// a float, this line comes handy to highlight
// when that doesn't happen for those tests.
//checkFloatHasWorkedOutCompletely(stack[tos-1])

export function yyfloat(p1: U): U {
  return evalFloats(yyfloat_, p1);
}

function yyfloat_(p1: U): U {
  if (iscons(p1)) {
    return makeList(...p1.map(yyfloat_));
  }
  if (istensor(p1)) {
    p1 = copy_tensor(p1);
    p1.tensor.elem = p1.tensor.elem.map(yyfloat_);
    return p1;
  }
  if (isrational(p1)) {
    return bignum_float(p1);
  }
  if (p1 === symbol(PI)) {
    return Constants.piAsDouble;
  }
  if (p1 === symbol(E)) {
    return double(Math.E);
  }
  if (p1 === symbol(INF)) {
    return double(Infinity);
  }
  return p1;
}
