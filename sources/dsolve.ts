import {
  ABS,
  ARCTAN,
  AT,
  caddr,
  cadddr,
  cadr,
  car,
  cdddr,
  cddr,
  cdr,
  Cons,
  Constants,
  COS,
  DERIVATIVE,
  EVAL,
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
  Tensor,
  TESTEQ,
  U,
} from '../runtime/defs';
import { Find } from '../runtime/find';
import { stop } from '../runtime/run';
import { collectUserSymbols, symbol, usr_symbol } from '../runtime/symbol';
import { add, subtract } from './add';
import { at, primeOrder } from './at';
import { integer, rational } from './bignum';
import { coeff } from './coeff';
import { derivative } from './derivative';
import { Eval } from './eval';
import { imag } from './imag';
import { integral } from './integral';
import { isNegative, isPositive, isReal } from './assume';
import { iseveninteger, isfloating, ispolyexpandedform, isZeroAtomOrTensor } from './is';
import { invlaplace, laplace, linear } from './laplace';
import { exponential } from './misc';
import { divide, multiply, negate } from './multiply';
import { numerator } from './numerator';
import { power } from './power';
import { real } from './real';
import { equationToExpr, roots } from './roots';
import { build_tensor } from './scan';
import { simplify } from './simplify';
import { solveLinearSystem } from './solve';
import { solveEquation, tidySolutions } from './solve_transcendental';
import { subst } from './subst';

/* dsolve =================================================================

dsolve(ode, y(x)) solves an ordinary differential equation for y(x) and
returns the right side y(x) = ..., with constants C1, C2, ...; several
branches (y' = x/y) come as a list. Covered:

  first order, y' = f(x,y): linear, separable, Bernoulli, homogeneous
    y' = F(y/x), exact M + N y' = 0
  any order: linear with constant coefficients (forcing via laplace),
    Euler-Cauchy sum a_k x^k y^(k) = q(x), and equations without y, which
    are one order lower in y'

dsolve(ode, y(x), y(0)=1, y'(0)=0) fits the constants to initial or
boundary values, given as further arguments or as a list; y'(0) can be
written d(y(x),x)(0). With fewer conditions than constants the remaining
constants are renumbered from C1.

An equation that can't be solved for y stops with the relation
H(x, y(x)) = C1 in the message.

Euler-Cauchy solutions are written with log(x): real for x > 0, and with
the complex log(x) they solve the equation for x < 0 as well.

dsolve([x' = ..., y' = ...], [x(t), y(t)]) solves a first-order linear
system with constant coefficients and returns [x(t), y(t)]; C1, C2, ...
are the values at 0.

The constant solutions y = y0, h(y0) = 0 of a separable y' = g(x) h(y)
(and y = 0 of a Bernoulli equation) are only given when a condition
y(x0) = y0 asks for one; the general solution does not list them.

The constants avoid the names C1, C2, ... that the equation or the
conditions use themselves.

ponytail: variation of parameters for order 2 only, no Riccati, no y'' = f(y, y'),
no shifted Euler-Cauchy (a x + b)^k, conditions are solved one at a time
for one constant each.

*/

// a condition on the derivative of this order of the index-th function
type Condition = { index: number; order: number; at: U; value: U };

export function Eval_dsolve(p1: U): U {
  const used: U[] = [];
  collectUserSymbols(p1, used);
  takenConstants = used.map((v) => /^C(\d+)$/.exec(v.toString())).map((m) => (m ? +m[1] : 0));
  const Y = Eval(caddr(p1));
  const Ys = istensor(Y) ? Y.tensor.elem : [Y];
  if (!Ys.every((F) => iscons(F) && issymbol(cadr(F)) && cddr(F) === symbol(NIL))) {
    stop('dsolve: 2nd argument must be a function call like y(x)');
  }
  const conds: Condition[] = [];
  for (let p = cdddr(p1); iscons(p); p = cdr(p)) {
    const ics = car(p);
    conds.push(...(istensor(ics) ? ics.tensor.elem : [ics]).map((e) => condition(e, Ys)));
  }
  // the equations unevaluated: Eval would take x' = y as a definition
  const eqs = cadr(p1);
  const sols = istensor(Y)
    ? system((istensor(eqs) ? eqs.tensor.elem : [eqs]).map(equationToExpr), Ys, conds)
    : dsolve(equationToExpr(eqs), Y, conds);
  if (sols.length === 0) {
    stop('dsolve: no solution satisfies the conditions');
  }
  return sols.length === 1 ? sols[0] : build_tensor(sols);
}

