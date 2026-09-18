import { run_test } from '../test-harness';

// Symbolic sums beyond polynomials, geometric terms and partial fractions:
// Gosper's algorithm for hypergeometric terms, series of polynomial times
// r^k, binomial identities and Leibniz-type series. Every closed form was
// checked against the explicit sum for several n (sympy), the numeric pairs
// below repeat some of these checks.

// polynomial times geometric term
run_test([
  // (n-1)*2^(n+1)+2
  'simplify(sum(k*2^k,k,1,n)-((n-1)*2^(n+1)+2))',
  '0',

  // 2+8+24+64+160
  'eval(sum(k*2^k,k,1,n),n,5)',
  '258',

  'eval(sum(k*2^k,k,1,n),n,1)',
  '2',

  'eval(sum(k*2^k,k,1,n),n,10)',
  '18434',

  // a numeric upper limit is the explicit sum
  'sum(k*2^k,k,1,10)',
  '18434',

  'sum(k*2^k,k,1,5)',
  '258',

  // the empty sum, also in the closed form: (0-1)*2+2
  'eval(sum(k*2^k,k,1,n),n,0)',
  '0',

  // symbolic ratio: 3+18+81+324+1215
  'eval(sum(k*x^k,k,1,n),n,5,x,3)',
  '1641',

  // 1/2+2/4+3/8+4/16
  'eval(sum(k*x^k,k,1,n),n,4,x,1/2)',
  '13/8',

  // x*(1-2*x+x^2)/(x-1)^2
  'simplify(eval(sum(k*x^k,k,1,n),n,1))',
  'x',

  // x*(1-(n+1)*x^n+n*x^(n+1))/(1-x)^2
  'simplify(sum(k*x^k,k,1,n)*(1-x)^2-x*(1-(n+1)*x^n+n*x^(n+1)))',
  '0',

  // 3/2*(3^n*(n^2-n+1)-1)
  'simplify(sum(k^2*3^k,k,0,n)-3/2*(3^n*(n^2-n+1)-1))',
  '0',

  // 3+36
  'eval(sum(k^2*3^k,k,0,n),n,2)',
  '39',

  // 3+36+243+1296+6075
  'eval(sum(k^2*3^k,k,0,n),n,5)',
  '7653',

  // 2-(n+2)/2^n
  'simplify(sum(k/2^k,k,1,n)-(2-(n+2)/2^n))',
  '0',

  'eval(sum(k/2^k,k,1,n),n,3)',
  '11/8',

  // ((-1)^n*(2*n+1)-1)/4: -1+2-3+4-5
  'eval(sum((-1)^k*k,k,1,n),n,5)',
  '-3',

  'eval(sum((-1)^k*k,k,1,n),n,4)',
  '2',
]);

// limits and index names
run_test([
  // lower limit 3: (n-1)*2^(n+1)+2 - (2+8)
  'simplify(sum(k*2^k,k,3,n)-((n-1)*2^(n+1)-8))',
  '0',

  // 24+64+160+384
  'eval(sum(k*2^k,k,3,n),n,6)',
  '632',

  // symbolic lower limit: (n-1)*2^(n+1)-(m-2)*2^m
  'eval(sum(k*2^k,k,m,n),m,3,n,6)',
  '632',

  'simplify(sum(k*2^k,k,m,n)-((n-1)*2^(n+1)-(m-2)*2^m))',
  '0',

  // negative lower limit: -2/4-1/2+0+2+8
  'eval(sum(k*2^k,k,-2,n),n,2)',
  '9',

  // upper limit n+1
  'eval(sum(k*2^k,k,1,n+1),n,4)',
  '258',

  // both limits symbolic in the same symbol: 24+64+160+384
  'eval(sum(k*2^k,k,n,2*n),n,3)',
  '632',

  // the upper limit as ratio: 2+8
  'eval(sum(k*n^k,k,1,n),n,2)',
  '10',

  // a complex ratio: i+2*i^2+3*i^3
  'eval(sum(k*i^k,k,1,n),n,3)',
  '-2-2*i',

  // another index, another bound
  'eval(sum(j*2^j,j,1,m),m,5)',
  '258',

  'eval(sum(i*3^i,i,1,p),p,3)',
  '102',

  // empty and reversed numeric ranges
  'sum(k*2^k,k,5,2)',
  '0',

  'sum(k*2^k,k,1,0)',
  '0',

  'sum(k*k!,k,3,1)',
  '0',

  // k! has no value at the lower limit
  'sum(k*k!,k,-3,n)',
  'sum(k*k!,k,-3,n)',

  // non-integer numeric limits are not summed in closed form
  'sum(k*2^k,k,1/2,n)',
  'sum(k*2^k,k,1/2,n)',

  // a value bound to the index does not leak in and is kept
  'k=7',
  '',

  'eval(sum(k*2^k,k,1,n),n,5)',
  '258',

  'k',
  '7',

  'k=quote(k)',
  '',
]);

