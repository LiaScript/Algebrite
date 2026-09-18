import { run_test } from '../test-harness';

run_test([
  'inv(a)',
  'inv(a)',

  'inv(inv(a))',
  'a',

  'inv(inv(inv(a)))',
  'inv(a)',

  'inv(inv(inv(inv(a))))',
  'a',

  'inv(a·b·c)',
  'inner(inv(c),inner(inv(b),inv(a)))',

  'inv(I)',
  'I',

  // every inverse below was checked by multiplying back to the identity
  'inv([[1,2],[3,4]])',
  '[[-2,1],[3/2,-1/2]]',

  'inv([[5]])',
  '[[1/5]]',

  'inv([[2,0,0],[0,3,0],[0,0,4]])',
  '[[1/2,0,0],[0,1/3,0],[0,0,1/4]]',

  'inv([[1,2,3],[0,1,4],[5,6,0]])',
  '[[-24,18,5],[20,-15,-4],[-5,4,1]]',

  'inv([[1,2,3,4],[5,6,7,8],[2,6,4,8],[3,1,1,2]])',
  '[[-1/6,1/18,-1/18,1/3],[-5/6,5/18,2/9,-1/3],[1/6,5/18,-5/18,-1/3],[7/12,-13/36,1/9,1/3]]',

  'inv(hilbert(3))',
  '[[9,-36,30],[-36,192,-180],[30,-180,180]]',

  'inv(unit(3))',
  '[[1,0,0],[0,1,0],[0,0,1]]',

  // zero pivot: needs a row swap
  'inv([[0,1],[1,0]])',
  '[[0,1],[1,0]]',

  'inv([[1/2,1/3],[1/4,1/5]])',
  '[[12,-20],[-15,30]]',

  'inv([[1.5,2],[3,5]])',
  '[[3.333333...,-1.333333...],[-2.0,1.0]]',

  'inv([[i,1],[1,i]])',
  '[[-1/2*i,1/2],[1/2,-1/2*i]]',

  'inv([[a,b],[c,d]])',
  '[[d/(a*d-b*c),-b/(a*d-b*c)],[-c/(a*d-b*c),a/(a*d-b*c)]]',

  'simplify(dot(inv([[a,b],[c,d]]),[[a,b],[c,d]]))',
  '[[1,0],[0,1]]',

  'inv([[x,1],[1,x]])',
  '[[x/(-1+x^2),-1/(-1+x^2)],[-1/(-1+x^2),x/(-1+x^2)]]',

  'inv([[a,b],[0,d]])',
  '[[1/a,-b/(a*d)],[0,1/d]]',

  'A=[[1,2],[3,4]]',
  '',

  'inv(A)-adj(A)/det(A)',
  '[[0,0],[0,0]]',

  // the argument is not modified
  'A',
  '[[1,2],[3,4]]',

  'A=quote(A)',
  '',

  // not a square matrix: left unevaluated
  'inv([[1,2,3],[4,5,6]])',
  'inv([[1,2,3],[4,5,6]])',

  'inv([1,2])',
  'inv([1,2])',

  // singular matrices must stop
  'inv([[1,2],[2,4]])',
  'Stop: inverse of singular matrix',

  'inv([[1,2,3],[4,5,6],[7,8,9]])',
  'Stop: inverse of singular matrix',

  'inv(zero(2,2))',
  'Stop: inverse of singular matrix',

  'inv([[0]])',
  'Stop: inverse of singular matrix',

  // 1.5*4-2*3 = 0
  'inv([[1.5,2],[3,4]])',
  'Stop: inverse of singular matrix',

  // invg: Gauss-Jordan inverse
  'invg([[1,2],[3,4]])',
  '[[-2,1],[3/2,-1/2]]',

  'invg([[0,1],[1,0]])',
  '[[0,1],[1,0]]',

  'invg([[5]])',
  '[[1/5]]',

  'invg([[1.5,2],[3,5]])',
  '[[3.333333...,-1.333333...],[-2.0,1.0]]',

  'invg([[a,b],[0,d]])',
  '[[1/a,-b/(a*d)],[0,1/d]]',

  'simplify(dot(invg([[a,b],[c,d]]),[[a,b],[c,d]]))',
  '[[1,0],[0,1]]',

  // not simplified, but equal to inv: 1/a+b*c/(a^2*(d-b*c/a)) = d/(a*d-b*c)
  'invg([[a,b],[c,d]])',
  '[[1/a+b*c/(a^2*(d-b*c/a)),-b/(a*(d-b*c/a))],[-c/(a*(d-b*c/a)),1/(d-b*c/a)]]',

  'invg([[1,2,3],[4,5,6]])',
  'invg([[1,2,3],[4,5,6]])',

  'invg([[1,2],[2,4]])',
  'Stop: inverse of singular matrix',

  'invg(zero(2,2))',
  'Stop: inverse of singular matrix',
]);