// y(0)=1, y'(0)=0 or d(y(x),x)(0)=0, read without Eval: y(0)=1 would define y
function condition(e: U, Ys: U[]): Condition {
  const Y = Ys[0];
  const isEquation = car(e) === symbol(SETQ) || car(e) === symbol(TESTEQ);
  // the parser reads d(y(x),x)(0) as the call eval(d(y(x),x))(0)
  const callee = car(cadr(e));
  let lhs =
    car(callee) === symbol(EVAL) && cddr(cadr(e)) === symbol(NIL)
      ? at(Eval(cadr(callee)), cadr(Y), Eval(cadr(cadr(e))))
      : Eval(cadr(e));
  let x0: U = cadr(lhs);
  let order = 0;
  if (car(lhs) === symbol(AT)) {
    order = primeOrder(cadr(lhs), caddr(lhs));
    x0 = cadddr(lhs);
    lhs = cadr(lhs);
  } else if (car(lhs) === symbol(DERIVATIVE)) {
    order = primeOrder(lhs, caddr(lhs)); // y'(a) is d(y(a),a)
    x0 = caddr(lhs);
  }
  for (let i = 0; i < order; i++) {
    lhs = cadr(lhs);
  }
  const index = Ys.findIndex((F) => car(F) === car(lhs));
  if (!isEquation || index < 0 || cddr(lhs) !== symbol(NIL)) {
    stop("dsolve: conditions must look like y(0)=1, y'(0)=1 or d(y(x),x,2)(0)=1");
  }
  return { index, order, at: x0, value: Eval(caddr(e)) };
}

// the i-th of the names C1, C2, ... that the input does not use itself
let takenConstants: number[] = [];
const constant = (i: number) => {
  let k = 0;
  for (let free = 0; free < i; ) {
    free += takenConstants.includes(++k) ? 0 : 1;
  }
  return usr_symbol('C' + k);
};
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
  let dY = Y;
  const dYs = ds.map(() => (dY = new Cons(symbol(DERIVATIVE), new Cons(dY, new Cons(x, symbol(NIL))))));
  for (let k = n; k >= 1; k--) {
    E = subst(E, dYs[k - 1], ds[k - 1]);
  }
  E = Eval(subst(E, Y, y));
  if (Find(E, car(Y))) {
    stop('dsolve: ' + car(Y) + ' must only appear as ' + Y + ' and its derivatives');
  }
  const sols = solveOrder(E, [y, ...ds], x, conds, [Y, ...dYs]);
  if (sols === null) {
    stop(
      'dsolve: unsupported equation. Supported: first order separable, linear, ' +
        "Bernoulli, homogeneous y'=F(y/x), exact; linear with constant " +
        "coefficients; Euler-Cauchy; y''=f(x,y')"
    );
  }
  return sols;
}

