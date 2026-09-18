import { run_test } from '../test-harness';

// Simplification of comparisons, and/or/not and min/max. The convention of
// solve(inequality) holds: 1 is always true, 0 is never true.
//
// All of it happens in the evaluator, because every rule holds for every
// real value: terms are moved to one side and cancelled, numeric factors and
// factors of KNOWN sign are divided out, and/or are flattened, deduplicated
// and reasoned over the number line per variable, not(...) is pushed into
// comparisons, min/max are merged. A comparison is only rewritten when the
// result is smaller, so x<=1 or x+1>y print as typed (with evaluated sides).

// ---- comparisons: move together, cancel, divide by numbers --------------
run_test([
  // x+y-y = x
  'x+y>y',
  'x>0',

  '2*x<4',
  'x<2',

  // dividing by -1 flips
  '-x<3',
  'x>-3',

  '-2*x>=6',
  'x<=-3',

  '3*x<=2',
  'x<=2/3',

  'x+3<5',
  'x<2',

  'x+1>y+1',
  'x>y',

  'x-y>0',
  'x>y',

  // -x+y > 0
  '-x>-y',
  'y>x',

  // divided by the gcd 2 of the coefficients
  '2*x+4*y<6',
  'x+2*y<3',

  'z/2>1',
  'z>2',

  '0.5*x<2',
  'x<4.0',

  'x^2+x>x',
  'x^2>0',

  'sin(x)+1>1',
  'sin(x)>0',

  '2*sin(t)<=1',
  'sin(t)<=1/2',

  'x+y==y',
  'x==0',

  '2*x==4',
  'x==2',

  '-x==3',
  'x==-3',

  // the sides are evaluated
  'a=3',
  '',

  'x>a',
  'x>3',

  '2*x>2*a',
  'x>3',

  'a=quote(a)',
  '',

  // numbers still decide
  '1<2',
  '1',

  '2^(1/2)>=3/2',
  '0',

  'x+1>x',
  '1',

  'x<x',
  '0',

  // infinity against a real value
  'x<inf',
  '1',

  'x+1<=inf',
  '1',

  'x>inf',
  '0',

  '-inf<x',
  '1',

  'x<=-inf',
  '0',
]);

// ---- comparisons that stay as typed -------------------------------------
run_test([
  'x<=1',
  'x<=1',

  'x>1',
  'x>1',

  'x==1',
  'x==1',

  // solved for x already, whichever side x is on
  '1>=x',
  '1>=x',

  'x>y',
  'x>y',

  'x<a+b',
  'x<a+b',

  'x>b/a',
  'x>b/a',

  // not smaller the other way round
  'x+1>y',
  'x+1>y',

  // a may be negative or zero: not divided out
  'a*x>a',
  'a*x>a',

  'a*x>0',
  'a*x>0',

  'x*y<=x',
  'x*y<=x',

  'a*x==a',
  'a*x==a',

  // x^2 may be zero
  'x^2*y>0',
  'x^2*y>0',

  // complex numbers have no order
  'i*x>0',
  'i*x>0',

  'x+i>i',
  'x+i>i',

  'i*x<2*i',
  'i*x<2*i',

  'i>0',
  'i>0',

  'assume(z,complex)',
  '',

  'z+1>1',
  'z+1>1',

  '2*z<4',
  '2*z<4',

  'and(z>1,z<0)',
  'and(z>1,z<0)',

  'not(z>1)',
  'not(z>1)',

  'min(z,inf)',
  'min(z,inf)',

  'forget(z)',
  '',

  // tensors
  '[2*x,y]==[4,y]',
  '[2*x,y]==[4,y]',

  '[x,y]>[1,2]',
  '[x,y]>[1,2]',

  '[1,2]>0',
  '[1,2]>0',

  'and([x,y]>[1,2],[x,y]>[1,2],b)',
  'and([x,y]>[1,2],b)',
]);

