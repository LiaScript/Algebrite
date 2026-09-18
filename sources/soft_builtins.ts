import { U } from '../runtime/defs';
import { Eval_gamma } from './gamma';
import {
  Eval_cholesky,
  Eval_hessian,
  Eval_jacobian,
  Eval_laplacian,
  Eval_lu,
  Eval_norm,
  Eval_qr
} from './linalg';
import { Eval_append, Eval_length, Eval_map, Eval_range, Eval_sort, Eval_table } from './lists';
import {
  Eval_fibonacci,
  Eval_harmonic,
  Eval_nextprime,
  Eval_powermod,
  Eval_primes,
  Eval_totient
} from './numbers';
import { Eval_beta, Eval_cfrac, evalChebyshev, evalSpecial, SPECIAL } from './special';
import { Eval_test } from './test';
import { Eval_bernoulli, Eval_zeta } from './zeta';

// Builtins that a user definition overrides. They are not keywords: the
// names stay free for variables (gamma, beta) and for functions of the
// user's own (the laplacian in spherical coordinates of the hydrogen
// example). Eval_user_function looks a name up here when it has no binding.
let table: { [name: string]: (p1: U) => U } | undefined;

export function softBuiltin(name: string): ((p1: U) => U) | undefined {
  if (!table) {
    // built on first use: the modules import each other in a cycle
    table = {
      gamma: Eval_gamma,
      zeta: Eval_zeta,
      bernoulli: Eval_bernoulli,
      beta: Eval_beta,
      chebyshevt: evalChebyshev('chebyshevt'),
      chebyshevu: evalChebyshev('chebyshevu'),
      cfrac: Eval_cfrac,
      fibonacci: Eval_fibonacci,
      harmonic: Eval_harmonic,
      totient: Eval_totient,
      powermod: Eval_powermod,
      nextprime: Eval_nextprime,
      primes: Eval_primes,
      norm: Eval_norm,
      jacobian: Eval_jacobian,
      gradient: Eval_jacobian,
      hessian: Eval_hessian,
      laplacian: Eval_laplacian,
      lu: Eval_lu,
      qr: Eval_qr,
      cholesky: Eval_cholesky,
      length: Eval_length,
      append: Eval_append,
      sort: Eval_sort,
      range: Eval_range,
      table: Eval_table,
      map: Eval_map,
      // if(c1, v1, c2, v2, ..., default) is test under the name other CAS use
      if: Eval_test
    };
    Object.keys(SPECIAL).forEach((name) => (table[name] = evalSpecial(name)));
  }
  return Object.prototype.hasOwnProperty.call(table, name) ? table[name] : undefined;
}
