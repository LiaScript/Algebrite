import { Facts, facts } from './assume';
import {
  caddr,
  cadr,
  car,
  cddr,
  cdr,
  Constants,
  DOUBLE,
  INF,
  iscons,
  MSIGN,
  NIL,
  NUM,
  Sign,
  Sym,
  TESTEQ,
  TESTGE,
  TESTGT,
  TESTLE,
  TESTLT,
  U
} from '../runtime/defs';
import { symbol } from "../runtime/symbol";
import { subtract } from './add';
import { Eval } from './eval';
import { yyfloat } from './float';
import {
  isZeroAtomOrTensor,
  isZeroLikeOrNonZeroLikeOrUndetermined
} from './is';
import { Find } from '../runtime/find';
import { comparable, evalLogic, evalNot, simplifyComparison } from './logic_simplify';
import { equal } from './misc';
import { negate } from './multiply';
import { isQuantity } from './quantity';
import { simplify } from './simplify';

// If the number of args is odd then the last arg is the default result.
// Works like a switch statement. Could also be used for piecewise
// functions? TODO should probably be called "switch"?
export function Eval_test(p1: U) {
  const orig = p1;
  p1 = cdr(p1);
  while (iscons(p1)) {
    // odd number of parameters means that the
    // last argument becomes the default case
    // i.e. the one without a test.
    if (cdr(p1) === symbol(NIL)) {
      return Eval(car(p1)); // default case
    }

    const checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(car(p1));
    if (checkResult == null) {
      // we couldn't determine the result
      // of a test. This means we can't conclude
      // anything about the result of the
      // overall test, so we must bail
      // with the unevalled test
      return orig;
    } else if (checkResult) {
      // test succesful, we found out output
      return Eval(cadr(p1));
    } else {
      // test unsuccessful, continue to the
      // next pair of test,value
      p1 = cddr(p1);
    }
  }

  // no test matched and there was no
  // catch-all case, so we return zero.
  return Constants.zero;
}

// we test A==B by first subtracting and checking if we symbolically
// get zero. If not, we evaluate to float and check if we get a zero.
// If we get another NUMBER then we know they are different.
// If we get something else, then we don't know and we return the
// unaveluated test, which is the same as saying "maybe".
export function Eval_testeq(p1: U) {
  const lhs = Eval(cadr(p1));
  const rhs = Eval(caddr(p1));
  // identical sides: no need to subtract (and inf-inf is indeterminate)
  if (equal(lhs, rhs)) {
    return Constants.one;
  }

  // first try without simplifyng both sides
  let subtractionResult = subtract(lhs, rhs);

  // OK so we are doing something tricky here
  // we are using isZeroLikeOrNonZeroLikeOrUndetermined to check if the result
  // is zero or not zero or unknown.
  // isZeroLikeOrNonZeroLikeOrUndetermined has some routines
  // to determine the zero-ness/non-zero-ness or
  // undeterminate-ness of things so we use
  // that here and down below.
  let checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(subtractionResult);
  if (checkResult) {
    return Constants.zero;
  } else if (checkResult != null && !checkResult) {
    return Constants.one;
  }

  // we didn't get a simple numeric result but
  // let's try again after doing
  // a simplification on both sides
  const arg1 = simplify(Eval(cadr(p1)));
  const arg2 = simplify(Eval(caddr(p1)));
  subtractionResult = subtract(arg1, arg2);

  checkResult = isZeroLikeOrNonZeroLikeOrUndetermined(subtractionResult);
  if (checkResult) {
    return Constants.zero;
  } else if (checkResult != null && !checkResult) {
    return Constants.one;
  }

  // known to differ from the assumptions
  if (facts(subtractionResult).zero === false) {
    return Constants.zero;
  }

  // if we didn't get to a number then we
  // don't know whether the quantities are
  // different: the equation comes back simplified
  return simplifyComparison(TESTEQ, lhs, rhs);
}

