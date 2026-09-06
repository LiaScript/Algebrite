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
]);
