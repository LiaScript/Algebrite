import { run_test } from '../test-harness';

run_test([
  'erfc(a)',
  'erfc(a)',

  'erfc(0.0)',
  '1.0',

  'float(erfc(0))',
  '1.0',

  'erfc(0.0)',
  '1.0',

  'erfc(-0.0)',
  '1.0',

  'erfc(0)',
  '1',

  'erfc(-0)',
  '1',

  'float(erfc(1))',
  '0.157299...',

  'erfc(1.0)',
  '0.157299...',

  'erfc(-1.0)',
  '1.842701...',

  'erfc(2.0)',
  '0.004678...',

  'erfc(0.5)',
  '0.479500...',

  'd(erfc(x),x)',
  '-2*exp(-x^2)/(pi^(1/2))',

  // wrong number of arguments
  'erfc()',
  'Stop: erfc: expected 1 argument, got 0',
]);
