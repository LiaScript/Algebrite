import { run_test } from '../test-harness';

run_test([
  'defint(x^2,y,0,sqrt(1-x^2),x,-1,1)',
  '1/8*pi',

  // from the eigenmath manual

  'z=2',
  '',

  'P=[x,y,z]',
  '',

  'a=abs(cross(d(P,x),d(P,y)))',
  '',

  'defint(a,y,-sqrt(1-x^2),sqrt(1-x^2),x,-1,1)',
  'pi',

  // from the eigenmath manual

  'z=x^2+2y',
  '',

  'P=[x,y,z]',
  '',

  'a=abs(cross(d(P,x),d(P,y)))',
  '',

  'defint(a,x,0,1,y,0,1)',
  '3/2+5/8*log(5)',

  // from the eigenmath manual

  'x=u*cos(v)',
  '',

  'y=u*sin(v)',
  '',

  'z=v',
  '',

  'S=[x,y,z]',
  '',

  'a=abs(cross(d(S,u),d(S,v)))',
  '',

  'defint(a,u,0,1,v,0,3pi)',
  '3/2*pi*log(1+2^(1/2))+3*pi/(2^(1/2))',

  // clear the assignments above
  'x=quote(x)',
  '',

  'y=quote(y)',
  '',

  'z=quote(z)',
  '',

  'a=quote(a)',
  '',

  'defint(x^2,x,0,1)',
  '1/3',

  // reversed and empty intervals
  'defint(x^2,x,1,0)',
  '-1/3',

  'defint(x^2,x,a,a)',
  '0',

  // symbolic bounds
  'defint(x^2,x,a,b)',
  '-1/3*a^3+1/3*b^3',

  'defint(x,x,0,y)',
  '1/2*y^2',

  'defint(sin(x),x,0,pi)',
  '2',

  'defint(1/(1+x^2),x,0,1)',
  '1/4*pi',

  'defint(sqrt(1-x^2),x,-1,1)',
  '1/2*pi',

  'defint(tan(x),x,0,1)',
  '-log(cos(1))',

  // 1/2*log((x-1)/(x+1)) from 2 to 3
  'defint(1/(x^2-1),x,2,3)',
  '-1/2*log(2)+1/2*log(3)',

  // iterated
  'defint(x*y,x,0,1,y,0,2)',
  '1',

  'defint(1,x,0,1,y,0,x)',
  'x',

  // infinite bounds, through limits of the antiderivative
  'defint(exp(-x),x,0,inf)',
  '1',

  'defint(exp(x),x,-inf,0)',
  '1',

  'defint(1/x^2,x,1,inf)',
  '1',

  'defint(1/x^3,x,1,inf)',
  '1/2',

  'defint(x^(-3/2),x,1,inf)',
  '2',

  'defint(1/(1+x^2),x,-inf,inf)',
  'pi',

  'defint(1/(1+x^2),x,inf,0)',
  '-1/2*pi',

  'defint(1/(x^2+2*x+5),x,-inf,inf)',
  '1/2*pi',

  'defint(exp(-x^2),x,-inf,inf)',
  'pi^(1/2)',

  'defint(exp(-x^2),x,0,inf)',
  '1/2*pi^(1/2)',

  // Gamma(2) and Gamma(3)
  'defint(x*exp(-x),x,0,inf)',
  '1',

  'defint(x^2*exp(-x),x,0,inf)',
  '2',

  // divergent
  'defint(1/x,x,1,inf)',
  'inf',

  'defint(exp(x),x,0,inf)',
  'inf',

  'defint(x,x,-inf,inf)',
  'Stop: indeterminate form: inf-inf',

  'defint(sin(x),x,0,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  // singular at a bound: one-sided limits
  'defint(log(x),x,0,1)',
  '-1',

  'defint(1/sqrt(x),x,0,1)',
  '2',

  'defint(1/x^2,x,0,1)',
  'inf',

  'defint(1/x,x,0,1)',
  'inf',

  // an integrable singularity inside: principal branch of sqrt
  'defint(x^(-1/2),x,-1,1)',
  '2-2*i',

  // a pole inside: improper, the antiderivative at the bounds would give
  // -2, -i*pi, -i*pi, ... for these divergent integrals
  'defint(1/x^2,x,-1,1)',
  'Stop: defint: the integrand has a pole at x = 0 inside the interval',

  'defint(1/x,x,-1,1)',
  'Stop: defint: the integrand has a pole at x = 0 inside the interval',

  'defint(1/(x-1),x,0,2)',
  'Stop: defint: the integrand has a pole at x = 1 inside the interval',

  'defint(1/(x^2-1),x,0,2)',
  'Stop: defint: the integrand has a pole at x = 1 inside the interval',

  'defint(1/(x*(x-2)),x,-1,1)',
  'Stop: defint: the integrand has a pole at x = 0 inside the interval',

  'defint(tan(x),x,0,pi)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',

  'defint(1/cos(x),x,0,3)',
  'Stop: defint: the integrand has a pole at x = 1.5708 inside the interval',

  // a removable singularity is not a pole: this is x+1
  'defint((x^2-1)/(x-1),x,0,2)',
  '4',

  // wrong number of arguments
  'defint(x,x,0)',
  'Stop: defint: expected f,x,a,b[,y,c,d...], got 3 arguments',

  'defint(x*y,x,0,1,y)',
  'Stop: defint: expected f,x,a,b[,y,c,d...], got 5 arguments',
]);