// E = 0 in vars = [y, y', ..., y^(n)]; Ys are their names for messages
function solveOrder(E: U, vars: U[], x: U, conds: Condition[], Ys: U[]): U[] | null {
  const n = vars.length - 1;
  if (n === 1) {
    const sols = firstOrder(E, vars[0], vars[1], x, conds, Ys[0]);
    if (sols !== null) {
      return sols;
    }
  }
  const lin = linearCoefficients(E, vars);
  const sol = lin && (constantCoefficients(lin.a, lin.q, x) ?? eulerCauchy(lin.a, lin.q, x));
  if (sol) {
    return fitAll([sol], x, n, conds);
  }
  // without y: one order lower in p = y', then y = integral(p) + Cn
  if (n > 1 && !Find(E, vars[0])) {
    const Ep = vars.slice(1).reduce((acc, v, k) => subst(acc, v, vars[k]), E);
    const ps = solveOrder(Ep, vars.slice(0, n), x, [], Ys.slice(1));
    if (ps !== null) {
      const sols = ps.map((p) => {
        const I = tryIntegral(p, x);
        if (I === null) {
          stop('dsolve: no integral of ' + Ys[1] + ' = ' + p);
        }
        return add(I, constant(n));
      });
      return fitAll(sols, x, n, conds);
    }
  }
  return null;
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

function firstOrder(E: U, y: U, d1: U, x: U, conds: Condition[], Y: U): U[] | null {
  const lin = linear(E, d1);
  if (lin === null || isZero(lin[0])) {
    return null;
  }
  const f = divide(negate(lin[1]), lin[0]); // y' = f(x, y)
  const tryExact = (l: [U, U] | null) => l && exact(l[1], l[0], y, x, conds, Y);
  return (
    firstOrderLinear(f, y, x, conds) ??
    separable(f, y, x, conds, Y) ??
    bernoulli(f, y, x, conds) ??
    homogeneous(f, y, x, conds, Y) ??
    tryExact(lin) ??
    tryExact(linear(numerator(E), d1)) // with the denominators cleared
  );
}

// y' = a(x) y + b(x): y = (integral(mu b) + C1)/mu with mu = exp(-integral(a))
function firstOrderLinear(f: U, y: U, x: U, conds: Condition[]): U[] | null {
  const lin = linear(f, y);
  if (lin === null) {
    return null;
  }
  const [a, b] = lin;
  const mu = expOf(integral(negate(a), x), x);
  const sol = divide(add(integral(multiply(mu, b), x), constant(1)), mu);
  return fitAll([sol], x, 1, conds);
}

// y' = g(x) h(y)
function separable(f: U, y: U, x: U, conds: Condition[], Y: U): U[] | null {
  const rel = separableRelation(f, y, x, conds);
  return rel && explicit(rel.H, rel.C, y, x, conds, Y);
}

// y' = g(x) h(y): integral(1/h, y) = integral(g, x) + C as H(x, y) = C
function separableRelation(f: U, y: U, x: U, conds: Condition[]): { H: U; C: U } | null {
  let g: U = null;
  let h: U = null;
  for (const x0 of [1, 2, 3]) {
    h = Eval(subst(f, x, integer(x0)));
    if (!isZero(h)) {
      g = simplify(divide(f, h));
      break;
    }
  }
  // simplify does not cancel (y^2+1)/(1/2*y^2+1/2): g from a value of y,
  // checked by f = g h
  for (const y0 of g !== null && Find(g, y) ? [1, 2, 3] : []) {
    const at = (p: U) => Eval(subst(p, y, integer(y0)));
    try {
      const g0 = simplify(divide(at(f), at(h)));
      if (isZero(subtract(f, multiply(g0, h)))) {
        g = g0;
        break;
      }
    } catch (e) {
      // no value at this y0
    }
  }
  if (g === null || Find(g, y)) {
    return null;
  }
  // the constant solution y = y0 for h(y0) = 0, where 1/h has no integral
  if (conds.length === 1 && conds[0].order === 0 && vanishes(h, y, conds[0].value)) {
    return { H: y, C: conds[0].value };
  }
  const G = tryIntegral(divide(Constants.one, h), y) ?? tryIntegral(simplify(divide(Constants.one, h)), y);
  const F = tryIntegral(g, x);
  if (G === null || F === null) {
    return null;
  }

  // With logs, k (log|u| + c log|v| + ...) = F + C is
  // u v^c ... exp(-F/k) = C, the signs and exp(C/k) go into the constant;
  // k arctan(u) = F + C is u = tan((F + C)/k).
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
    // an arbitrary constant stays one when divided by ka
    const angle = conds.length === 0 ? add(divide(F, ka), C) : divide(add(F, C), ka);
    H = subtract(cadr(atan), Eval(makeCall(TAN, angle)));
    C = Constants.zero;
  }
  return { H, C };
}

