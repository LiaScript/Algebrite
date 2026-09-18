import { run_test } from '../test-harness';

run_test([
  'coeff(40*x^3+30*x^2+20*x+10,3)',
  '40',

  'coeff(40*x^3+30*x^2+20*x+10,2)',
  '30',

  'coeff(40*x^3+30*x^2+20*x+10,1)',
  '20',

  'coeff(40*x^3+30*x^2+20*x+10,0)',
  '10',

  'coeff(a*t^3+b*t^2+c*t+d,t,3)',
  'a',

  'coeff(a*t^3+b*t^2+c*t+d,t,2)',
  'b',

  'coeff(a*t^3+b*t^2+c*t+d,t,1)',
  'c',

  'coeff(a*t^3+b*t^2+c*t+d,t,0)',
  'd',

  // powers beyond the degree, negative powers
  'coeff(x^2+1,x,5)',
  '0',

  'coeff(x^2+1,x,-1)',
  '0',

  'coeff(0,x,0)',
  '0',

  'coeff(5,x,0)',
  '5',

  'coeff(5,x,1)',
  '0',

  'coeff(1/2*x^2-2/3,x,0)',
  '-2/3',

  // (x+1)^3 = x^3+3*x^2+3*x+1
  'coeff((x+1)^3,x,2)',
  '3',

  // (2*x-1)^3 = 8*x^3-12*x^2+6*x-1
  'coeff((2*x-1)^3,x,0)',
  '-1',

  'coeff((2*x-1)^3,x,2)',
  '-12',

  'coeff(factor(x^2-1),x,2)',
  '1',

  // multivariate
  'coeff(a*x^2*y+b*x*y^2,x,2)',
  'a*y',

  'coeff(a*x^2*y+b*x*y^2,y,2)',
  'b*x',

  // x omitted
  'coeff(3*x^2+1,2)',
  '3',
]);
