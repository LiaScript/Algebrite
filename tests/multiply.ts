import { run_test } from '../test-harness';

run_test([
  '0*a',
  '0',

  'a*0',
  '0',

  '1*a',
  'a',

  'a*1',
  'a',

  '0.0*a',
  '0.0',

  'a*0.0',
  '0.0',

  '1.0*a',
  '1.0*a',

  'a*1.0',
  '1.0*a',

  'a*a',
  'a^2',

  'a^2*a',
  'a^3',

  'a*a^2',
  'a^3',

  'a^2*a^2',
  'a^4',

  '2^a*2^(3-a)', // symbolic exponents cancel
  '8',

  'sqrt(2)/2',
  // leave the roots nice and
  // clean in numerator, avoid these
  // forms
  //"2^(-1/2)",
  '1/2*2^(1/2)',

  '2/sqrt(2)',
  '2^(1/2)',

  '-sqrt(2)/2',
  // avoid having roots in denominator
  //"-1/(2^(1/2))",
  '-1/2*2^(1/2)',

  '2^(1/2-a)*2^a/10',
  // avoid roots in denominator
  //"1/(5*2^(1/2))",
  '1/10*2^(1/2)',

  'i/4',
  '1/4*i',

  '1/(4 i)',
  '-1/4*i',

  // ensure 1.0 is not discarded

  '1.0 pi 1/2',
  '1.570796...',

  '1.0 1/2 pi',
  '1.570796...',

  // https://github.com/davidedc/Algebrite/issues/121

  "1 - 1/2*0^2",
  "1",

  "1 - 3/2*0^2",
  "1",

  "1 - 1/2*0^1",
  "1",


  "1 - 1/2*(-0^2)",
  "1",

  "1 - 1/2*5^2",
  "-23/2",

  "1 + 1/2*0^2",
  "1",

  "1 + (-1/2*0^2)",
  "1",

  "-1/2*0^2",
  "0",

  "1 - 1/2*0*0",
  "1",

  "1 - 1/x*0^2",
  "1",

  "1 - 10/2*0^2",
  "1",

  "1 - 2*0^2",
  "1",

  "1 - 0^2",
  "1",

  "1 - 0^2*(1/2)",
  "1",

  '(-1)*(-1)',
  '1',

  '2*3/4',
  '3/2',

  '0.5*2',
  '1.0',

  '12345678901234567890*98765432109876543210',
  '1219326311370217952237463801111263526900',

  'x*x^2',
  'x^3',

  'x*x^(-1)',
  '1',

  'x/x',
  '1',

  'x/y*y',
  'x',

  '(a+b)*(a-b)',
  'a^2-b^2',

  '2*i*3*i',
  '-6',

  '(1+i)*(1-i)',
  '2',

  '(2+3*i)*(4-5*i)',
  '23+2*i',

  '[1,2]*2',
  '[2,4]',

  'x*[1,2]',
  '[x,2*x]',

  '[1,2]/2',
  '[1/2,1]',

  '[1,2]*i',
  '[i,2*i]',

  '2*inf',
  'inf',

  '-1*inf',
  '-inf',

  'inf*inf',
  'inf',

  '0*inf',
  'Stop: indeterminate form: 0*inf or inf/inf',

  'inf/inf',
  'Stop: indeterminate form: 0*inf or inf/inf',

  '1/0',
  'Stop: divide by zero',

  'x/0',
  'Stop: divide by zero',

  '0/0',
  'Stop: divide by zero',

  '1/0.0',
  'Stop: divide by zero',
]);