// ---- comparisons decided or reduced by assumptions ----------------------
run_test([
  // real symbols
  'x^2+1>0',
  '1',

  'x^2+1<0',
  '0',

  'x^2>=0',
  '1',

  'x^2<0',
  '0',

  'x^2>0',
  'x^2>0',

  'abs(x)>=0',
  '1',

  'abs(x)<0',
  '0',

  'assume(x,positive)',
  '',

  'x>0',
  '1',

  'x>=0',
  '1',

  'x<0',
  '0',

  'x<=0',
  '0',

  'x==0',
  '0',

  'x!=0',
  '1',

  'x>-1',
  '1',

  '2*x+1>0',
  '1',

  'x>1',
  'x>1',

  // divided by x > 0
  'x*y>0',
  'y>0',

  'x*y<=x',
  'y<=1',

  // -x*y-x < 0, divided by x: -y-1 < 0
  '-x*y<x',
  'y>-1',

  'x*y==x',
  'y==1',

  'forget(x)',
  '',

  'assume(x>=0)',
  '',

  'x>=0',
  '1',

  'x<0',
  '0',

  'x>=-2',
  '1',

  // x may be 0
  'x>0',
  'x>0',

  'x<=0',
  'x<=0',

  'x*y>0',
  'x*y>0',

  'forget(x)',
  '',

  'assume(x,nonzero)',
  '',

  'x==0',
  '0',

  'x!=0',
  '1',

  'x^2>0',
  '1',

  'x>0',
  'x>0',

  // the sign of x is not known: only an equation may be divided
  'x*y>x',
  'x*y>x',

  'x*y==x',
  'y==1',

  'forget(x)',
  '',

  'assume(a,positive)',
  '',

  'a*x>a',
  'x>1',

  'a*x<0',
  'x<0',

  'a*x>=2*a',
  'x>=2',

  'a*x==a',
  'x==1',

  // a^2*x-a = a*(a*x-1)
  'a^2*x>a',
  'a*x>1',

  'forget(a)',
  '',

  'assume(a,negative)',
  '',

  // dividing by a < 0 flips
  'a*x>a',
  'x<1',

  'a*x>=2*a',
  'x<=2',

  'a*x==a',
  'x==1',

  // -a > 0
  '-a*x>0',
  'x>0',

  'forget(a)',
  '',

  'a*x>a',
  'a*x>a',
]);

// ---- and/or: constants, duplicates, nesting ------------------------------
run_test([
  'and(a,1)',
  'a',

  'and(1,a)',
  'a',

  'and(a,0)',
  '0',

  'or(a,1)',
  '1',

  'or(a,0)',
  'a',

  'or(0,a,0)',
  'a',

  'and(a,a)',
  'a',

  'or(a,a,b)',
  'or(a,b)',

  'and(a,b,1,a)',
  'and(a,b)',

  'and(a)',
  'a',

  'or(a)',
  'a',

  'and(and(a,b),c)',
  'and(a,b,c)',

  'and(a,and(b,and(c,d)))',
  'and(a,b,c,d)',

  'or(or(a,b),c)',
  'or(a,b,c)',

  'or(and(a,b),and(a,b))',
  'and(a,b)',

  'and(and(a,b),b,0)',
  '0',

  // nothing to do
  'and(a,b)',
  'and(a,b)',

  'or(a,b)',
  'or(a,b)',

  'and(a,or(b,c))',
  'and(a,or(b,c))',

  'or(a,and(b,c))',
  'or(a,and(b,c))',

  'not(a)',
  'not(a)',

  'not(and(a,b))',
  'not(and(a,b))',

  'not(and(x>1,a))',
  'not(and(x>1,a))',

  'not(i>0)',
  'not(i>0)',

  'and(1,1)',
  '1',

  'and(1,0)',
  '0',

  'or(0,0)',
  '0',

  'not(0)',
  '1',

  'not(3)',
  '0',

  'and(2>1,3>2)',
  '1',

  'or(2<1,3<2)',
  '0',

  // an assignment inside and() is an equality test
  'and(x=1,y)',
  'and(x==1,y)',

  // symbolic or nonlinear bounds are not reasoned about, duplicates go
  'and(x>a,x<b)',
  'and(x>a,x<b)',

  'and(x>a,x>a)',
  'x>a',

  'and(x>a,x>1,x>2)',
  'and(x>a,x>2)',

  'and(x^2>1,x>0)',
  'and(x^2>1,x>0)',

  'and(x^2>1,x>0,x>2)',
  'and(x^2>1,x>2)',

  'and(sin(x)>0,x>0,x<=0)',
  '0',
]);