// H(x, y) = C solved for y: linear or a polynomial in y
function explicit(H: U, C: U, y: U, x: U, conds: Condition[], Y: U): U[] {
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
  // y = 0 is the solution for k > 1, where v = y^(1-k) has no value
  if (isPositive(subtract(k, Constants.one)) && conds.length === 1 && conds[0].order === 0 && isZero(conds[0].value)) {
    return [Constants.zero];
  }
  const m = subtract(Constants.one, k); // v = y^m
  const vconds = conds.map((c) => {
    if (c.order > 0) {
      stop('dsolve: initial conditions of a Bernoulli equation must look like y(0)=1');
    }
    return { ...c, value: power(c.value, m) };
  });
  const vs = firstOrderLinear(add(multiply(multiply(m, a), y), multiply(m, b)), y, x, vconds);
  if (vs.length === 0) {
    return [];
  }
  const root = power(vs[0], divide(Constants.one, m));
  const sols = iseveninteger(m) ? [negate(root), root] : [root];
  return keepSatisfying(sols, x, conds);
}

// y' = F(y/x): y = v x gives the separable x v' = F(v) - v
function homogeneous(f: U, y: U, x: U, conds: Condition[], Y: U): U[] | null {
  const v = usr_symbol('$v');
  const F = simplify(Eval(subst(f, y, multiply(v, x))));
  if (Find(F, x)) {
    return null;
  }
  const vconds = conds.map((c) => (c.order > 0 ? c : { ...c, value: divide(c.value, c.at) }));
  const rel = separableRelation(divide(simplify(subtract(F, v)), x), v, x, vconds);
  return rel && explicit(Eval(subst(rel.H, v, divide(y, x))), rel.C, y, x, conds, Y);
}

// M + N y' = 0 with dM/dy = dN/dx: Psi(x, y) = C for
// Psi = integral(M, x) + integral(N - d(integral(M, x), y), y)
function exact(M: U, N: U, y: U, x: U, conds: Condition[], Y: U): U[] | null {
  if (!isZero(subtract(derivative(M, y), derivative(N, x)))) {
    return null;
  }
  const P = tryIntegral(M, x);
  const rest = P && simplify(subtract(N, derivative(P, y)));
  const R = rest && !Find(rest, x) ? tryIntegral(rest, y) : null;
  if (R === null) {
    return null;
  }
  const Psi = add(P, R);
  const C = conds.length === 0 ? constant(1) : initialConstant(Psi, y, x, conds);
  return explicit(Psi, C, y, x, conds, Y);
}

// ------------------------------------------------------ linear, any order

// E = sum a_k vars[k] - q with a_k and q free of vars, else null
function linearCoefficients(E: U, vars: U[]): { a: U[]; q: U } | null {
  const a: U[] = [];
  let rest = E;
  for (const v of vars) {
    const lin = linear(rest, v);
    if (lin === null || !freeOf(lin[0], ...vars)) {
      return null;
    }
    a.push(lin[0]);
    rest = lin[1];
  }
  return freeOf(rest, ...vars) ? { a, q: negate(rest) } : null;
}

// sum a_k y^(k) = q(x) with constant a_k
function constantCoefficients(a: U[], q: U, x: U): U | null {
  if (!freeOf(build_tensor(a), x)) {
    return null;
  }
  const r = usr_symbol('$r');
  const P = a.reduce((acc: U, ak, k) => add(acc, multiply(ak, power(r, integer(k)))), Constants.zero);
  return characteristic(P, r, a.length - 1, q, x);
}

