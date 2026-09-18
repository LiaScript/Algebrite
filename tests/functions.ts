import { run_test } from '../test-harness';

// user-defined functions: f(x)=... stores the body unevaluated,
// together with the parameter list, as a "function" node
run_test([
  'f(x,y)=x^2+y',
  '',

  'f(2,3)',
  '7',

  'f(a,b)',
  'b+a^2',

  'f(y,x)',
  'x+y^2',

  // extra arguments are ignored
  'f(1,2,3)',
  '3',

  // parameters don't leak into the global scope
  'x',
  'x',

  'y',
  'y',

  // and a global of the same name doesn't leak into the body
  'x=10',
  '',

  'f(2,3)',
  '7',

  'x',
  '10',

  'f(x,1)',
  '101',

  'x=quote(x)',
  '',

  // the body is printed with its parameters
  'f',
  'function (x y) -> x^2+y',

  'binding(f)',
  'function (x y) -> x^2+y',

  // globals in the body are looked up at call time
  'g(x)=x*h',
  '',

  'h=3',
  '',

  'g(2)',
  '6',

  'h=4',
  '',

  'g(2)',
  '8',

  // printing a function whose body uses a bound global
  // (used to evaluate the body and stop with "divide by zero")
  'g',
  'function (x) -> x*h',

  'h=quote(h)',
  '',

  // no parameters
  'u()=5',
  '',

  'u()',
  '5',

  // composition, symbolic arguments
  'k(t)=t^2',
  '',

  'k(k(2))',
  '16',

  'k(a+b)',
  '2*a*b+a^2+b^2',

  'k(x+1)',
  'x^2+2*x+1',

  // recursion
  'fact(n)=test(n<=1,1,n*fact(n-1))',
  '',

  'fact(0)',
  '1',

  'fact(5)',
  '120',

  'fact(20)',
  '2432902008176640000',

  'fib(n)=test(n<2,n,fib(n-1)+fib(n-2))',
  '',

  'fib(10)',
  '55',

  // loop variables inside a function body stay local
  'q(n)=sum(j^n,j,1,3)',
  '',

  'q(2)',
  '14',

  'j',
  'j',

  // several arguments, used in a different order
  'dist(x1,y1,x2,y2)=sqrt((x2-x1)^2+(y2-y1)^2)',
  '',

  'dist(0,0,3,4)',
  '5',

  'dist(1,1,1,1)',
  '0',

  // redefinition replaces the function
  'u(x)=x+1',
  '',

  'u(1)',
  '2',
]);
