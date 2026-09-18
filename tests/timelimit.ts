import { run_test, test } from '../test-harness';
import { run } from '../runtime/run';

// timelimit: seconds one top-level statement may run, 0 switches it off.
// A computation that would freeze the browser tab stops with an error and
// leaves the interpreter usable. The clock is read inside Eval, add,
// multiply and the Pollard rho loop; one single call into the big-integer
// library (isprime of a 30000 digit number) cannot be interrupted.

run_test([
  // the default
  'timelimit',
  '20',

  'timelimit=0.3',
  '',

  // smallest prime factor has 17 digits: hours with Pollard rho
  'factor(2^128+1)',
  'Stop: time limit of 0.3 s exceeded, see timelimit',

  // the interpreter works afterwards
  '1+1',
  '2',

  'factor(2^64+1)',
  '274177*67280421310721',

  // an endless loop
  'for(y=k,k,1,10^9)',
  'Stop: time limit of 0.3 s exceeded, see timelimit',

  'integral(x^2,x)',
  '1/3*x^3',

  // a long sum
  'sum(1/k^2,k,1,10^8)',
  'Stop: time limit of 0.3 s exceeded, see timelimit',

  // expanding a big power
  'expand((a+b+c+d+f)^200)',
  'Stop: time limit of 0.3 s exceeded, see timelimit',

  'expand((a+b)^2)',
  '2*a*b+a^2+b^2',

  // an integer number of seconds prints without a dot
  'timelimit=1',
  '',

  'factor(2^128+1)',
  'Stop: time limit of 1 s exceeded, see timelimit',

  // clearall restores the default
  'clearall',
  '',

  'timelimit',
  '20',

  // 0 switches the limit off, symbolic or negative values as well
  'timelimit=0',
  '',

  'factor(2^64+1)',
  '274177*67280421310721',

  'timelimit=t',
  '',

  'factor(10^10+1)',
  '101*3541*27961',

  'timelimit=-1',
  '',

  'factor(10^10+1)',
  '101*3541*27961',
]);

// the limit counts per statement, not from the first one
test('timelimit is per statement', (t) => {
  run('clearall');
  run('timelimit=0.4');
  for (let i = 0; i < 3; i++) {
    const end = Date.now() + 250;
    while (Date.now() < end) {
      // other work between two statements
    }
    t.is('2', run('1+1'));
  }
  // and it stops on time: well before the 20 s default
  const start = Date.now();
  t.is(
    'Stop: time limit of 0.4 s exceeded, see timelimit',
    run('factor(2^128+1)')
  );
  t.is(true, Date.now() - start < 3000);
  run('clearall');
});

// A fallback method that catches every error must not turn a timeout into
// its own message: solve said "no solution", float(x, n) "cannot evaluate".
// Both statements run for 2 to 3 seconds without a limit.
run_test([
  'timelimit=0.5',
  '',

  'solve(2*cos(x)^3-sqrt(2)*cos(x)^2+cos(x)^2/2-sqrt(2)*cos(x)/4-cos(x)/4+sqrt(2)/8=0,x,n)',
  'Stop: time limit of 0.5 s exceeded, see timelimit',

  'float(zeta(3),300)',
  'Stop: time limit of 0.5 s exceeded, see timelimit',

  // and the next statement is fine
  'solve(cos(x)=1/2,x,n)',
  '[-1/3*pi+2*n*pi,1/3*pi+2*n*pi]',
]);

// loops that do not pass through Eval
run_test([
  'timelimit=1',
  '',

  // Buchberger's algorithm on a hard system ran for more than 15 minutes
  'groebner([x^5+y^4+z^3-1,x^3+y^3+z^2-1,x^4+y^2*z+z^5-x*y*z],[x,y,z])',
  'Stop: time limit of 1 s exceeded, see timelimit',

  '(10^6)!',
  'Stop: time limit of 1 s exceeded, see timelimit',

  'groebner([x*y-1,x-y],[x,y])',
  '[x-y,-1+y^2]',
]);

// One big-integer power cannot be interrupted, so the size of the result is
// checked first: 2^(10^8) took 28 s, (1+1/10^6)^(10^7) 95 s.
run_test([
  '2^(10^8)',
  'Stop: power: the result would have more than 1000000 digits',

  '3^(10^7)',
  'Stop: power: the result would have more than 1000000 digits',

  '(1+1/10^6)^(10^7)',
  'Stop: power: the result would have more than 1000000 digits',

  'mod(7^(10^8),10^9+7)',
  'Stop: power: the result would have more than 1000000 digits',

  // powermod does not build the power
  'powermod(7,10^8,10^9+7)',
  '755909328',

  // 301030 digits are fine
  'mod(2^(10^6),1000)',
  '376',

  '(-2)^(10^8)',
  'Stop: power: the result would have more than 1000000 digits',

  '2^(-10^8)',
  'Stop: power: the result would have more than 1000000 digits',

  // floats have their own range
  '2.0^(10^8)',
  'inf',
]);

// factorial multiplies balanced halves: 20000! took 7 s as a running product
run_test([
  'timelimit=3',
  '',

  'mod(20000!,10^9+7)',
  '368774859',

  'mod(3000!,10^9+7)',
  '341406877',

  '10!',
  '3628800',

  '0!',
  '1',

  '1!',
  '1',

  '2!',
  '2',

  '25!',
  '15511210043330985984000000',
]);