// sum a_k x^k y^(k) = q(x), up to a common factor of the a_k: with
// x = exp(t) it has constant coefficients in t, the characteristic
// polynomial is sum a_k r (r-1) ... (r-k+1)
function eulerCauchy(a: U[], q: U, x: U): U | null {
  const n = a.length - 1;
  const lead = divide(a[n], power(x, integer(n))); // the common factor
  const b = a.map((ak, k) => simplify(divide(ak, multiply(lead, power(x, integer(k))))));
  if (!freeOf(build_tensor(b), x)) {
    return null;
  }
  const r = usr_symbol('$r');
  const t = usr_symbol('$t');
  let falling: U = Constants.one; // r (r-1) ... (r-k+1)
  let P: U = Constants.zero;
  b.forEach((bk, k) => {
    P = add(P, multiply(bk, falling));
    falling = multiply(falling, subtract(r, integer(k)));
  });
  const qt = Eval(subst(divide(q, lead), x, exponential(t)));
  const sol = characteristic(P, r, n, qt, t, divide(q, lead));
  return Eval(subst(sol, t, makeCall(LOG, x)));
}

// general solution of P(d/dx) y = q for the polynomial P(r) of degree n:
// exp(r x) for the roots r of P, times x^j for a root of multiplicity > j,
// plus a particular solution from invlaplace(laplace(q)/P(s)) or, for
// n = 2, from variation of parameters. rightSide is q for the message.
function characteristic(P: U, r: U, n: number, q: U, x: U, rightSide = q): U {
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
  if (basis.length !== n) {
    stop('dsolve: could not find all roots of ' + P);
  }

  const sol = basis.reduce((acc: U, f, i) => add(acc, multiply(constant(i + 1), f)), Constants.zero);
  if (isZero(q)) {
    return sol;
  }
  const s = usr_symbol('$s');
  let yp = invlaplace(divide(laplace(q, x, s), Eval(subst(P, r, s))), s, x);
  if (Find(yp, symbol(LAPLACE)) || Find(yp, symbol(INVLAPLACE))) {
    yp = n === 2 ? variationOfParameters(basis, divide(q, coeff(P, r)[2]), x) : null;
  }
  if (yp === null) {
    stop('dsolve: no particular solution for the right side ' + rightSide);
  }
  // terms of yp that solve the homogeneous equation go into the constants
  const particular = terms(yp).filter((t) => !basis.some((b) => freeOf(divide(t, b), x)));
  return particular.reduce(add, sol);
}

// y'' + ... = g: yp = -y1 integral(y2 g/W) + y2 integral(y1 g/W) with the
// Wronskian W = y1 y2' - y2 y1'
function variationOfParameters([y1, y2]: U[], g: U, x: U): U | null {
  const W = subtract(multiply(y1, derivative(y2, x)), multiply(y2, derivative(y1, x)));
  const gW = divide(g, simplify(W));
  const I1 = tryIntegral(simplify(multiply(y2, gW)), x);
  const I2 = tryIntegral(simplify(multiply(y1, gW)), x);
  return I1 && I2 && Eval(subtract(multiply(y2, I2), multiply(y1, I1)));
}

// ---------------------------------------------------------------- systems

