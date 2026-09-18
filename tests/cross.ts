import { run_test } from '../test-harness';

run_test([
  // [2*6-3*5,3*4-1*6,1*5-2*4]
  'cross([1,2,3],[4,5,6])',
  '[-3,6,-3]',

  'cross([1,0,0],[0,1,0])',
  '[0,0,1]',

  // anticommutative
  'cross([0,1,0],[1,0,0])',
  '[0,0,-1]',

  'cross([a,b,c],[a,b,c])',
  '[0,0,0]',

  'cross([u1,u2,u3],[v1,v2,v3])',
  '[u2*v3-u3*v2,-u1*v3+u3*v1,u1*v2-u2*v1]',

  // orthogonal to both factors
  'dot([u1,u2,u3],cross([u1,u2,u3],[v1,v2,v3]))',
  '0',

  // [i*i-0*1,0*0-1*i,1*1-i*0]
  'cross([1,i,0],[0,1,i])',
  '[-1,-i,1]',

  'cross([1.5,0,0],[0,2,0])',
  '[0,0,3.0]',

  // unknown vectors: left unevaluated
  'cross(a,b)',
  'cross(a,b)',

  // curl [d(v3,y)-d(v2,z),d(v1,z)-d(v3,x),d(v2,x)-d(v1,y)]
  'curl([-y,x,0])',
  '[0,0,2]',

  'curl([x*y*z,x^2,sin(z)])',
  '[0,x*y,2*x-x*z]',

  // gradient fields are curl free
  'curl([x,y,z])',
  '[0,0,0]',

  'curl(d(x^2*y*z,[x,y,z]))',
  '[0,0,0]',

  'curl([1,2,3])',
  '[0,0,0]',

  'curl(a)',
  'curl(a)',

  // div d(v1,x)+d(v2,y)+d(v3,z)
  'div([x,y,z])',
  '3',

  'div([x^2*y,y*z,z*x])',
  'x+z+2*x*y',

  'div([-y,x,0])',
  '0',

  // div of a curl vanishes
  'div(curl([x*y*z,x^2*y,y*z^3]))',
  '0',

  'div(curl([f(x,y,z),g(x,y,z),h(x,y,z)]))',
  '0',

  'div(a)',
  'div(a)',

  // anything but 3-vectors must stop, not use the first three components
  'cross([1,2],[3,4])',
  'Stop: cross: 3-vector expected',

  'cross([1,2,3,4],[5,6,7,8])',
  'Stop: cross: 3-vector expected',

  'cross([1,2,3],[[1,2,3]])',
  'Stop: cross: 3-vector expected',

  'curl([x,y])',
  'Stop: curl: 3-vector expected',

  'curl([x,y,z,w])',
  'Stop: curl: 3-vector expected',

  'div([x,y])',
  'Stop: div: 3-vector expected',

  'div([x,y,z,w])',
  'Stop: div: 3-vector expected',
]);
