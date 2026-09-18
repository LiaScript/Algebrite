import { run_test } from '../test-harness';

run_test([
  // f^g with x in base and exponent: exp(limit(g*log(f)))
  'limit((1+1/n)^n,n,inf)',
  'e',

  'limit((1+2/n)^n,n,inf)',
  'exp(2)',

  'limit((1-1/n)^n,n,inf)',
  'exp(-1)',

  'limit((1+a/n)^n,n,inf)',
  'exp(a)',

  'limit((1+x)^(1/x),x,0)',
  'e',

  // (1+3*x)^(1/x): log(1+3*x)/x -> 3
  'limit((1+3*x)^(1/x),x,0)',
  'exp(3)',

  'limit(x^(1/x),x,inf)',
  '1',

  'limit(x^x,x,0)',
  '1',

  'float(limit((1+1/n)^n,n,inf))',
  '2.718282...',

  'limit((1+1/n)^n,n,infinity)',
  'e',

  // roots at infinity: sqrt(x^2+x)-x = x/(sqrt(x^2+x)+x) -> 1/2
  'limit(sqrt(x^2+x)-x,x,inf)',
  '1/2',

  'limit(x/(sqrt(x^2+x)+x),x,inf)',
  '1/2',

  // x/(sqrt(4*x^2+x)+2*x) -> 1/4
  'limit(sqrt(4*x^2+x)-2*x,x,inf)',
  '1/4',

  // 1/(sqrt(x+1)+sqrt(x)) -> 0
  'limit(sqrt(x+1)-sqrt(x),x,inf)',
  '0',

  'limit(sqrt(x^2+x)/x,x,inf)',
  '1',

  // sqrt(x^2) = -x for x < 0
  'limit(sqrt(x^2+1)/x,x,-inf)',
  '-1',

  'limit(sqrt(x^2+1)/x,x,inf)',
  '1',

  // bounded times vanishing
  'limit(sin(x)/x,x,inf)',
  '0',

  'limit(cos(x)/x^2,x,-inf)',
  '0',

  'limit(sin(x)^2/x,x,inf)',
  '0',

  'limit(x*sin(1/x),x,0)',
  '0',

  'limit(x^2*cos(1/x),x,0)',
  '0',

  // 1 + sin(x)/x
  'limit((x+sin(x))/x,x,inf)',
  '1',

  // 2 - cos(x)/x
  'limit((2*x-cos(x))/x,x,inf)',
  '2',

  // no limit
  'limit(sin(x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  'limit(x*sin(x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  // as before
  'limit(sin(x)/x,x,0)',
  '1',

  'limit(x*sin(1/x),x,inf)',
  '1',

  'limit(1/x,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit((3*x^2+1)/(2*x^2-x),x,inf)',
  '3/2',

  'limit(sum(1/2^k,k,0,n),n,inf)',
  '2',
]);
