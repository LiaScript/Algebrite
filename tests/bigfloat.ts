import { run_test } from '../test-harness';

// float(x, n): x to n significant digits, from fixed-point big integer
// arithmetic. The expected digits are the published values of the constants,
// rounded by hand to the requested length.
run_test([
  // pi = 3.14159265358979323846264338327950288419716939937510 58...
  'float(pi,50)',
  '3.1415926535897932384626433832795028841971693993751',

  'float(pi,20)',
  '3.1415926535897932385',

  'float(-pi,10)',
  '-3.141592654',

  // e = 2.71828182845904523536028747135 26...
  'float(exp(1),30)',
  '2.71828182845904523536028747135',

  // sqrt(2) = 1.414213562373095048801688724209698078569 67...
  'float(sqrt(2),40)',
  '1.414213562373095048801688724209698078570',

  // 2^(1/3) = 1.259921049894873164767210 607...
  'float(2^(1/3),25)',
  '1.259921049894873164767211',

  // (1+sqrt(5))/2 = 1.61803398874989484820458683436 56...
  'float((1+sqrt(5))/2,30)',
  '1.61803398874989484820458683437',

  'float(1/3,20)',
  '0.33333333333333333333',

  'float(2/3,10)',
  '0.6666666667',

  'float(1/2,5)',
  '0.50000',

  'float(0,10)',
  '0.0',

  // log(2) = 0.693147180559945309417232121458 17...
  'float(log(2),30)',
  '0.693147180559945309417232121458',

  // log(10) = 2.3025850929940456840 17...
  'float(log(10),20)',
  '2.3025850929940456840',

  // exp(10) = 22026.465794806716516 95...
  'float(exp(10),20)',
  '22026.465794806716517',

  // exp(-10) = 0.000045399929762484851535591515560...
  'float(exp(-10),20)',
  '0.000045399929762484851536',

  // sin(1) = 0.841470984807896506652502321630 29...
  'float(sin(1),30)',
  '0.841470984807896506652502321630',

  // cos(1) = 0.54030230586813971740 09...
  'float(cos(1),20)',
  '0.54030230586813971740',

  // tan(1) = 1.5574077246549022305 06...
  'float(tan(1),20)',
  '1.5574077246549022305',

  // sinh(1) = 1.1752011936438014568 82...
  'float(sinh(1),20)',
  '1.1752011936438014569',

  // 4*arctan(1), 6*arcsin(1/2) and 2*arccos(0) are pi
  'float(4*arctan(1),30)',
  '3.14159265358979323846264338328',

  'float(6*arcsin(1/2),30)',
  '3.14159265358979323846264338328',

  'float(2*arccos(0),30)',
  '3.14159265358979323846264338328',

  // sin(100) = -0.50636564110975879365 6...
  'float(sin(100),20)',
  '-0.50636564110975879366',

  // zeta(2) = pi^2/6 = 1.64493406684822643647241516664 60...
  'float(pi^2/6,30)',
  '1.64493406684822643647241516665',

  // the first argument is evaluated exactly first
  'float(sum(1/k^2,k,1,inf),30)',
  '1.64493406684822643647241516665',

  'float(defint(1/(1+x^2),x,0,1)*4,25)',
  '3.141592653589793238462643',

  'float(solve(x^2=2,x),20)',
  '[-1.4142135623730950488,1.4142135623730950488]',

  // pi^e = 22.459157718361045473 42...
  'float(pi^exp(1),20)',
  '22.459157718361045473',

  // huge and tiny values print in scientific notation:
  // 100! = 9.33262154439441...*10^157
  'float(100!,10)',
  '9.332621544*10^157',

  'float(10^(-10)/3,5)',
  '3.3333*10^(-11)',

  'float(10^20/3,25)',
  '33333333333333333333.33333',

  'printlatex(float(pi,20))',
  '3.1415926535897932385',

  'printlatex(float(100!,10))',
  '9.332621544 \\cdot 10^{157}',

  // arithmetic on the result falls back to double precision
  'float(pi,30)+1',
  '4.141593...',

  // plain float is unchanged
  'float(pi)',
  '3.141593...',

  'float(x,20)',
  'Stop: float: cannot evaluate x to 20 digits',

  'float(sqrt(-2),20)',
  'Stop: float: cannot evaluate (-1)^(1/2)*2^(1/2) to 20 digits',

  'float(log(-1),20)',
  'Stop: float: cannot evaluate (-1)^(1/2)*pi to 20 digits',

  'float(pi,0)',
  'Stop: float: 2nd argument must be a number of digits from 1 to 1000',

  'float(pi,1.5)',
  'Stop: float: 2nd argument must be a number of digits from 1 to 1000',

  'float(pi,2000)',
  'Stop: float: 2nd argument must be a number of digits from 1 to 1000',

  // float(x, n) with heavy cancellation: the precision is raised until two
  // runs agree. sin(10^22) = -0.85220084976718880177270589375303...
  'float(sin(10^22),30)',
  '-0.852200849767188801772705893753',

  // exp(100)-exp(100)+1/3: the difference of two huge numbers
  'float(exp(100)+1/3-exp(100),20)',
  '0.33333333333333333333',

  // Gamma(1/3) = 2.67893853470774763365569294097 4677... (mpmath)
  'float(Gamma(1/3),30)',
  '2.67893853470774763365569294097',

  'float(Gamma(5),10)',
  '24.00000000',

  // Gamma(-1/2) = -2*sqrt(pi) = -3.5449077018110320546
  'float(Gamma(-1/2),20)',
  '-3.5449077018110320546',

  // erf(1) = 0.842700792949714869341220635082 60...
  'float(erf(1),30)',
  '0.842700792949714869341220635083',

  // erf(1/2) = 0.52049987781304653768 27...
  'float(erf(1/2),20)',
  '0.52049987781304653768',

  // erfc(1) = 1-erf(1) = 0.15729920705028513066
  'float(erfc(1),20)',
  '0.15729920705028513066',

  // tiny values: two runs that both underflow to 0 do not count as agreement.
  // exp(-200) = 1.38389652673...*10^(-87), 1/Gamma(100) = 1.0715102881...*10^(-156)
  'float(1/10^100,10)',
  '1.000000000*10^(-100)',

  'float(exp(-200),10)',
  '1.383896527*10^(-87)',

  'float(1/Gamma(100),10)',
  '1.071510288*10^(-156)',

  // an exact zero is still zero
  'float(sin(pi),10)',
  '0.0',

  // digits that never settle are not returned
  'float(sin(10^3000),10)',
  'Stop: float: the precision needed for 10 digits is out of reach',

  // a float argument is taken as the decimal it prints as
  'float(0.1,20)',
  '0.10000000000000000000',

  'float(2.5*10^(-7),10)',
  '2.500000000*10^(-7)',
]);
