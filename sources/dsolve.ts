import {
  ABS,
  ARCTAN,
  AT,
  caddr,
  cadddr,
  cadr,
  car,
  cddr,
  cdr,
  Cons,
  Constants,
  COS,
  DERIVATIVE,
  INVLAPLACE,
  isadd,
  iscons,
  ismultiply,
  issymbol,
  istensor,
  LAPLACE,
  LOG,
  NIL,
  SETQ,
  SIN,
  TAN,
  TESTEQ,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { at, primeOrder } from './at';
import { integer, rational } from './bignum';
import { coeff } from './coeff';
import { derivative } from './derivative';
import { Eval } from './eval';
import { imag } from './imag';
import { integral } from './integral';
import { isNegative, isPositive, isReal } from './assume';
import { iseveninteger, ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { invlaplace, laplace, linear } from './laplace';
import { checkArgCount, exponential } from './misc';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { power } from './power';
import { real } from './real';
import { equationToExpr, roots } from './roots';
import { build_tensor } from './scan';
import { simplify } from './simplify';
import { solveLinearSystem } from './solve';
import { subst } from './subst';

/* dsolve =================================================================

dsolve(ode, y(x)) solves an ordinary differential equation for y(x) and
returns the right side y(x) = ..., with constants C1, C2, ...; several
branches (y' = x/y) come as a list. Covered:

  first order, y' = f(x,y): linear, separable, Bernoulli
  any order: linear with constant coefficients (forcing via laplace)

dsolve(ode, y(x), [y(0)=1, y'(0)=0]) fits the constants to initial values.

ponytail: no singular solutions (h(y) = 0 of a separable y' = g(x) h(y)),
no variation of parameters (forcing laplace can't transform, like 1/x),
no exact, homogeneous or Euler equations.

*/

type Condition = { order: number; at: U; value: U };

export function Eval_dsolve(p1: U): U {
  checkArgCount(p1, 2, 3);
  const ode = equationToExpr(cadr(p1));
  const Y = Eval(caddr(p1));
  if (!iscons(Y) || !issymbol(cadr(Y)) || cddr(Y) !== symbol(NIL)) {
    stop('dsolve: 2nd argument must be a function call like y(x)');
  }
  const ics = cadddr(p1);
  const conds = ics === symbol(NIL) ? [] : conditions(ics, Y);
  const sols = dsolve(ode, Y, conds);
  if (sols.length === 0) {
    stop('dsolve: no solution satisfies the initial conditions');
  }
  return sols.length === 1 ? sols[0] : build_tensor(sols);
}

// [y(0)=1, y'(0)=0], read without Eval: y(0)=1 would define y
function conditions(ics: U, Y: U): Condition[] {
  const elems = istensor(ics) ? ics.tensor.elem : [ics];
  return elems.map((e) => {
    if (car(e) !== symbol(SETQ) && car(e) !== symbol(TESTEQ)) {
      stop('dsolve: initial conditions must look like y(0)=1');
    }
    const lhs = Eval(cadr(e));
    const value = Eval(caddr(e));
    if (car(lhs) === car(Y) && cddr(lhs) === symbol(NIL)) {
      return { order: 0, at: cadr(lhs), value };
    }
    const order = car(lhs) === symbol(AT) ? primeOrder(cadr(lhs), caddr(lhs)) : 0;
    if (order === 0) {
      stop('dsolve: initial conditions must look like y(0)=1 or y\'(0)=1');
    }
    return { order, at: cadddr(lhs), value };
  });
}

const constant = (i: number) => usr_symbol('C' + i);
const terms = (p: U): U[] => (isadd(p) ? p.tail() : [p]);
const factors = (p: U): U[] => (ismultiply(p) ? p.tail() : [p]);
const isZero = (p: U) => isZeroAtomOrTensor(simplify(p));
const freeOf = (p: U, ...xs: U[]) => xs.every((x) => !Find(p, x));

export function dsolve(ode: U, Y: U, conds: Condition[]): U[] {
  const x = cadr(Y);
  const n = order(ode, Y, x);
  if (n === 0) {
    stop('dsolve: 1st argument has no derivative of ' + Y);
  }

  // placeholders the parser can't produce: $y for y(x), $dk for its
  // k-th derivative, highest first so y(x) inside them is still intact
  const y = usr_symbol('$y');
  const ds = Array.from({ length: n }, (_, k) => usr_symbol('$d' + (k + 1)));
  let E = ode;
  for (let k = n; k >= 1; k--) {
    let dk = Y;
    for (let i = 0; i < k; i++) {
      dk = new Cons(symbol(DERIVATIVE), new Cons(dk, new Cons(x, symbol(NIL))));
    }
    E = subst(E, dk, ds[k - 1]);
  }
  E = Eval(subst(E, Y, y));
  if (Find(E, car(Y))) {
    stop('dsolve: ' + car(Y) + ' must only appear as ' + Y + ' and its derivatives');
  }

  if (n === 1) {
    const lin = linear(E, ds[0]);
    if (lin !== null && !isZero(lin[0])) {
      const f = divide(negate(lin[1]), lin[0]); // y' = f(x, y)
      const sol =
        firstOrderLinear(f, y, x, conds) ??
        separable(f, y, x, conds, Y) ??
        bernoulli(f, y, x, conds);
      if (sol !== null) {
        return sol;
      }
    }
  }
  const sol = constantCoefficients(E, [y, ...ds], x, conds);
  if (sol !== null) {
    return sol;
  }
  stop(
    'dsolve: only separable, first-order linear, Bernoulli or linear ' +
      'equations with constant coefficients are supported'
  );
}

// highest k of d(...d(y(x),x)...,x) in p
function order(p: U, Y: U, x: U): number {
  if (car(p) === symbol(DERIVATIVE)) {
    const k = primeOrder(p, x);
    let inner = p;
    for (let i = 0; i < k; i++) {
      inner = cadr(inner);
    }
    if (k > 0 && car(inner) === car(Y)) {
      return k;
    }
  }
  return iscons(p) ? Math.max(0, ...p.tail().map((q) => order(q, Y, x)), order(car(p), Y, x)) : 0;
}

// ---------------------------------------------------------------- order 1

// y' = a(x) y + b(x): y = (integral(mu b) + C1)/mu with mu = exp(-integral(a))
function firstOrderLinear(f: U, y: U, x: U, conds: Condition[]): U[] | null {
  const lin = linear(f, y);
  if (lin === null) {
    return null;
  }
  const [a, b] = lin;
  const mu = expOf(integral(negate(a), x), x);
  const sol = divide(add(integral(multiply(mu, b), x), constant(1)), mu);
  return [fit(sol, x, 1, conds)];
}

// y' = g(x) h(y): integral(1/h, y) = integral(g, x) + C, solved for y
function separable(f: U, y: U, x: U, conds: Condition[], Y: U): U[] | null {
  let g: U = null;
  let h: U = null;
  for (const x0 of [1, 2, 3]) {
    h = Eval(subst(f, x, integer(x0)));
    if (!isZero(h)) {
      g = simplify(divide(f, h));
      break;
    }
  }
  if (g === null || Find(g, y)) {
    return null;
  }
  const G = integral(divide(Constants.one, h), y);
  const F = integral(g, x);

  // G = F + C as H(x, y) = C. With logs, k (log|u| + c log|v| + ...) =
  // F + C is u v^c ... exp(-F/k) = C, the signs and exp(C/k) go into the
  // constant; k arctan(u) = F + C is u = tan((F + C)/k).
  const t0 = terms(G).find((t) => factors(t).some(isLog));
  const k = t0 && divide(t0, factors(t0).find(isLog));
  const atan = factors(G).find((p) => car(p) === symbol(ARCTAN));
  const ka = atan && divide(G, atan);
  let H = subtract(G, F);
  if (t0 && freeOf(k, x, y)) {
    H = multiply(expOf(divide(G, k), x, y), exponential(negate(divide(F, k))));
  }
  let C = conds.length === 0 ? constant(1) : initialConstant(H, y, x, conds);
  if (!t0 && atan && freeOf(ka, x, y)) {
    H = subtract(cadr(atan), Eval(makeCall(TAN, divide(add(F, C), ka))));
    C = Constants.zero;
  }

  const lin = linear(H, y);
  let sols: U[];
  if (lin !== null && !isZero(lin[0])) {
    sols = [divide(subtract(C, lin[1]), lin[0])];
  } else {
    const p = numerator(subtract(H, C));
    if (!ispolyexpandedform(p, y)) {
      stop('dsolve: can only give the implicit solution ' + Eval(subst(H, y, Y)) + ' = ' + C);
    }
    sols = polyRoots(p, y);
  }
  return keepSatisfying(sols.map(simplify), x, conds);
}

// y' = a(x) y + b(x) y^k: v = y^(1-k) solves v' = (1-k)(a v + b)
function bernoulli(f: U, y: U, x: U, conds: Condition[]): U[] | null {
  let k: U = null;
  let a: U = Constants.zero;
  let b: U = Constants.zero;
  for (const t of terms(f)) {
    const e = Eval(divide(multiply(y, derivative(t, y)), t));
    if (!freeOf(e, x, y) || isZero(e)) {
      return null;
    }
    if (isZero(subtract(e, Constants.one))) {
      a = add(a, divide(t, y));
    } else if (k === null || isZero(subtract(e, k))) {
      k = e;
      b = add(b, divide(t, power(y, k)));
    } else {
      return null;
    }
  }
  if (k === null) {
    return null;
  }
  const m = subtract(Constants.one, k); // v = y^m
  const vconds = conds.map((c) => {
    if (c.order > 0) {
      stop('dsolve: initial conditions of a Bernoulli equation must look like y(0)=1');
    }
    return { ...c, value: power(c.value, m) };
  });
  const [v] = firstOrderLinear(add(multiply(multiply(m, a), y), multiply(m, b)), y, x, vconds);
  const root = power(v, divide(Constants.one, m));
  const sols = iseveninteger(m) ? [negate(root), root] : [root];
  return keepSatisfying(sols, x, conds);
}

// ------------------------------------------------- constant coefficients

// sum a_k y^(k) = q(x): exp(r x) for the roots r of sum a_k r^k, times
// x^j for a root of multiplicity > j, plus a particular solution from
// invlaplace(laplace(q)/P(s))
function constantCoefficients(E: U, vars: U[], x: U, conds: Condition[]): U[] | null {
  const a: U[] = [];
  let rest = E;
  for (const v of vars) {
    const lin = linear(rest, v);
    if (lin === null || !freeOf(lin[0], x, ...vars)) {
      return null;
    }
    a.push(lin[0]);
    rest = lin[1];
  }
  const q = negate(rest);
  if (!freeOf(q, ...vars)) {
    return null;
  }

  const r = usr_symbol('$r');
  const P = a.reduce((acc: U, ak, k) => add(acc, multiply(ak, power(r, integer(k)))), Constants.zero);
  const rs = roots(P, r);
  const basis: U[] = [];
  for (const root of istensor(rs) ? rs.tensor.elem : [rs]) {
    const m = multiplicity(P, r, root);
    const im = imag(root);
    let fs: U[];
    if (isNegative(im) && isReal(real(root))) {
      continue; // its conjugate gives the real pair
    }
    if (isPositive(im) && isReal(real(root))) {
      const e = exponential(multiply(real(root), x));
      const wx = multiply(im, x);
      fs = [multiply(e, Eval(makeCall(COS, wx))), multiply(e, Eval(makeCall(SIN, wx)))];
    } else {
      fs = [exponential(multiply(root, x))];
    }
    for (let j = 0; j < m; j++) {
      for (const f of fs) {
        basis.push(multiply(power(x, integer(j)), f));
      }
    }
  }
  if (basis.length !== vars.length - 1) {
    stop('dsolve: could not find all roots of ' + P);
  }

  let sol = basis.reduce((acc: U, f, i) => add(acc, multiply(constant(i + 1), f)), Constants.zero);
  if (!isZero(q)) {
    const s = usr_symbol('$s');
    const yp = invlaplace(divide(laplace(q, x, s), Eval(subst(P, r, s))), s, x);
    if (Find(yp, symbol(LAPLACE)) || Find(yp, symbol(INVLAPLACE))) {
      stop('dsolve: no particular solution for the right side ' + q);
    }
    // terms of yp that solve the homogeneous equation go into the constants
    const particular = terms(yp).filter((t) => !basis.some((b) => freeOf(divide(t, b), x)));
    sol = particular.reduce(add, sol);
  }
  return [fit(sol, x, basis.length, conds)];
}

// number of successive derivatives of P, P itself first, that vanish at root
function multiplicity(P: U, r: U, root: U): number {
  let m = 0;
  for (let p = P; isZero(Eval(subst(p, r, root))); p = derivative(p, r)) {
    m++;
  }
  return Math.max(m, 1);
}

// ------------------------------------------------------------- helpers

const isLog = (p: U) => car(p) === symbol(LOG);

// real roots for c y^n + d, roots() writes y^2 = x^2 + C as
// y = i (-x^2 - C)^(1/2)
function polyRoots(p: U, y: U): U[] {
  const cs = coeff(p, y);
  const n = cs.length - 1;
  if (n > 1 && cs.slice(1, n).every(isZero)) {
    const root = power(negate(divide(cs[0], cs[n])), rational(1, n));
    return n % 2 === 0 ? [negate(root), root] : [root];
  }
  const r = roots(p, y);
  return istensor(r) ? r.tensor.elem : [r];
}

// exp(I), with each term k log(u), k free of vars, as u^k
// ponytail: abs(u) in the log is dropped, the sign is constant where the
// solution lives and the constant C absorbs it
function expOf(I: U, ...vars: U[]): U {
  return terms(I).reduce((acc: U, t) => {
    const log = factors(t).find(isLog);
    const k = log && divide(t, log);
    return multiply(acc, log && freeOf(k, ...vars) ? power(stripAbs(cadr(log)), k) : exponential(t));
  }, Constants.one);
}

const makeCall = (name: string, arg: U): U =>
  new Cons(symbol(name), new Cons(arg, symbol(NIL)));

function stripAbs(p: U): U {
  const strip = (q: U): U =>
    car(q) === symbol(ABS) ? strip(cadr(q)) : iscons(q) ? new Cons(strip(car(q)), strip(cdr(q))) : q;
  return Eval(strip(p));
}

// the n constants of sol fitted to the conditions, a linear system in them
function fit(sol: U, x: U, n: number, conds: Condition[]): U {
  if (conds.length === 0) {
    return sol;
  }
  const Cs = Array.from({ length: n }, (_, i) => constant(i + 1));
  const eqs = conds.map((c) => subtract(atOrder(sol, x, c), c.value));
  const values = solveLinearSystem(build_tensor(eqs), build_tensor(Cs));
  const vs = istensor(values) ? values.tensor.elem : [values];
  return simplify(Cs.reduce((acc: U, C, i) => Eval(subst(acc, C, vs[i])), sol));
}

// C1 = H(x0, y0) for the relation H(x, y) = C1 of a separable equation
function initialConstant(H: U, y: U, x: U, conds: Condition[]): U {
  if (conds.length !== 1 || conds[0].order !== 0) {
    stop('dsolve: a first-order equation takes one initial condition y(x0)=y0');
  }
  return Eval(subst(subst(H, y, conds[0].value), x, conds[0].at));
}

// the branches that meet the conditions
function keepSatisfying(sols: U[], x: U, conds: Condition[]): U[] {
  return sols.filter((sol) =>
    conds.every((c) => isZero(subtract(atOrder(sol, x, c), c.value)))
  );
}

function atOrder(sol: U, x: U, c: Condition): U {
  let d = sol;
  for (let i = 0; i < c.order; i++) {
    d = derivative(d, x);
  }
  return at(d, x, c.at);
}
