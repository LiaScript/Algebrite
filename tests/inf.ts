import { run_test } from '../test-harness';

// inf is a reserved symbol like pi, with just enough arithmetic to be safe:
// finite numbers are absorbed, indeterminate forms stop, and terms with
// unknown symbols are left alone.
run_test([
  'inf',
  'inf',

  '-inf',
  '-inf',

  'printlatex(inf)',
  '\\infty',

  'printlatex(-inf)',
  '-\\infty',

  // float overflow prints as inf instead of JavaScript's Infinity
  'exp(1000.0)',
  'inf',

  '-exp(1000.0)',
  '-inf',

  'printlatex(exp(1000.0))',
  '\\infty',

  'float(inf)',
  'inf',

  'float(-inf)',
  '-inf',

  // finite numbers are absorbed
  'inf+1',
  'inf',

  'inf-5',
  'inf',

  '2*inf',
  'inf',

  '-3*inf',
  '-inf',

  '1.5*inf',
  'inf',

  'inf+inf',
  'inf',

  '-inf-inf',
  '-inf',

  'inf*inf',
  'inf',

  'inf^2',
  'inf',

  '(-inf)^2',
  'inf',

  '(-inf)^3',
  '-inf',

  'sqrt(inf)',
  'inf',

  '1/inf',
  '0',

  '5/inf',
  '0',

  'limit(1/x^2,x,0)+1',
  'inf',

  // a symbol could itself be infinite, so these are left alone
  'inf+x',
  'inf+x',

  'x*inf',
  'inf*x',

  // comparisons and the functions built on them
  'inf>5',
  '1',

  '-inf<inf',
  '1',

  'inf>inf',
  '0',

  'inf==inf',
  '1',

  'inf==5',
  '0',

  'min(inf,3)',
  '3',

  'max(inf,3)',
  'inf',

  'max(-inf,3)',
  '3',

  'simplify(inf+x)',
  'inf+x',

  // indeterminate forms stop instead of cancelling like ordinary symbols
  'inf-inf',
  'Stop: indeterminate form: inf-inf',

  '2*inf-inf',
  'Stop: indeterminate form: inf-inf',

  'inf-inf+x',
  'Stop: indeterminate form: inf-inf',

  '0*inf',
  'Stop: indeterminate form: 0*inf or inf/inf',

  'inf/inf',
  'Stop: indeterminate form: 0*inf or inf/inf',

  'x*inf*0',
  'Stop: indeterminate form: 0*inf or inf/inf',

  'inf^0',
  'Stop: indeterminate form: inf^0',
]);
