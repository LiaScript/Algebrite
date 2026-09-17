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

// draw() hands expr/variable/range and a numeric sampler f to a
// host-registered handler, along with the callback registered next to it.
test('draw calls the registered handler', (t) => {
  let got: any;
  const callback = () => {};
  Algebrite.setDrawHandler((args) => { got = args; }, callback);
  try {
    t.is('', Algebrite.run('draw(x^2, x, 0, 2)'));
    t.is('x^2', got.expr);
    t.is('x', got.variable);
    t.is('0,2', got.range.join());
    t.is(9, got.f(3));
    t.is(callback, got.callback);
    t.is('x', Algebrite.run('x'));

    Algebrite.run('draw(1/x)');
    t.is(undefined, got.range);
    t.is(true, Number.isNaN(got.f(0)));
    t.is(0.5, got.f(2));

    Algebrite.run('draw([x^2, 1/x], x, 0, 1)');
    t.is('x^2,1/x', got.expr.join());
    t.is('4,0.5', got.f(2).join());
    t.is(true, Number.isNaN(got.f(0)[1]));
    t.is(undefined, got.options);

    Algebrite.run('a=2\ndraw(x, x, 0, 1, "red fill=-pi..a")');
    t.is('red fill=-pi..a', got.options);
    t.is(-Math.PI, got.num('-pi'));
    t.is(2, got.num('a'));
    t.is(true, Number.isNaN(got.num('y')));
    Algebrite.run('clear(a)');

    Algebrite.run('draw([x, x^2], x, 0, 1, ["red", "blue dashed"])');
    t.is('red|blue dashed', got.options.join('|'));
  } finally {
    Algebrite.setDrawHandler(undefined);
  }
  t.is('draw(x^2,x)', Algebrite.run('draw(x^2,x)'));
});
