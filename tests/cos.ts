import { run_test } from '../test-harness';

run_test([
  'cos(x)',
  'cos(x)',

  'cos(-x)',
  'cos(x)',

  'cos(b-a)',
  'cos(a-b)',

  // check against the floating point math library

  'f(a,x)=1+cos(float(a/360*2*pi))-float(x)+cos(a/360*2*pi)-x',
  '',

  'f(0,1)', // 0
  '1.0',

  'f(90,0)', // 90
  '1.0',

  'f(180,-1)', // 180
  '1.0',

  'f(270,0)', // 270
  '1.0',

  'f(360,1)', // 360
  '1.0',

  'f(-90,0)', // -90
  '1.0',

  'f(-180,-1)', // -180
  '1.0',

  'f(-270,0)', // -270
  '1.0',

  'f(-360,1)', // -360
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(45,sqrt(2)/2)', // 45
  '1.000000...',

  'f(135,-sqrt(2)/2)', // 135
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(225,-sqrt(2)/2)', // 225
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(315,sqrt(2)/2)', // 315
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-45,sqrt(2)/2)', // -45
  '1.000000...',

  'f(-135,-sqrt(2)/2)', // -135
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-225,-sqrt(2)/2)', // -225
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-315,sqrt(2)/2)', // -315
  '1.000000...',

  'f(30,sqrt(3)/2)', // 30
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(150,-sqrt(3)/2)', // 150
  '1.000000...',

  'f(210,-sqrt(3)/2)', // 210
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(330,sqrt(3)/2)', // 330
  '1.000000...',

  'f(-30,sqrt(3)/2)', // -30
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-150,-sqrt(3)/2)', // -150
  '1.000000...',

  'f(-210,-sqrt(3)/2)', // -210
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-330,sqrt(3)/2)', // -330
  '1.000000...',

  'f(60,1/2)', // 60
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(120,-1/2)', // 120
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(240,-1/2)', // 240
  '1.000000...',

  'f(300,1/2)', // 300
  '1.0',

  'f(-60,1/2)', // -60
  '1.0',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-120,-1/2)', // -120
  '1.000000...',

  // this should really be 1.0 , however
  // we have errors doing the calculations so
  // we don't get to that exact 1.0 float
  'f(-240,-1/2)', // -240
  '1.000000...',

  'f(-300,1/2)', // -300
  '1.0',

  'f=quote(f)',
  '',

  'cos(arccos(x))',
  'x',

  // bug fix for version 119

  'cos(1/12*pi)',
  'cos(1/12*pi)',

  'cos(arctan(4/3))',
  '3/5',

  'cos(-arctan(4/3))',
  '3/5',

  // phase

  'cos(x-8/2*pi)',
  'cos(x)',

  'cos(x-7/2*pi)',
  '-sin(x)',

  'cos(x-6/2*pi)',
  '-cos(x)',

  'cos(x-5/2*pi)',
  'sin(x)',

  'cos(x-4/2*pi)',
  'cos(x)',

  'cos(x-3/2*pi)',
  '-sin(x)',

  'cos(x-2/2*pi)',
  '-cos(x)',

  'cos(x-1/2*pi)',
  'sin(x)',

  'cos(x+0/2*pi)',
  'cos(x)',

  'cos(x+1/2*pi)',
  '-sin(x)',

  'cos(x+2/2*pi)',
  '-cos(x)',

  'cos(x+3/2*pi)',
  'sin(x)',

  'cos(x+4/2*pi)',
  'cos(x)',

  'cos(x+5/2*pi)',
  '-sin(x)',

  'cos(x+6/2*pi)',
  '-cos(x)',

  'cos(x+7/2*pi)',
  'sin(x)',

  'cos(x+8/2*pi)',
  'cos(x)',

  // exact values at special angles
  'cos(0)',
  '1',

  'cos(pi/6)',
  '1/2*3^(1/2)',

  'cos(pi/4)',
  '1/2*2^(1/2)',

  'cos(pi/3)',
  '1/2',

  'cos(pi/2)',
  '0',

  'cos(2*pi/3)',
  '-1/2',

  'cos(3*pi/4)',
  '-1/2*2^(1/2)',

  'cos(5*pi/6)',
  '-1/2*3^(1/2)',

  'cos(pi)',
  '-1',

  'cos(4*pi/3)',
  '-1/2',

  'cos(3*pi/2)',
  '0',

  'cos(2*pi)',
  '1',

  // negative angles and angles beyond 2 pi
  'cos(-pi/3)',
  '1/2',

  'cos(-2*pi/3)',
  '-1/2',

  'cos(7*pi/3)',
  '1/2',

  'cos(-9*pi/4)',
  '1/2*2^(1/2)',

  // symmetries
  'cos(x+pi)',
  '-cos(x)',

  'cos(pi-x)',
  '-cos(x)',

  'cos(x+pi/2)',
  '-sin(x)',

  'cos(x-pi/2)',
  'sin(x)',

  // floats
  'cos(0.0)',
  '1.0',

  'cos(1.0)',
  '0.540302...',

  'cos(-1.0)',
  '0.540302...',

  'cos(pi/5)',
  'cos(1/5*pi)',

  'float(cos(pi/5))',
  '0.809017...',

  // compositions
  'cos(arccos(x))',
  'x',

  'cos(arccos(1/2))',
  '1/2',

  'cos(arctan(x))',
  '1/((x^2+1)^(1/2))',

  // calculus
  'd(cos(x),x)',
  '-sin(x)',

  'integral(cos(x),x)',
  'sin(x)',
]);