// sums of several terms
run_test([
  // the polynomial part goes to the power sums
  'simplify(sum(k*2^k+k^2,k,1,n)-((n-1)*2^(n+1)+2+n*(n+1)*(2*n+1)/6))',
  '0',

  // 2^(n+1)*(n^2-n+2)-4
  'simplify(sum((k^2+k)*2^k,k,1,n)-(2^(n+1)*(n^2-n+2)-4))',
  '0',

  // 258 + 55
  'eval(sum(k*2^k+k^2,k,1,n),n,5)',
  '313',

  'eval(sum((k^2+k)*2^k,k,1,n),n,5)',
  '1404',

  'eval(sum((k^2+k)*2^k,k,1,n),n,10)',
  '188412',

  // 258 + 3*(2+4+8+16+32) + 5
  'eval(sum(k*2^k+3*2^k+1,k,1,n),n,5)',
  '449',

  'sum(k*2^k,k,1,n)+sum(k,k,1,n)',
  '2+1/2*n+1/2*n^2+2^(1+n)*(-1+n)',

  // a parameter as factor
  'eval(sum(a*k*2^k,k,1,n),n,5)',
  '258*a',
]);

// factorials
run_test([
  'sum(k*k!,k,1,n)',
  '-1+(1+n)!',

  // 1+4+18+96+600
  'eval(sum(k*k!,k,1,n),n,5)',
  '719',

  'eval(sum(k*k!,k,1,n),n,1)',
  '1',

  'sum(k*k!,k,1,5)',
  '719',

  // the terms are not summable one by one, their sum is
  'sum((k+1)!-k!,k,1,n)',
  '-1+(1+n)!',

  // k/(k+1)! = 1/k!-1/(k+1)!
  'sum(k/(k+1)!,k,1,n)',
  '1-1/(1+n)!',

  // 1/2+2/6+3/24
  'eval(sum(k/(k+1)!,k,1,n),n,3)',
  '23/24',

  // 1/2-(n+1)/(n+2)!, and (n+1)*(n+3) = n^2+4*n+3
  'sum((k^2+k-1)/(k+2)!,k,1,n)',
  '1/2+(-3-4*n-n^2)/(3+n)!',

  'eval(sum((k^2+k-1)/(k+2)!,k,1,n),n,1)',
  '1/6',

  // 1/6+5/24+11/120+19/720+29/5040
  'eval(sum((k^2+k-1)/(k+2)!,k,1,n),n,5)',
  '419/840',
]);

