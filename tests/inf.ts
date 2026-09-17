import { run_test } from '../test-harness';

// inf is a reserved symbol like pi. It has no arithmetic of its own: it
// behaves as an ordinary symbol in expressions.
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
]);
