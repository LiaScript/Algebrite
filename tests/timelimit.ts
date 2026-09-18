import { run_test, test } from '../test-harness';
import { run } from '../runtime/run';

// timelimit: seconds one top-level statement may run, 0 switches it off.
// A computation that would freeze the browser tab stops with an error and
// leaves the interpreter usable.

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

  // big number arithmetic inside one call
  'isprime(2^100000-1)',
  'Stop: time limit of 0.3 s exceeded, see timelimit',

  // expanding a big power
  'expand((a+b+c+d+f)^200)',
  'Stop: time limit of 0.3 s exceeded, see timelimit',

  'expand((a+b)^2)',
  'a^2+2*a*b+b^2',

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
