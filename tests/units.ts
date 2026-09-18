import { run_test } from '../test-harness';

// units() defaults to off, so bare unit symbols (m, cm, kg, ...) are
// ordinary free variables until units(1) is called — see quantity.ts.
run_test([
  // default state: m/cm stay plain, unrelated free symbols
  '12cm+5m',
  '12*cm+5*m',

  // quantity() works regardless of the units() toggle
  'quantity(12,cm)+quantity(5,m)',
  '128/25*m',

  'quantity(5,m)*2',
  '10*m',

  'quantity(5,m)*quantity(2,s)',
  '10*m*s',

  'quantity(3,s)^(-1)',
  '1/3*Hz',

  'quantity(1,m)/quantity(3,s)',
  '1/3*m*s^-1',

  'quantity(5,m)+quantity(3,kg)',
  'Stop: incompatible units: cannot add m and kg',

  'quantity(5,m)+3',
  'Stop: incompatible units: cannot add m and a dimensionless value',

  'convert(quantity(5,m),cm)',
  '500',

  'dimensionof(quantity(5,m)*quantity(2,s))',
  '[1,0,1,0,0,0,0]',

  // print2dascii used to fall through to the generic function-call printer
  // and show the internal (quantity magnitude dimTensor) form verbatim
  'print2dascii(quantity(12,m)*quantity(123.12,1/s))',
  '1477.44 m*s^-1',

  // the unit argument can be a compound expression, not just a bare
  // symbol — resolved regardless of the units() toggle (forced on just
  // for evaluating this one argument, see Eval_quantity)
  'quantity(3,s/kg)',
  '3*kg^-1*s',

  'quantity(3,s/kg)*4',
  '12*kg^-1*s',

  'quantity(2,m/s^2)*3',
  '6*m*s^-2',

  'quantity(1,N*m)',
  '1*J',

  // turn bare-symbol auto-detection on — this persists for the rest of
  // this test file (defs.unitsAutoDetect is a plain session-global flag,
  // like defs.expanding), which is why it's ordered last
  'units(1)',
  '1',

  '12cm+5m',
  '128/25*m',

  '5m+3kg',
  'Stop: incompatible units: cannot add m and kg',

  '(2*m)^2',
  '4*m^2',

  '(10*m)/(2*s)',
  '5*m*s^-1',

  'm/m',
  '1',

  // derived unit recognized exactly: kg*m/s^2 = N
  '(1*kg)*(1*m)/(1*s)/(1*s)',
  '1*N',

  // SI prefixes
  '1000*mm',
  '1*m',

  '2*km',
  '2000*m',

  // comparisons use the magnitude of the (same-dimension) difference
  '5m < 200cm',
  '0',

  '2m < 500cm',
  '1',

  'and(1100m <= 1.2km, 1.2km <= 1300m)',
  '1',

  '5m < 3kg',
  'Stop: incompatible units: cannot add m and kg',

  // negative magnitudes keep their sign when printed
  '1.49km - 1500m',
  '-10.0*m',

  // abs() keeps the dimension, so tolerance checks work
  'abs(1.49km - 1500m)',
  '10.0*m',

  'abs(1.49km - 1500m) <= 20m',
  '1',
]);

