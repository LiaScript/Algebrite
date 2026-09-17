import { test } from '../test-harness';
import $ from '../index';

// the builtins are attached to the export dynamically, so they are untyped
const Algebrite = $ as any;

// The JS API takes native arrays for vectors and matrices, like the
// scanner takes [..] literals. Elements may be numbers, strings or arrays.
test('matrix as nested JS array', (t) => {
  t.is('-2', Algebrite.det([[1, 2], [3, 4]]).toString());
  t.is('[[1,0],[0,1]]', Algebrite.rref([[1, 2], [3, 4]]).toString());
  t.is('[[-2,1],[3/2,-1/2]]', Algebrite.inv([[1, 2], [3, 4]]).toString());
});

test('vector as JS array', (t) => {
  t.is('11', Algebrite.dot([1, 2], [3, 4]).toString());
  t.is('[1,2,3]', Algebrite.simplify([1, 2, 3]).toString());
});

test('string and float elements', (t) => {
  t.is('a*d-b*c', Algebrite.det([['a', 'b'], ['c', 'd']]).toString());
  t.is('[0.5,1+x]', Algebrite.simplify([0.5, 'x+1']).toString());
});

test('string arguments still work', (t) => {
  t.is('-2', Algebrite.det('[[1,2],[3,4]]').toString());
});