// binomial coefficients in the index alone
run_test([
  // the hockey stick binomial(n+1,3); the antidifference k!/(6*(k-3)!) has
  // no value at k = 2, there z(3) - t(2) is used
  'sum(binomial(k,2),k,2,n)',
  '(1+n)!/(6*(-2+n)!)',

  // 1+3+6
  'eval(sum(binomial(k,2),k,2,n),n,4)',
  '10',

  // binomial(n+3,3)
  'sum(binomial(k+2,k),k,0,n)',
  '(3+n)!/(6*n!)',

  // 1+3+6+10
  'eval(sum(binomial(k+2,k),k,0,n),n,3)',
  '20',

  // 2/(k*(k-1)) telescopes
  'sum(1/binomial(k,2),k,2,n)',
  '2-2/n',

  // (2*n+1)*binomial(2*n,n)/4^n: 1+1/2+3/8
  'eval(sum(binomial(2*k,k)/4^k,k,0,n),n,2)',
  '15/8',

  // the same as (2*n+2)*binomial(2*n+2,n+1)/4^(n+1), and
  // (2*n+2)*(2*n+2)!/(n+1)!^2 = 4*(2*n+1)*(2*n)!/n!^2
  'sum(binomial(2*k,k)/4^k,k,0,n)',
  '2*4^(-1-n)*(1+n)*(2+2*n)!/((1+n)!^2)',

  // 1+1/2+3/8+5/16+35/128+63/256
  'eval(sum(binomial(2*k,k)/4^k,k,0,n),n,5)',
  '693/256',

  // a partial alternating row: (-1)^n*binomial(m-1,n), 1-5+10
  'eval(sum((-1)^k*binomial(m,k),k,0,n),m,5,n,2)',
  '6',

  'simplify(sum((-1)^k*binomial(m,k),k,0,n)-(-1)^n*(m-1)!/(n!*(m-1-n)!))',
  '0',
]);

// series of polynomial times r^k, abs(r) < 1
run_test([
  'sum(k/2^k,k,1,infinity)',
  '2',

  'sum(k/2^k,k,1,inf)',
  '2',

  'sum(k^2/2^k,k,1,infinity)',
  '6',

  'sum(k^3/2^k,k,1,inf)',
  '26',

  'sum(k/3^k,k,1,inf)',
  '3/4',

  // x/(1-x)^2 at x = -1/2
  'sum(k*(-1/2)^k,k,1,inf)',
  '-2/9',

  // x*(1+x)/(1-x)^3 at x = 2/3
  'sum(k^2*(2/3)^k,k,1,inf)',
  '30',

  'sum(k/2^k,k,0,inf)',
  '2',

  // 2-1/2-2/4
  'sum(k/2^k,k,3,inf)',
  '1',

  // 4/9*(-1/3)+... = -3/32 (from 1) +1/3
  'sum(k^2*(-1/3)^k,k,2,inf)',
  '23/96',

  'sum((k+1)/2^k,k,0,inf)',
  '4',

  // -2*4-1*2+0+2
  'sum(k/2^k,k,-2,inf)',
  '-8',

  'sum(k*0.5^k,k,1,inf)',
  '2.0',

  'sum(j/2^j,j,1,inf)',
  '2',

  'float(sum(k/2^k,k,1,inf))',
  '2.0',

  // k/(k+1)! telescopes to 1
  'sum(k/(k+1)!,k,1,inf)',
  '1',

  'sum(k*2^k,k,1,inf)',
  'Stop: sum: the series diverges',

  'sum(k*k!,k,1,inf)',
  'Stop: sum: the series diverges',

  // the ratio goes to 1 and limit() cannot decide about k!/(k+3)!
  'sum(k!/(k+3)!,k,1,inf)',
  'sum(k!/(k+3)!,k,1,inf)',

  // from a symbolic start: (m+1)/2^(m-1)
  'simplify(sum(k/2^k,k,m,inf)-(m+1)/2^(m-1))',
  '0',

  // alternating without a limit
  'sum((-1)^k*k,k,1,inf)',
  'sum((-1)^k*k,k,1,inf)',

  // abs(x) < 1 is not known
  'sum(k*x^k,k,1,inf)',
  'sum(k*x^k,k,1,inf)',
]);