// conversions between prefixes, derived units, dimensionless results,
// incompatible additions, units inside functions
run_test([
  'convert(quantity(1,km),mm)',
  '1000000',

  'convert(quantity(1,mm),km)',
  '1/1000000',

  'convert(quantity(2500,g),kg)',
  '5/2',

  'convert(quantity(1,kg),g)',
  '1000',

  'convert(quantity(3,ms),s)',
  '3/1000',

  'convert(quantity(1,MHz),Hz)',
  '1000000',

  'convert(quantity(1,kJ),J)',
  '1000',

  'convert(quantity(0.5,km),m)',
  '500.0',

  'convert(quantity(1,N),kg)',
  'Stop: convert: incompatible units: cannot convert N to kg',

  'convert(3,m)',
  'Stop: convert: 1st argument must be a quantity, e.g. convert(quantity(5,m), cm)',

  // derived units get their SI name
  'quantity(1,kg)*quantity(1,m^2)/quantity(1,s^2)',
  '1*J',

  'quantity(1,J)/quantity(1,s)',
  '1*W',

  'quantity(1,V)*quantity(1,A)',
  '1*W',

  'quantity(1,N)/quantity(1,m^2)',
  '1*Pa',

  'quantity(6,m)/quantity(2,s)/quantity(3,s)',
  '1*m*s^-2',

  // powers and roots
  'quantity(2,m)^3',
  '8*m^3',

  'quantity(1,m)^(-2)',
  '1*m^-2',

  'sqrt(quantity(9,m^2))',
  '3*m',

  'sqrt(quantity(2,m^2))',
  '2^(1/2)*m',

  // dimensionless results are plain numbers
  'quantity(1,m)/quantity(1,km)',
  '1/1000',

  'quantity(3,m)-quantity(3,m)',
  '0',

  'sin(quantity(1,m)/quantity(1,m)*pi/2)',
  '1',

  // adding incompatible units stops, also with a symbol
  'quantity(1,m)+quantity(1,s)',
  'Stop: incompatible units: cannot add m and s',

  'quantity(1,m)-quantity(1,s)',
  'Stop: incompatible units: cannot add m and s',

  'quantity(1,m)+x',
  'Stop: incompatible units: cannot add m and a dimensionless value',

  'quantity(1,m)==quantity(1,kg)',
  'Stop: incompatible units: cannot add m and kg',

  // symbolic magnitudes
  'quantity(x,m)+quantity(2,m)',
  '(x+2)*m',

  'quantity(1,m)*x+quantity(2,m)*x',
  '(3*x)*m',

  // vectors of quantities
  'quantity(2,m)*[1,2]',
  '[2*m,4*m]',

  // comparisons across prefixes
  'testgt(quantity(1,km),quantity(999,m))',
  '1',

  'quantity(1,km)==quantity(1000,m)',
  '1',

  'min(quantity(1,km),quantity(999,m),quantity(2,km))',
  '999*m',

  // dimension vectors: m, kg, s, A, K, mol, cd
  'dimensionof(quantity(1,kg*m/s^2))',
  '[1,1,-2,0,0,0,0]',

  'dimensionof(quantity(1,A*s))',
  '[0,0,1,1,0,0,0]',

  'dimensionof(quantity(1,K))',
  '[0,0,0,0,1,0,0]',

  'dimensionof(quantity(1,mol))',
  '[0,0,0,0,0,1,0]',

  'dimensionof(quantity(1,cd))',
  '[0,0,0,0,0,0,1]',

  'dimensionof(quantity(2,m)^3)',
  '[3,0,0,0,0,0,0]',

  'dimensionof(3)',
  '[0,0,0,0,0,0,0]',

  'dimensionof(quantity(1,m)/quantity(1,m))',
  '[0,0,0,0,0,0,0]',

  // units inside user functions
  'f(v,t)=v*t',
  '',

  'f(quantity(3,m/s),quantity(2,s))',
  '6*m',

  'g(x)=x^2+quantity(1,m^2)',
  '',

  'g(quantity(2,m))',
  '5*m^2',

  'g(3)',
  'Stop: incompatible units: cannot add m^2 and a dimensionless value',

  // with units(1): v^2/(2 g) for v = 10 m/s, g = 9.81 m/s^2
  'units(1)',
  '1',

  'h(v)=v^2/(2*9.81m/s^2)',
  '',

  'h(10m/s)',
  '5.096840...*m',

  'convert(1km,cm)',
  '100000',

  '1mm*1km',
  '1*m^2',

  '1s*1Hz',
  '1',

  'units(0)',
  '0',

  'quantity()',
  'Stop: quantity: 2nd argument must be a unit symbol or unit expression, e.g. quantity(5, m) or quantity(3, s/kg)',

  'quantity(1,foo)',
  'Stop: quantity: 2nd argument must be a unit symbol or unit expression, e.g. quantity(5, m) or quantity(3, s/kg)',
]);