// sum_j m_ij y_j' + a_ij y_j = q_i(t) with constant m_ij, a_ij. The laplace
// transform sum_j m_ij (s Y_j - y_j(0)) + a_ij Y_j = Q_i is linear in the
// Y_j; the constants are the values at 0, Cj = y_j(0).
function system(odes: U[], Ys: U[], conds: Condition[]): U[] {
  const n = Ys.length;
  const t = cadr(Ys[0]);
  if (odes.length !== n || !Ys.every((F) => cadr(F) === t)) {
    stop('dsolve: a system takes as many equations as functions like x(t), y(t) of one variable');
  }
  if (odes.some(isfloating)) {
    stop('dsolve: a system needs exact coefficients, 1/2 instead of 0.5'); // invlaplace factors
  }
  const s = usr_symbol('$s');
  const ys = Ys.map((_, j) => usr_symbol('$y' + (j + 1)));
  const ds = Ys.map((_, j) => usr_symbol('$d' + (j + 1)));
  const transforms = Ys.map((_, j) => usr_symbol('$Y' + (j + 1)));
  const eqs = odes.map((ode) => {
    let E = ode;
    Ys.forEach((F, j) => {
      const dF = new Cons(symbol(DERIVATIVE), new Cons(F, new Cons(t, symbol(NIL))));
      E = subst(subst(E, dF, ds[j]), F, ys[j]);
    });
    const lin = linearCoefficients(Eval(E), [...ys, ...ds]);
    if (
      lin === null ||
      !freeOf(build_tensor(lin.a), t) ||
      Ys.some((F) => order(ode, F, t) > 1 || Find(lin.q, car(F)))
    ) {
      stop('dsolve: only first-order linear systems with constant coefficients are supported');
    }
    return transforms.reduce((acc: U, Yj, j) => {
      const dYj = subtract(multiply(s, Yj), constant(j + 1));
      return add(acc, add(multiply(lin.a[n + j], dYj), multiply(lin.a[j], Yj)));
    }, negate(laplace(lin.q, t, s)));
  });
  const solved = solveLinearSystem(build_tensor(eqs), build_tensor(transforms) as Tensor);
  const sol = build_tensor((solved as Tensor).elem.map((Yj) => invlaplace(Yj, s, t)));
  if (Find(sol, symbol(LAPLACE)) || Find(sol, symbol(INVLAPLACE))) {
    stop('dsolve: the laplace transform does not solve this system');
  }
  return fitAll([sol], t, n, conds);
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

// p = 0 at y = y0; a p without value there does not vanish
function vanishes(p: U, y: U, y0: U): boolean {
  try {
    return isZero(Eval(subst(p, y, y0)));
  } catch (e) {
    return false;
  }
}

// integral() stops when it finds none
function tryIntegral(f: U, x: U): U | null {
  try {
    return integral(f, x);
  } catch (e) {
    return null;
  }
}

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

// The constants C1..Cn of each solution fitted to the conditions one by
// one: a condition is solved for a constant, linearly if possible, else by
// solve, where several values give several solutions. The constants that
// stay are renumbered from C1. A solution the conditions contradict drops
// out.
function fitAll(sols: U[], x: U, n: number, conds: Condition[]): U[] {
  if (conds.length === 0) {
    return sols;
  }
  const Cs = Array.from({ length: n }, (_, i) => constant(i + 1));
  const fitted = sols.reduce((acc: U[], sol) => acc.concat(fit(sol, x, Cs, conds)), []);
  return fitted.map((sol) => {
    Cs.filter((C) => Find(sol, C)).forEach((C, i) => {
      sol = subst(sol, C, constant(i + 1));
    });
    return simplify(Eval(sol));
  });
}

function fit(sol: U, x: U, Cs: U[], conds: Condition[]): U[] {
  if (conds.length === 0) {
    return [sol];
  }
  let eq: U;
  try {
    eq = subtract(atOrder(sol, x, conds[0]), conds[0].value);
  } catch (e) {
    stop('dsolve: the solution ' + sol + ' has no value at ' + x + ' = ' + conds[0].at);
  }
  if (isZero(eq)) {
    return fit(sol, x, Cs, conds.slice(1));
  }
  const open = Cs.filter((C) => Find(eq, C));
  for (const solveFor of [linearConstant, solvedConstant]) {
    for (const C of open) {
      const values = solveFor(eq, C);
      if (values.length > 0) {
        return values.reduce(
          (acc: U[], v) => acc.concat(fit(Eval(subst(sol, C, v)), x, Cs, conds.slice(1))),
          []
        );
      }
    }
  }
  if (open.length > 0) {
    stop('dsolve: cannot fit the constants to the condition at ' + conds[0].at);
  }
  return [];
}

function linearConstant(eq: U, C: U): U[] {
  const lin = linear(eq, C);
  return lin === null || isZero(lin[0]) ? [] : [divide(negate(lin[1]), lin[0])];
}

function solvedConstant(eq: U, C: U): U[] {
  try {
    return tidySolutions(solveEquation(eq, C));
  } catch (e) {
    return [];
  }
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
  let d = istensor(sol) ? sol.tensor.elem[c.index] : sol; // a system
  for (let i = 0; i < c.order; i++) {
    d = derivative(d, x);
  }
  return at(d, x, c.at);
}