// binomial identities over the whole row
run_test([
  'sum(binomial(n,k),k,0,n)',
  '2^n',

  'sum(binomial(m,j),j,0,m)',
  '2^m',

  'sum(3*binomial(n,k),k,0,n)',
  '3*2^n',

  // without the term k = 0
  'sum(binomial(n,k),k,1,n)',
  '-1+2^n',

  // n*2^(n-1)
  'simplify(sum(k*binomial(n,k),k,0,n)-n*2^(n-1))',
  '0',

  'eval(sum(k*binomial(n,k),k,0,n),n,5)',
  '80',

  // n*(n+1)*2^(n-2)
  'eval(sum(k^2*binomial(n,k),k,0,n),n,5)',
  '240',

  'eval(sum(k^2*binomial(n,k),k,0,n),n,1)',
  '1',

  'sum(binomial(n,k)*x^k,k,0,n)',
  '(x+1)^n',

  'sum(binomial(n,k)*2^k,k,0,n)',
  '3^n',

  'sum(binomial(n,k)/2^k,k,0,n)',
  '(3/2)^n',

  // (1-1/2)^n
  'sum(binomial(n,k)*(-1/2)^k,k,0,n)',
  '(1/2)^n',

  // n*x*(1+x)^(n-1) at n = 3, x = 2: 0+6+24+24
  'eval(sum(k*binomial(n,k)*x^k,k,0,n),n,3,x,2)',
  '54',

  'sum(binomial(n,k)^2,k,0,n)',
  '(2*n)!/(n!^2)',

  // 1+16+36+16+1
  'eval(sum(binomial(n,k)^2,k,0,n),n,4)',
  '70',

  // the row 2*n
  'eval(sum(binomial(2*n,k),k,0,2*n),n,3)',
  '64',

  // (x+y)^n, 8+36+54+27 at n = 3
  'eval(sum(binomial(n,k)*x^k*y^(n-k),k,0,n),n,3,x,3,y,2)',
  '125',

  'sum(binomial(n,k)*x^k*y^(n-k),k,0,n)',
  'y^n*(x/y+1)^n',

  'sum(binomial(n+1,k),k,0,n+1)',
  '2^(1+n)',

  // not the whole row, and 0 only for n >= 2
  'sum(binomial(n,k),k,0,n-1)',
  'sum(binomial(n,k),k,0,n-1)',

  'sum((-1)^k*k*binomial(n,k),k,0,n)',
  'sum((-1)^k*k*binomial(n,k),k,0,n)',

  'sum(binomial(n,k),k,-1,n)',
  'sum(binomial(n,k),k,-1,n)',

  // numeric rows are summed term by term
  'sum(binomial(5,k),k,0,5)',
  '32',

  'sum(binomial(4,k)^2,k,0,4)',
  '70',

  'sum((-1)^k*binomial(4,k),k,0,4)',
  '0',

  'sum((-1)^k*binomial(0,k),k,0,0)',
  '1',
]);

// the alternating row is 0 only for n >= 1 (it is 1 for n = 0)
run_test([
  'sum((-1)^k*binomial(n,k),k,0,n)',
  'sum((-1)^k*binomial(n,k),k,0,n)',

  'assume(n,integer)',
  '',

  'sum((-1)^k*binomial(n,k),k,0,n)',
  'sum((-1)^k*binomial(n,k),k,0,n)',

  'assume(n,positive)',
  '',

  'sum((-1)^k*binomial(n,k),k,0,n)',
  '0',

  'sum(5*(-1)^k*binomial(n,k),k,0,n)',
  '0',

  // the other identities are not disturbed by the assumption
  'sum(binomial(n,k),k,0,n)',
  '2^n',

  // positive alone is not enough: n could be 1/2
  'assume(p,positive)',
  '',

  'sum((-1)^k*binomial(p,k),k,0,p)',
  'sum((-1)^k*binomial(p,k),k,0,p)',
]);