// ---- and/or/not over one real variable: the number line ------------------
// [input, expected, [substitution, truth] x 3]. Every row was checked
// outside of Algebrite: input and expected agree on a grid of 120 points per
// variable (all bounds, points between and beyond). The three sample points
// are substituted into the unevaluated input and into the result.
const LINE: [string, string, ...[string, number][]][] = [
  ['and(x>1,x<0)', '0', ['x,1/2', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['and(x>1,x>3)', 'x>3', ['x,7/2', 1], ['x,1/2', 0], ['x,2', 0]],
  ['and(x>=1,x<=1)', 'x==1', ['x,1', 1], ['x,1/2', 0], ['x,0', 0]],
  ['or(x<1,x<3)', 'x<3', ['x,1/2', 1], ['x,3', 0], ['x,2', 1]],
  ['or(x<=1,x>=1)', '1', ['x,1/2', 1], ['x,0', 1], ['x,-1/2', 1]],
  ['or(x<0,x>0)', 'or(x<0,x>0)', ['x,-1/2', 1], ['x,0', 0], ['x,1/2', 1]],
  ['and(x>1,x<5,x<3)', 'and(x>1,x<3)', ['x,2', 1], ['x,1/2', 0], ['x,3/2', 1]],
  ['and(x>1,x<=1)', '0', ['x,1/2', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['and(x>=1,x<1)', '0', ['x,1/2', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['or(x<1,x>=1)', '1', ['x,1/2', 1], ['x,0', 1], ['x,-1/2', 1]],
  ['or(x<1,x>1)', 'or(x<1,x>1)', ['x,1/2', 1], ['x,1', 0], ['x,0', 1]],
  ['or(x<=1,x>1)', '1', ['x,1/2', 1], ['x,0', 1], ['x,-1/2', 1]],
  ['and(x<=1,x>=1,x<2)', 'x==1', ['x,1', 1], ['x,1/2', 0], ['x,3/2', 0]],
  ['and(x>1/2,x<2/3)', 'and(x>1/2,x<2/3)', ['x,7/12', 1], ['x,1/4', 0], ['x,0', 0]],
  ['and(x>1/2,x>2/3)', 'x>2/3', ['x,1', 1], ['x,1/4', 0], ['x,2/3', 1]],
  ['and(x>=-7/2,x>-4,x<=-1/3)', 'and(x>=-7/2,x<=-1/3)', ['x,-23/12', 1], ['x,-15/4', 0], ['x,-7/2', 1]],
  ['or(x<1.5,x<2.5)', 'x<2.5', ['x,3/4', 1], ['x,5/2', 0], ['x,2', 1]],
  ['and(x>0.5,x>=1/2)', 'x>0.5', ['x,1', 1], ['x,1/4', 0], ['x,0', 0]],
  ['and(x>=0.5,x<=1/2)', 'x==0.5', ['x,1/2', 1], ['x,1/4', 0], ['x,0', 0]],
  ['and(x>1,x<inf)', 'x>1', ['x,3/2', 1], ['x,1/2', 0], ['x,0', 0]],
  ['or(x>1,x<inf)', '1', ['x,1/2', 1], ['x,0', 1], ['x,-1/2', 1]],
  ['and(x>-inf,x<2)', 'x<2', ['x,1', 1], ['x,2', 0], ['x,0', 1]],
  ['and(x>inf,x<2)', '0', ['x,1', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['or(x<-inf,x>=2)', 'x>=2', ['x,2', 1], ['x,1', 0], ['x,5/2', 1]],
  ['and(t>=0,t<=10,t<5)', 'and(t>=0,t<5)', ['t,5/2', 1], ['t,15/2', 0], ['t,0', 1]],
  ['or(and(x>1,x<3),and(x>2,x<5))', 'and(x>1,x<5)', ['x,3/2', 1], ['x,1/2', 0], ['x,5/2', 1]],
  ['or(and(x>1,x<2),and(x>2,x<3))', 'or(and(x>1,x<2),and(x>2,x<3))', ['x,3/2', 1], ['x,1/2', 0], ['x,5/2', 1]],
  ['or(and(x>1,x<2),x==2)', 'and(x>1,x<=2)', ['x,3/2', 1], ['x,1/2', 0], ['x,2', 1]],
  ['or(and(x>1,x<2),and(x>=2,x<3))', 'and(x>1,x<3)', ['x,3/2', 1], ['x,1/2', 0], ['x,5/2', 1]],
  ['and(or(x<-1,x>1),x<5)', 'or(x<-1,and(x>1,x<5))', ['x,3', 1], ['x,-1/2', 0], ['x,-3/2', 1]],
  ['and(or(x<-1,x>1),x>0)', 'x>1', ['x,3/2', 1], ['x,-1/2', 0], ['x,1/2', 0]],
  ['and(or(x<-1,x>1),x>=-1,x<=1)', '0', ['x,-1/2', 0], ['x,1/2', 0], ['x,-1', 0]],
  ['and(not(x==0),x>-1)', 'or(and(x>-1,x<0),x>0)', ['x,-1/2', 1], ['x,-1', 0], ['x,1/2', 1]],
  ['and(x!=0,x>1)', 'x>1', ['x,3/2', 1], ['x,1/2', 0], ['x,0', 0]],
  ['or(x!=0,x>-1)', '1', ['x,-1/2', 1], ['x,-1', 1], ['x,-3/2', 1]],
  ['or(x==1,x==2)', 'or(x==1,x==2)', ['x,1', 1], ['x,1/2', 0], ['x,2', 1]],
  ['and(x==1,x==2)', '0', ['x,1/2', 0], ['x,3/2', 0], ['x,0', 0]],
  ['and(x==1,x>0)', 'x==1', ['x,1', 1], ['x,1/2', 0], ['x,0', 0]],
  ['and(x==1,x>1)', '0', ['x,1/2', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['or(x==1,x>1)', 'x>=1', ['x,1', 1], ['x,1/2', 0], ['x,3/2', 1]],
  ['or(x<1,x==1,x>1)', '1', ['x,1/2', 1], ['x,0', 1], ['x,-1/2', 1]],
  ['or(x<1,x==1)', 'x<=1', ['x,1/2', 1], ['x,3/2', 0], ['x,0', 1]],
  ['and(1<x,x<3)', 'and(x>1,x<3)', ['x,3/2', 1], ['x,0', 0], ['x,5/2', 1]],
  ['and(2*x>2,3>x)', 'and(x>1,x<3)', ['x,5/2', 1], ['x,1', 0], ['x,2', 1]],
  ['and(x+1>2,x<0)', '0', ['x,1/2', 0], ['x,3/2', 0], ['x,0', 0]],
  ['and(-x<3,-x>-5)', 'and(x>-3,x<5)', ['x,-5/2', 1], ['x,-5', 0], ['x,3/2', 1]],
  ['or(3-2*x>=1,x>=1)', '1', ['x,1/2', 1], ['x,3/2', 1], ['x,0', 1]],
  ['and(x>2^(1/2),x>1)', 'x>2^(1/2)', ['x,3/2', 1], ['x,1/2', 0], ['x,2', 1]],
  ['and(x>pi,x<3)', '0', ['x,3/2', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['and(x>exp(2),x<8)', 'and(x>exp(2),x<8)', ['x,15/2', 1], ['x,4', 0], ['x,0', 0]],
  ['and(x>exp(2),x<3)', '0', ['x,3/2', 0], ['x,0', 0], ['x,-1/2', 0]],
  ['or(x<-2^(1/2),x>2^(1/2))', 'or(x<-2^(1/2),x>2^(1/2))', ['x,-2', 1], ['x,-1', 0], ['x,-5/2', 1]],
  ['and(x<3*pi,x<10)', 'x<3*pi', ['x,3/2', 1], ['x,10', 0], ['x,13/2', 1]],
  ['and(x>1,x>3,y<2)', 'and(x>3,y<2)', ['x,1/2,y,3/2', 0], ['x,3/2,y,5/2', 0], ['x,5/2,y,7/2', 0]],
  ['and(y<2,x>1,x>3)', 'and(y<2,x>3)', ['x,1/2,y,3/2', 0], ['x,3/2,y,5/2', 0], ['x,5/2,y,7/2', 0]],
  ['and(x>1,y<2,x<0)', '0', ['x,1/2,y,3/2', 0], ['x,3/2,y,5/2', 0], ['x,0,y,1', 0]],
  ['or(x>1,y<2,x<=1)', '1', ['x,1/2,y,3/2', 1], ['x,3/2,y,5/2', 1], ['x,0,y,1', 1]],
  ['and(x>1,y>2,x<3,y<5)', 'and(x>1,x<3,y>2,y<5)', ['x,3/2,y,5/2', 1], ['x,1/2,y,3/2', 0], ['x,5/2,y,7/2', 1]],
  ['or(x<1,y<1,x<2,y<0)', 'or(x<2,y<1)', ['x,1/2,y,3/2', 1], ['x,2,y,3', 0], ['x,3/2,y,5/2', 1]],
  ['and(x>1,y<2)', 'and(x>1,y<2)', ['x,1/2,y,3/2', 0], ['x,3/2,y,5/2', 0], ['x,0,y,1', 0]],
  ['not(x>1)', 'x<=1', ['x,1/2', 1], ['x,3/2', 0], ['x,0', 1]],
  ['not(x>=1)', 'x<1', ['x,1/2', 1], ['x,1', 0], ['x,0', 1]],
  ['not(x<1)', 'x>=1', ['x,1', 1], ['x,1/2', 0], ['x,3/2', 1]],
  ['not(x<=1)', 'x>1', ['x,3/2', 1], ['x,1/2', 0], ['x,0', 0]],
  ['not(not(x>1))', 'x>1', ['x,3/2', 1], ['x,1/2', 0], ['x,0', 0]],
  ['not(not(x==1))', 'x==1', ['x,1', 1], ['x,1/2', 0], ['x,0', 0]],
  ['not(x==1)', 'not(x==1)', ['x,1/2', 1], ['x,1', 0], ['x,0', 1]],
  ['not(and(x>1,x<3))', 'or(x<=1,x>=3)', ['x,1/2', 1], ['x,2', 0], ['x,0', 1]],
  ['not(or(x<-1,x>1))', 'and(x>=-1,x<=1)', ['x,-1/2', 1], ['x,-3/2', 0], ['x,1/2', 1]],
  ['not(or(x<0,x>0))', 'x==0', ['x,0', 1], ['x,-1/2', 0], ['x,1/2', 0]],
  ['not(and(x>1,y<2))', 'or(x<=1,y>=2)', ['x,1/2,y,3/2', 1], ['x,3/2,y,5/2', 1], ['x,0,y,1', 1]],
  ['not(or(x<1,y>5))', 'and(x>=1,y<=5)', ['x,3,y,4', 1], ['x,1/2,y,3/2', 0], ['x,1,y,2', 1]],
  ['not(and(x>1,x==5))', 'not(x==5)', ['x,1/2', 1], ['x,5', 0], ['x,3', 1]],
  ['not(2*x+y>y)', 'x<=0', ['x,0,y,1', 1], ['x,1/2,y,3/2', 0], ['x,-1/2,y,1/2', 1]],
];

const linePairs: string[] = [];
for (const [input, expected, ...samples] of LINE) {
  linePairs.push(input, expected);
  for (const [at, truth] of samples) {
    linePairs.push(`eval(quote(${input}),${at})`, String(truth));
    if (expected !== '0' && expected !== '1') {
      linePairs.push(`eval(${expected},${at})`, String(truth));
    }
  }
}
run_test(linePairs);

// ---- and/or with assumptions -----------------------------------------------
run_test([
  'assume(x,positive)',
  '',

  // x > -1 is already true
  'and(x>-1,x<5)',
  'x<5',

  'or(x<0,x>2)',
  'x>2',

  'and(x>=0,x<1)',
  'x<1',

  'or(x>0,y>0)',
  '1',

  'and(x<0,y>0)',
  '0',

  'not(x<=0)',
  '1',

  'forget(x)',
  '',

  'and(x>-1,x<5)',
  'and(x>-1,x<5)',
]);

// ---- results of solve(...) are already in normal form ---------------------
run_test([
  'or(x<-1,x>1)',
  'or(x<-1,x>1)',

  'and(x>=-1,x<=1)',
  'and(x>=-1,x<=1)',

  'or(and(x>1,x<2),x>3)',
  'or(and(x>1,x<2),x>3)',

  'or(x<=1,and(x>=2,x<=3))',
  'or(x<=1,and(x>=2,x<=3))',

  'or(x<-1,and(x>0,x<1))',
  'or(x<-1,and(x>0,x<1))',

  'or(and(x>=-2,x<=-1),and(x>=1,x<=2))',
  'or(and(x>=-2,x<=-1),and(x>=1,x<=2))',

  'and(x>lambertw(-1/4,-1),x<lambertw(-1/4))',
  'and(x>lambertw(-1/4,-1),x<lambertw(-1/4))',

  'x>log(4747561509943)/log(3)',
  'x>log(4747561509943)/log(3)',

  'simplify(solve(x^2>1,x))',
  'or(x<-1,x>1)',

  'simplify(solve(x^2<=1,x))',
  'and(x>=-1,x<=1)',

  'simplify(solve((x-1)*(x-2)*(x-3)>0,x))',
  'or(and(x>1,x<2),x>3)',

  'simplify(solve((x-1)*(x-2)*(x-3)<=0,x))',
  'or(x<=1,and(x>=2,x<=3))',

  'simplify(solve(x^4-5*x^2+4<=0,x))',
  'or(and(x>=-2,x<=-1),and(x>=1,x<=2))',

  'simplify(solve(x^2-2>0,x))',
  'or(x<-2^(1/2),x>2^(1/2))',

  'simplify(solve(x^2>0,x))',
  'or(x<0,x>0)',

  'simplify(solve(x^2<=0,x))',
  'x==0',

  'simplify(solve(1/x>=1,x))',
  'and(x>0,x<=1)',

  'simplify(solve([x^2>1,x<5],x))',
  'or(x<-1,and(x>1,x<5))',

  'simplify(solve(a*x>b,x))',
  'Stop: solve: inequalities with parameters are not supported',

  // a solution combined with a further condition
  'and(solve(x^2<4,x),x>0)',
  'and(x>0,x<2)',

  'or(solve(x^2>1,x),x==1)',
  'or(x<-1,x>=1)',

  'not(solve(x^2>1,x))',
  'and(x>=-1,x<=1)',

  'and(solve(x^2>1,x),solve(x^2<1,x))',
  '0',

  // a stored result evaluates to itself
  's=solve((x-1)*(x-2)*(x-3)>0,x)',
  '',

  's',
  'or(and(x>1,x<2),x>3)',

  'eval(s,x,3/2)',
  '1',

  'eval(s,x,5/2)',
  '0',

  's=quote(s)',
  '',
]);

// ---- simplify looks into comparisons ---------------------------------------
run_test([
  // sin^2+cos^2 = 1
  'simplify(sin(x)^2+cos(x)^2+x>1)',
  'x>0',

  'simplify(and(x>1,sin(y)^2+cos(y)^2+x>4))',
  'x>3',

  'simplify(not(sin(y)^2+cos(y)^2+x>4))',
  'x<=3',

  'simplify(x+y>y)',
  'x>0',

  'simplify(x<=1)',
  'x<=1',

  'simplify(a*x>a)',
  'a*x>a',

  'simplify(and(a,b))',
  'and(a,b)',
]);

// ---- printing is unchanged --------------------------------------------------
run_test([
  'printlatex(and(x>1,x<5,x<3))',
  '{x} > {1} \\land {x} < {3}',

  'printlatex(not(x>1))',
  '{x} \\leq {1}',

  'printlatex(or(x<0,x>0))',
  '{x} < {0} \\lor {x} > {0}',

  'printlatex(and(or(x<-1,x>1),x<5))',
  '{x} < {-1} \\lor \\left({x} > {1} \\land {x} < {5}\\right)',

  'printlatex(not(x==1))',
  '\\neg {x} = {1}',

  'printlatex(x+y>y)',
  '{x} > {0}',

  'printlatex(and(a,b,1))',
  'a \\land b',
]);

// ---- min/max ------------------------------------------------------------------
run_test([
  // numbers are merged
  'min(3,x,5)',
  'min(3,x)',

  'max(3,x,5)',
  'max(5,x)',

  'min(x,3,5)',
  'min(x,3)',

  'max(1,x,2,y,3)',
  'max(3,x,y)',

  'min(1/2,x,0.25)',
  'min(0.25,x)',

  'max(2^(1/2),x,pi,1)',
  'max(pi,x)',

  // checked at points on both sides of the numbers
  'eval(quote(min(3,x,5)),x,4)',
  '3',

  'eval(min(3,x,5),x,4)',
  '3',

  'eval(quote(min(3,x,5)),x,1)',
  '1',

  'eval(min(3,x,5),x,1)',
  '1',

  'eval(max(3,x,5),x,7)',
  '7',

  'eval(max(3,x,5),x,4)',
  '5',

  // duplicates
  'min(x,x)',
  'x',

  'min(x,y,x)',
  'min(x,y)',

  'max(a+b,y,b+a)',
  'max(a+b,y)',

  // nested
  'min(min(a,b),c)',
  'min(a,b,c)',

  'max(max(a,b),max(c,a))',
  'max(a,b,c)',

  'min(min(3,x),min(x,2))',
  'min(2,x)',

  // min in max is no nesting
  'min(max(a,b),c)',
  'min(max(a,b),c)',

  // differences with a known sign
  'min(x,x+1)',
  'x',

  'min(x,y,x+1)',
  'min(x,y)',

  'max(x,y,x+1)',
  'max(x+1,y)',

  // the difference x^2+1 is positive
  'max(x,x^2+x+1)',
  'x^2+x+1',

  // infinity
  'min(x,inf)',
  'x',

  'max(x,-inf)',
  'x',

  'max(x,inf)',
  'inf',

  'min(x,-inf)',
  '-inf',

  'min(x,y,inf)',
  'min(x,y)',

  // one argument
  'min(x)',
  'x',

  'max(a+b)',
  'a+b',

  // undecided
  'min(x,1)',
  'min(x,1)',

  'max(x,y)',
  'max(x,y)',

  'min(-x,x)',
  'min(-x,x)',

  'min(a*x,a)',
  'min(a*x,a)',

  // not ordered
  'min(i,x)',
  'min(i,x)',

  'max(i,1)',
  'max(i,1)',

  'min([1,2],3)',
  'min([1,2],3)',

  'assume(x,positive)',
  '',

  'max(x,0)',
  'x',

  'min(x,-1)',
  '-1',

  'max(x,-2)',
  'x',

  'min(x,0)',
  '0',

  'max(0,x,-5)',
  'x',

  // min(x,y,0) = min(y,0) for x > 0
  'min(x,y,0)',
  'min(0,y)',

  'max(x,1)',
  'max(x,1)',

  'forget(x)',
  '',

  'assume(x>=0)',
  '',

  'max(x,0)',
  'x',

  'min(x,0)',
  '0',

  'min(0,x)',
  '0',

  'max(x,-1)',
  'x',

  'forget(x)',
  '',

  'max(x,0)',
  'max(x,0)',
]);
