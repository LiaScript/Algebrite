import { run_test } from '../test-harness';

// assume(z, complex): z is not assumed real (the other symbols still are),
// so nothing that holds only for real values is applied to it.
run_test([
  'assume(z,complex)',
  '',

  'assumptions()',
  '["z: complex"]',

  'isreal(z)',
  'isreal(z)',

  'isreal(x)',
  '1',

  'conj(z)',
  'conj(z)',

  'conj(x)',
  'x',

  'abs(z)',
  'abs(z)',

  // sqrt(z^2) = abs(z) only for real z
  'sqrt(z^2)',
  '(z^2)^(1/2)',

  'sqrt(x^2)',
  'abs(x)',

  // abs(z)^2 = z^2 only for real z
  'abs(z)^2',
  'abs(z)^2',

  'abs(x)^2',
  'x^2',

  'real(z)',
  'real(z)',

  'imag(z)',
  'imag(z)',

  'real(x)',
  'x',

  'imag(x)',
  '0',

  'rect(z)',
  'rect(z)',

  'arg(z)',
  'arg(z)',

  'z>0',
  'testgt(z,0)',

  // contradictions
  'assume(z,positive)',
  'Stop: assume: z can not be positive, it is already assumed complex',

  'assume(x,real)',
  '',

  'assume(x,complex)',
  'Stop: assume: x can not be complex, it is already assumed real',

  // forget: real by default again
  'forget(z)',
  '',

  'conj(z)',
  'z',

  'sqrt(z^2)',
  'abs(z)',
]);