// Leibniz-type series
run_test([
  'sum((-1)^k/(2*k+1),k,0,infinity)',
  '1/4*pi',

  'sum((-1)^k/(2*k+1),k,0,inf)',
  '1/4*pi',

  'sum(4*(-1)^k/(2*k+1),k,0,inf)',
  'pi',

  'sum((-1)^k/(2*k+1),k,1,inf)',
  '-1+1/4*pi',

  // 1-1/3 skipped
  'sum((-1)^k/(2*k+1),k,2,inf)',
  '-2/3+1/4*pi',

  'sum((-1)^(k+1)/(2*k-1),k,1,inf)',
  '1/4*pi',

  'sum((-1)^k/(2*k-1),k,1,inf)',
  '-1/4*pi',

  'sum((-1)^k/(2*k+3),k,0,inf)',
  '1-1/4*pi',

  'sum((-1)^k/(4*k+2),k,0,inf)',
  '1/8*pi',

  'sum((-1)^j/(2*j+1),j,0,inf)',
  '1/4*pi',

  'float(sum((-1)^k/(2*k+1),k,0,inf))',
  '0.785398...',

  'sum((-1)^k*x/(2*k+1),k,0,inf)',
  '1/4*pi*x',

  // 2*(1-1/3+1/5-...)
  'sum((-1)^k/(k+1/2),k,0,inf)',
  '1/2*pi',

  // Catalan's constant, a term below the series, a symbolic start
  'sum((-1)^k/(2*k+1)^2,k,0,inf)',
  'sum((-1)^k/((2*k+1)^2),k,0,inf)',

  'sum((-1)^k/(2*k+1),k,-1,inf)',
  'sum((-1)^k/(2*k+1),k,-1,inf)',

  'sum((-1)^k/(2*k+1),k,m,inf)',
  'sum((-1)^k/(2*k+1),k,m,inf)',

  // too many terms to subtract
  'sum((-1)^k/(2*k+1),k,100000,inf)',
  'sum((-1)^k/(2*k+1),k,100000,inf)',

  // shifted alternating harmonic series
  'sum((-1)^k/(k+1),k,0,inf)',
  'log(2)',

  'sum((-1)^k/(k+2),k,0,inf)',
  '1-log(2)',

  // as before
  'sum((-1)^k/k,k,1,inf)',
  '-log(2)',

  'sum((-1)^k/k^2,k,1,inf)',
  '-1/12*pi^2',

  // (pi/sqrt(3)+log(2))/3 is not in the table
  'sum((-1)^k/(3*k+1),k,0,inf)',
  'sum((-1)^k/(3*k+1),k,0,inf)',
]);

// no closed form: the sum stays as it is
run_test([
  'sum(1/k,k,1,n)',
  'sum(1/k,k,1,n)',

  'sum(1/k^2,k,1,n)',
  'sum(1/k^2,k,1,n)',

  'sum(1/k^4,k,1,n)',
  'sum(1/k^4,k,1,n)',

  'sum(1/k!,k,0,n)',
  'sum(1/(k!),k,0,n)',

  'sum(k!,k,1,n)',
  'sum(k!,k,1,n)',

  'sum(1/(k^2+1),k,1,n)',
  'sum(1/(k^2+1),k,1,n)',

  'sum(2^k/k,k,1,n)',
  'sum(2^k/k,k,1,n)',

  'sum(sin(k),k,1,n)',
  'sum(sin(k),k,1,n)',

  'sum(harmonic(k),k,1,n)',
  'sum(harmonic(k),k,1,n)',

  // Franel numbers
  'sum(binomial(n,k)^3,k,0,n)',
  'sum(binomial(n,k)^3,k,0,n)',

  // not the whole row
  'sum(binomial(m,k),k,0,n)',
  'sum(binomial(m,k),k,0,n)',

  'sum(k*2^k+1/k,k,1,n)',
  'sum(k*2^k+1/k,k,1,n)',

  'harmonic(n)',
  'harmonic(n)',

  'harmonic(3)',
  '11/6',
]);

// neighbouring behaviour and floats
run_test([
  'sum(k,k,1,n)',
  '1/2*n+1/2*n^2',

  'sum(2^k,k,1,n)',
  '2*(-1+2^n)',

  'sum(1/(k*(k+1)),k,1,n)',
  '1-1/(1+n)',

  'sum(1/2^k,k,0,inf)',
  '2',

  // a symbolic shift is beyond the partial fractions: 1/(m+1)-1/(n+m+1)
  'eval(sum(1/((k+m)*(k+m+1)),k,1,n),m,2,n,3)',
  '1/6',

  'simplify(sum(1/((k+m)*(k+m+1)),k,1,n)-(1/(m+1)-1/(n+m+1)))',
  '0',

  'float(eval(sum(k*2^k,k,1,n),n,5))',
  '258.0',

  'eval(float(sum(k*2^k,k,1,n)),n,5)',
  '258.0',

  'eval(sum(k*2.0^k,k,1,n),n,5)',
  '258.0',

  'sum(k*2.0^k,k,1,5)',
  '258.0',

  'float(sum(k/(k+1)!,k,1,inf))',
  '1.0',
]);
