import { run_test } from '../test-harness';

run_test([
  'factorial(0)',
  '1',

  'factorial(1)',
  '1',

  'factorial(5)',
  '120',

  '5!',
  '120',

  '0!',
  '1',

  '(2+1)!',
  '6',

  'factorial(3)!',
  '720',

  'factorial(20)',
  '2432902008176640000',

  'factorial(25)',
  '15511210043330985984000000',

  'float(factorial(10))',
  '3628800.0',

  'factorial(x)',
  'x!',

  // poles at the negative integers: stays unevaluated, printed with
  // parentheses (-1! would read as -(1!) = -1)
  'factorial(-1)',
  '(-1)!',

  'factorial(-3)',
  '(-3)!',

  'factorial(-1/2)',
  '(-1/2)!',

  'factorial(1/2)',
  '(1/2)!',

  'factorial(n+1)/factorial(n)',
  '(1+n)!/n!',

  'simplify(factorial(n+1)/factorial(n))',
  '1+n',

  'simplify(factorial(n)/factorial(n-1))',
  'n',
]);
