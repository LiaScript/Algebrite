import { run_test } from '../test-harness';

// solve(f(x) < g(x), x): the real line is cut at the real roots of
// numerator and denominator of f-g (and of any log or radical argument),
// the inequality is checked on each piece and at each cut, and the true
// pieces are joined into and/or of comparisons. 1 means always, 0 never.
run_test([
  // comparisons print infix
  'x>1',
  'x>1',

  'x<=1',
  'x<=1',

  'x==1',
  'x==1',

  'printlatex(x<=1)',
  '{x} \\leq {1}',

  // LaTeX: \\lor, \\land and \\neg, an and inside an or in parentheses
  'printlatex(solve(x^2>1,x))',
  '{x} < {-1} \\lor {x} > {1}',

  'printlatex(solve(x^2<1,x))',
  '{x} > {-1} \\land {x} < {1}',

  'printlatex(solve((x-1)*(x-2)*(x-3)>0,x))',
  '\\left({x} > {1} \\land {x} < {2}\\right) \\lor {x} > {3}',

  'printlatex(and(a,b,c))',
  'a \\land b \\land c',

  'printlatex(and(a,or(b,c)))',
  'a \\land \\left(b \\lor c\\right)',

  'printlatex(not(a))',
  '\\neg a',

  'printlatex(not(and(a,b)))',
  '\\neg \\left(a \\land b\\right)',

  'solve(x^2>1,x)',
  'or(x<-1,x>1)',

  'solve(x^2<1,x)',
  'and(x>-1,x<1)',

  'solve(x^2<=1,x)',
  'and(x>=-1,x<=1)',

  'solve(x^2>=1,x)',
  'or(x<=-1,x>=1)',

  'solve(2*x+1>0,x)',
  'x>-1/2',

  'solve(2*x+1<=0,x)',
  'x<=-1/2',

  'solve(-x>1,x)',
  'x<-1',

  'solve(x^2+1>0,x)',
  '1',

  'solve(x^2<0,x)',
  '0',

  'solve(x^2<=0,x)',
  'x==0',

  'solve(x^2>=0,x)',
  '1',

  'solve(x^2>0,x)',
  'or(x<0,x>0)',

  'solve(x^2-2*x+1>0,x)',
  'or(x<1,x>1)',

  'solve(x^2-2*x+1>=0,x)',
  '1',

  'solve((x-1)*(x-2)*(x-3)>0,x)',
  'or(and(x>1,x<2),x>3)',

  'solve((x-1)*(x-2)*(x-3)<=0,x)',
  'or(x<=1,and(x>=2,x<=3))',

  'solve(x^3-x<0,x)',
  'or(x<-1,and(x>0,x<1))',

  // (x^2-1)*(x^2-4) <= 0
  'solve(x^4-5*x^2+4<=0,x)',
  'or(and(x>=-2,x<=-1),and(x>=1,x<=2))',

  'solve(x^2-2>0,x)',
  'or(x<-2^(1/2),x>2^(1/2))',

  // rational: poles are never included
  'solve(1/x>0,x)',
  'x>0',

  'solve(1/x<1,x)',
  'or(x<0,x>1)',

  'solve(1/x>=1,x)',
  'and(x>0,x<=1)',

  'solve((x-1)/(x+1)<0,x)',
  'and(x>-1,x<1)',

  // transcendental
  'solve(exp(x)>1,x)',
  'x>0',

  'solve(exp(x)>0,x)',
  '1',

  'solve(2^x<8,x)',
  'x<3',

  // log and sqrt are real on part of the line only
  'solve(log(x)<0,x)',
  'and(x>0,x<1)',

  'solve(sqrt(x)<2,x)',
  'and(x>=0,x<4)',

  'solve(abs(x)<2,x)',
  'and(x>-2,x<2)',

  'solve(abs(x-1)>=2,x)',
  'or(x<=-1,x>=3)',

  // constant after simplification
  'solve(x>x,x)',
  '0',

  'solve(x+1>x,x)',
  '1',

  // linear with a slope of known sign, more of these below
  'solve(x>a,x)',
  'x>a',

  'solve(x^2>a,x)',
  'Stop: solve: inequalities with parameters are not supported',

  'solve(sin(x)>0,x)',
  'Stop: solve: periodic inequalities are not supported',

  // with other functions
  'solve(d(x^3-3*x,x)>0,x)',
  'or(x<-1,x>1)',

  'solve(taylor(exp(x),x,1,0)>2,x)',
  'x>1',

  'solve(x^2>1)',
  'or(x<-1,x>1)',

  // assumptions restrict the line
  'assume(x,positive)\nsolve(x^2>1,x)',
  'x>1',

  'forget(x)\nassume(x,negative)\nsolve(x^2<4,x)',
  'and(x>-2,x<0)',

  'forget(x)\nsolve(x^2<4,x)',
  'and(x>-2,x<2)',

  // systems of inequalities: the intersection
  'solve([x>1,x<3],x)',
  'and(x>1,x<3)',

  'solve([x^2>1,x<5],x)',
  'or(x<-1,and(x>1,x<5))',

  'solve([x>3,x<1],x)',
  '0',

  'solve([x^2<4,x>=0],x)',
  'and(x>=0,x<2)',

  // linear in x with a coefficient of known sign
  'solve(x>a,x)',
  'x>a',

  'solve(2*x+a<=b,x)',
  'x<=1/2*(-a+b)',

  'assume(a,positive)',
  '',

  'solve(a*x>b,x)',
  'x>b/a',

  'forget(a)',
  '',

  'assume(a,negative)',
  '',

  'solve(a*x>b,x)',
  'x<b/a',

  'forget(a)',
  '',

  'solve(a*x>b,x)',
  'Stop: solve: inequalities with parameters are not supported',

  // needs both branches of Lambert W: x*exp(x) < -1/4 between them
  'solve(x*exp(x)+1/4<0,x)',
  'and(x>lambertw(-1/4,-1),x<lambertw(-1/4))',

  // a root next to a huge constant is still found
  'solve(3^x>7^15,x)',
  'x>log(4747561509943)/log(3)',

  // a sign that cannot be decided is no 0: it stops
  'solve(a*x>0,x)',
  'Stop: solve: inequalities with parameters are not supported',

  'solve(sin(y)*x>0,x)',
  'Stop: solve: inequalities with parameters are not supported',

  'solve(a*(x-1)*(x-2)<0,x)',
  'Stop: solve: inequalities with parameters are not supported',

  'assume(a,positive)',
  '',

  'solve(a*x>0,x)',
  'x>0',

  'forget(a)',
  '',
]);