// Relational operators: decided by the sign of the operand difference (a
// number, or known from the assumptions, also as "not negative" for >= and
// <), otherwise the comparison comes back simplified (logic_simplify.ts).
function Eval_relation(p1: U) {
  const name = (car(p1) as Sym).printname;
  const lhs = Eval(cadr(p1));
  const rhs = Eval(caddr(p1));
  const { sign, known } = compare(lhs, rhs);
  const holds = (s: number) =>
    ({ [TESTGE]: s >= 0, [TESTGT]: s > 0, [TESTLE]: s <= 0, [TESTLT]: s < 0 }[name]);
  if (sign != null) {
    return holds(sign) ? Constants.one : Constants.zero;
  }
  // a difference known to be >= 0 (or <= 0) decides when 0 and 1 (or -1) agree
  const weak = known.negative === false ? 1 : known.positive === false ? -1 : 0;
  if (weak !== 0 && holds(0) === holds(weak)) {
    return holds(0) ? Constants.one : Constants.zero;
  }
  return simplifyComparison(name, lhs, rhs);
}

export const Eval_testge = Eval_relation;
export const Eval_testgt = Eval_relation;
export const Eval_testle = Eval_relation;
export const Eval_testlt = Eval_relation;

// not, and, or: see logic_simplify.ts
export function Eval_not(p1: U) {
  return evalNot(p1);
}

export function Eval_and(p1: U) {
  return evalLogic(p1, true);
}

export function Eval_or(p1: U) {
  return evalLogic(p1, false);
}

// Sign of arg1 - arg2 (both already evaluated), or null when undecidable.
export function cmp_values(arg1: U, arg2: U): Sign {
  return compare(arg1, arg2).sign;
}

// inf: 1, -inf: -1
const infinite = (p: U) =>
  p === symbol(INF) ? 1 : equal(p, negate(symbol(INF))) ? -1 : 0;

// The sign of arg1 - arg2, and with a null sign what the assumptions say
// about the difference (it may still be known not to be negative).
export function compare(arg1: U, arg2: U): { sign: Sign; known: Facts } {
  // identical arguments: no need to subtract (and inf-inf is indeterminate)
  if (equal(arg1, arg2)) {
    return { sign: 0, known: {} };
  }
  // an infinity against a real value
  const finite = (p: U) => !Find(p, symbol(INF)) && comparable(p) && facts(p).real === true;
  if (
    infinite(arg1) !== infinite(arg2) &&
    [arg1, arg2].every((p) => infinite(p) !== 0 || finite(p))
  ) {
    return { sign: infinite(arg1) > infinite(arg2) ? 1 : -1, known: {} };
  }
  let t: Sign = 0;
  let p1 = subtract(simplify(arg1), simplify(arg2));

  // same-dimension quantities subtract to a quantity (incompatible ones
  // already stopped inside subtract) — its sign is the magnitude's sign
  if (isQuantity(p1)) {
    p1 = cadr(p1);
  }

  const difference = p1;

  // try floating point if necessary
  if (p1.k !== NUM && p1.k !== DOUBLE) {
    p1 = Eval(yyfloat(p1));
  }

  //console.log "comparison: " + p1.toString()

  if (isZeroAtomOrTensor(p1)) {
    //console.log "comparison isZero "
    return { sign: 0, known: {} };
  }

  switch (p1.k) {
    case NUM:
      if (MSIGN(p1.q.a) === -1) {
        t = -1;
      } else {
        t = 1;
      }
      break;
    case DOUBLE:
      //console.log "comparison p1.d: " + p1.d
      if (p1.d < 0.0) {
        t = -1;
      } else {
        t = 1;
      }
      break;
    default: {
      // the sign may be known from the assumptions
      const known = facts(difference);
      t = known.positive ? 1 : known.negative ? -1 : known.zero ? 0 : null;
      return { sign: t, known };
    }
  }

  return { sign: t, known: {} };
}
