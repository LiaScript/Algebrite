import { run_test } from '../test-harness';

run_test([
  'tan(x)',
  'tan(x)',

  'tan(-x)',
  '-tan(x)',

  'tan(b-a)',
  '-tan(a-b)',

  // check against the floating point math library

  'f(a,x)=1+tan(float(a/360*2*pi))-float(x)+tan(a/360*2*pi)-x',
  '',

  'f(0,0)', // 0
  '1.0',

  'f(180,0)', // 180
  '1.0',

  'f(360,0)', // 360
  '1.0',

  'f(-180,0)', // -180
  '1.0',

  'f(-360,0)', // -360
  '1.0',

  'f(45,1)', // 45
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(135,-1)', // 135
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(225,1)', // 225
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(315,-1)', // 315
  '1.000000...',

  'f(-45,-1)', // -45
  '1.0',

  'f(-135,1)', // -135
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-225,-1)', // -225
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-315,1)', // -315
  '1.000000...',

  'f(30,sqrt(3)/3)', // 30
  '1.0',

  'f(150,-sqrt(3)/3)', // 150
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(210,sqrt(3)/3)', // 210
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(330,-sqrt(3)/3)', // 330
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-30,-sqrt(3)/3)', // -30
  '1.000000...',

  'f(-150,sqrt(3)/3)', // -150
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-210,-sqrt(3)/3)', // -210
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-330,sqrt(3)/3)', // -330
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(60,sqrt(3))', // 60
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(120,-sqrt(3))', // 120
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(240,sqrt(3))', // 240
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(300,-sqrt(3))', // 300
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-60,-sqrt(3))', // -60
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-120,sqrt(3))', // -120
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-240,-sqrt(3))', // -240
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-300,sqrt(3))', // -300
  '1.000000...',

  'f=quote(f)',
  '',

  'tan(arctan(x))',
  'x',

  // check the default case

  'tan(1/12*pi)',
  '2-3^(1/2)',

  // exact values at special angles
  'tan(0)',
  '0',

  'tan(pi/6)',
  '1/3*3^(1/2)',

  'tan(pi/4)',
  '1',

  'tan(pi/3)',
  '3^(1/2)',

  'tan(2*pi/3)',
  '-3^(1/2)',

  'tan(3*pi/4)',
  '-1',

  'tan(5*pi/6)',
  '-1/3*3^(1/2)',

  'tan(pi)',
  '0',

  'tan(5*pi/4)',
  '1',

  // negative angles
  'tan(-pi/4)',
  '-1',

  'tan(-pi/3)',
  '-3^(1/2)',

  'tan(-x)',
  '-tan(x)',

  // floats
  'tan(0.0)',
  '0.0',

  'tan(1.0)',
  '1.557408...',

  'tan(-1.0)',
  '-1.557408...',

  'float(tan(pi/5))',
  '0.726543...',

  // compositions
  'tan(arctan(1/2))',
  '1/2',

  // calculus and identities
  'd(tan(x),x)',
  '1/(cos(x)^2)',

  'simplify(tan(x)-sin(x)/cos(x))',
  '0',
]);
