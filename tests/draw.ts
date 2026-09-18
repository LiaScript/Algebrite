import { test } from '../test-harness';
import $ from '../index';

// draw() only hands the plot to a host-registered handler (see
// sources/draw.ts), the options are interpreted by the host. These tests
// check what the handler receives for the calls documented in test.md,
// section 11.
const Algebrite = $ as any;

function draw(code: string): any {
  let got: any;
  Algebrite.setDrawHandler((args: any) => {
    got = args;
  }, 'callback');
  try {
    Algebrite.run('clearall');
    Algebrite.run(code);
  } finally {
    Algebrite.setDrawHandler(undefined);
  }
  return got;
}

test('draw(f): default variable x, no range', (t) => {
  const d = draw('draw(x^2)');
  t.is('x^2', d.expr);
  t.is('x', d.variable);
  t.is(undefined, d.range);
  t.is(undefined, d.options);
  t.is('callback', d.callback);
  t.is(9, d.f(3));
});

test('draw(f, t) plots over another variable', (t) => {
  const d = draw('draw(t^2, t)');
  t.is('t', d.variable);
  t.is(9, d.f(3));
});

test('symbolic range limits are evaluated numerically', (t) => {
  const d = draw('a=2\ndraw(x, x, -pi, a)');
  t.is(-Math.PI, d.range[0]);
  t.is(2, d.range[1]);
});

test('several curves', (t) => {
  const d = draw('draw([sin(x), cos(x), x/3], x, -pi, pi)');
  t.is('sin(x)|cos(x)|1/3*x', d.expr.join('|'));
  t.is('0,1,0', d.f(0).join());
  t.is('0,-1,1', d.f(Math.PI).map((v: number) => Math.round(v)).join());
});

test('user-defined functions are expanded', (t) => {
  const d = draw('f(x) = x^3 - 3*x\ndraw(f(x), x, -2, 2)');
  t.is('-3*x+x^3', d.expr);
  t.is(2, d.f(2));
  t.is(-2, d.f(1));
});

test('a bound variable is still the free variable of the plot', (t) => {
  // x=5 used to show up as the constant 25 in expr
  const d = draw('x=5\ndraw(x^2, x, 0, 2)');
  t.is('x^2', d.expr);
  t.is(9, d.f(3));
  // x keeps its value
  t.is('5', Algebrite.run('x'));
});

test('points outside the real domain and poles are NaN', (t) => {
  const d = draw('draw(1/(x^2-1), x, -3, 3, "ymin=-5 ymax=5")');
  t.is(true, Number.isNaN(d.f(1)));
  t.is(-1, d.f(0));
  const r = draw('draw(sqrt(x), x, -1, 1)');
  t.is(true, Number.isNaN(r.f(-1)));
  t.is(0.5, r.f(0.25));
});

test('options are passed through, symbolic values via num()', (t) => {
  const d = draw('draw(x^2, x, -1, 2, "orange fill=0..sqrt(2) mark=-1")');
  t.is('orange fill=0..sqrt(2) mark=-1', d.options);
  t.is(Math.SQRT2, d.num('sqrt(2)'));
  t.is(-1.96, d.num('-1.96'));
  t.is(true, Number.isNaN(d.num('foo')));
  const m = draw('draw([sin(x), cos(x)], x, -pi, pi, ["red width=3", "blue dashed"])');
  t.is('red width=3|blue dashed', m.options.join('|'));
});

test('draw returns nothing and can be mixed with other expressions', (t) => {
  let calls = 0;
  Algebrite.setDrawHandler(() => calls++);
  try {
    t.is('2', Algebrite.run('draw(x,x,0,1)\n1+1'));
    t.is(1, calls);
    t.is(
      'Stop: draw: 2nd arg should be the variable to plot over',
      Algebrite.run('draw(x, 3)')
    );
  } finally {
    Algebrite.setDrawHandler(undefined);
  }
  // without a handler, draw stays unevaluated
  t.is('draw(x^2,x)', Algebrite.run('draw(x^2,x)'));
});
