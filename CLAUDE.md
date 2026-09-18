# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Algebrite is a TypeScript computer algebra system (CAS), originally decaffeinated from a CoffeeScript port of the C-based EigenMath CAS. It evaluates symbolic math expressions (`Algebrite.run('x + x')` → `"2 x"`) via a hand-rolled parser/evaluator over a Lisp-style cons-cell tree, not a typical JS library.

## Build & test commands

The project builds with Bazel (via `bazelisk`), not plain `tsc`/`npm` scripts, though `npm install` must be run first to fetch deps for Bazel's `@npm//` workspace.

- `npm install` — fetch JS deps used by the Bazel build
- `bazelisk build algebrite` — build the node/npm target (produces `dist/algebrite.js` internally)
- `bazelisk build npm` — build the full npm+browser package; then open `index.html` to try it in a browser
- `bazelisk test :all` — run every test (add `--cache_test_results=no` if stale results are suspected)
- `bazelisk test :test_<name>` — run a single test, e.g. `bazelisk test :test_abs` for `tests/abs.ts`
- `bazelisk clean; rm -rf ./dist/*` — thorough clean when the Bazel cache misbehaves

If `bazelisk` is not on the PATH, use the local copy `node_modules/.bin/bazelisk`. The builds rewrite the tracked files under `dist/`; they are committed along with source changes.

Every file in `tests/` has a corresponding hand-written `nodejs_test` rule in [BUILD.bazel](BUILD.bazel) (name pattern `test_<basename>`, `entry_point = ":tests/<basename>.ts"`) — a new test file needs a matching rule added there; there's no glob. `gen_tests.bzl` exists as a helper for this but the current `BUILD.bazel` lists rules explicitly rather than calling it.

`tests-from-master/*.coffee` are legacy CoffeeScript tests being migrated into `tests/*.ts` one at a time (see recent commit history) — they run separately via `run-tests-from-master.sh` (needs a `coffee` compiler) and are not part of the Bazel test targets.

## Architecture

### Expression representation

Everything is a `U` (union of `Cons | Num | Double | Str | Tensor | Sym`, see [runtime/defs.ts](runtime/defs.ts)). Expressions are built as Lisp-style cons cells — e.g. `a*b + c` is a tree of `Cons` nodes tagged with operator symbols (`ADD`, `MULTIPLY`, ...) as the `car`. Navigate/destructure trees with the `car`/`cdr`/`cadr`/`caddr`/... accessor family (Lisp c[ad]+r naming) rather than custom tree-walking.

### Runtime vs sources

- `runtime/` — the engine: symbol table and scoping (`symbol.ts`), the `U` type hierarchy and global mutable `defs` singleton holding interpreter state (`defs.ts`), the parser/scanner entry points (`zombocom.ts`: `parse`/`exec`), the top-level `run()`/`top_level_eval()` loop (`run.ts`), and builtin registration (`init.ts`).
- `sources/` — one file per CAS operation (`abs.ts`, `integral.ts`, `derivative.ts`, `eigen.ts`, ...), each exporting both an `Eval_x` entry point (called when the parser encounters that operator) and the underlying pure function(s) other sources compose (e.g. `abs()`, `absval()`).

### Adding/wiring a builtin function

A new operation touches three places: a `sources/<name>.ts` file implementing `Eval_<name>` (+ helpers), a `runtime/defs.ts` constant + `Eval_<name>` import in `runtime/init.ts`'s `defn()` calling `std_symbol(<NAME>, Eval_<name>)` to register it in the symbol table, and an entry in the `builtin_fns` list plus export in [index.ts](index.ts) if it should be reachable from the public JS API (`Algebrite.<name>(...)`).

### Global mutable state

`defs` (a `Defs` singleton in `runtime/defs.ts`) holds interpreter-wide flags (`evaluatingAsFloats`, `expanding`, `printMode`, the pattern/dependency-tracking state, etc.) mutated throughout evaluation — most non-trivial `sources/*.ts` functions read or toggle fields on it. Helpers like `noexpand()`, `doexpand()`, `evalFloats()`, `evalPolar()` in `defs.ts` temporarily flip a flag and restore it in a `finally`; prefer these over manually saving/restoring `defs` fields.

### Assumptions about symbols

Symbols are real numbers of unknown sign by default (the `assumeRealVariables` flag), refined per symbol by `assume(x, positive|negative|nonzero|integer|real|complex)`. [sources/assume.ts](sources/assume.ts) stores them and offers three-valued queries on evaluated expressions: `facts(p)`, `isReal`, `isPositive`, `isNegative`, `isNonzero`, `isInteger` return `true`, `false` or `undefined` (unknown), deriving what they can through sums, products and powers; `allSymbolsReal(p)` replaces reading the global flag. A rule that is only valid for some values (`sqrt(x^2) = x`, `log(a*b) = log(a)+log(b)`, `arg(x) = 0`, a quadrant of `arctan`) must ask these queries and fire only on `true`; on unknown it leaves the expression as it is. Never assume a symbol is positive by syntax (e.g. "no leading minus sign"). Inside a limit, `withSign(x, ...)` temporarily assumes the sign of the bound variable. Solutions are filtered by `violatesAssumptions`, which also decides a symbol-free constant (`1-2^(1/2)`, `2*cos(8/9*pi)`) by its float value.

### Exact first, then float

`float(x)` evaluates `x` exactly and converts the result afterwards ([sources/float.ts](sources/float.ts)), like `N[]` elsewhere: gcd, roots, the integral table, sums and primality tests give wrong answers or none on float input. Code that reaches an exact algorithm through `zzfloat` rather than through `float(...)` is still in float mode, so the `Eval_x` entry points of those algorithms also go through `evalExactly(f, p1)`. `float(x, n)` gives `n` significant digits through fixed-point big integers ([sources/bigfloat.ts](sources/bigfloat.ts)): every value is computed at two precisions that must agree, and the result is a `Double` carrying its digit string, so arithmetic on it is double precision again.

### Soft builtins

Functions added after the original set (`zeta`, `lambertw`, `Si`, `norm`, `laplacian`, `map`, `range`, `if`, `gamma`, ...) are not keywords. They live in the table of [sources/soft_builtins.ts](sources/soft_builtins.ts), which `Eval_user_function` consults only when the name has no user binding. A course that defines its own `laplacian(f)` or uses `gamma` as a variable keeps working. Add a new function there, plus its name in `builtin_fns` of [index.ts](index.ts), unless it must be a keyword; build calls to such names with `usr_symbol`, since `symbol()` stops on a name that does not exist yet. One-argument special functions with a numeric value, exact rules and a derivative go into the `SPECIAL` registry of [sources/special.ts](sources/special.ts).

### Fallback methods

Several operations try a fast exact method first and a heuristic second, each in its own file: `solve` hands non-polynomial equations to [sources/solve_transcendental.ts](sources/solve_transcendental.ts) (one kernel such as `exp(x)` or `sqrt(x)` is solved for and inverted, every candidate is checked in the original equation; `solve(eq, x, n)` adds the period times the integer `n` to trig solutions, assumes `n` integer during that check and merges families half a period apart) and inequalities to [sources/solve_inequality.ts](sources/solve_inequality.ts) (sign test between the real roots); `integral` falls back to [sources/integral_heuristic.ts](sources/integral_heuristic.ts) (closed forms, completing the square, u-substitution, `u = tan(x)` then `t = tan(x/2)` for rational functions of sin/cos/tan, integration by parts); `simplify` ends with the keep-if-shorter rewrites in [sources/simplify_rewrites.ts](sources/simplify_rewrites.ts); `taylor` divides numerator and denominator series at a singular point; `limit` falls back to `exp(g*log(f))` for powers, to the squeeze argument for bounded factors and to term-wise, factor-wise and composed limits; `sum` tries the binomial-row identities and telescoping partial fractions before its per-term closed forms, and hands a term without one to Gosper's algorithm in [sources/sum_gosper.ts](sources/sum_gosper.ts) (antidifference of a hypergeometric term, or `null` quickly for `1/k`, `1/k!`). The other way round, `roots` gives a cubic with three real roots (discriminant known to be negative, casus irreducibilis) in the trigonometric form `2*sqrt(-p/3)*cos(...)` before Cardano's complex radicals, and sorts such root lists by value. A rewrite that is valid for every value (`exp(k*log(m)) = m^k`) belongs in the evaluator, one that only shortens some expressions belongs in `simplify`. `dsolve` ([sources/dsolve.ts](sources/dsolve.ts)) tries its classes in a fixed order (first order: linear, separable, Bernoulli, homogeneous, exact; any order: constant coefficients, Euler-Cauchy, equations without `y`), each returning `null` when it does not apply, and fits initial or boundary conditions to the constants afterwards; linear systems with constant coefficients go through the laplace transform.

### Piecewise functions

`piecewise(value1, condition1, ..., [default])` ([sources/piecewise.ts](sources/piecewise.ts)) is a soft builtin that receives its arguments unevaluated: conditions are decided in order (numbers, assumptions), false branches are dropped, values of branches not taken are never evaluated. Other operations recognise it with `isPiecewise`/`hasPiecewise` and work per branch: `derivative` and `simplify` map over the values (`mapPiecewiseValues`), `limit` treats it as a jump function and takes the branch just beside the point (`activeBranch`), `defint` splits the interval at the break points of conditions linear in the variable (`piecewiseDefint`), `integral` returns the continuous antiderivative (`piecewiseIntegral`) or stays unevaluated. `aspiecewise(expr)` rewrites `abs`, `sgn` and two-argument `min`/`max` as cases.

### Fourier series and transform

[sources/fourier.ts](sources/fourier.ts) holds the soft builtins `fouriercoeff`/`fourierseries` (coefficients through `defint` on `[-pi,pi]`, `[-L,L]` or `[a,b]`) and `fourier`/`invfourier` (convention `F(w) = integral f(x) exp(-i w x) dx`, no `1/sqrt(2 pi)`; table based like `laplace`, unevaluated call when no rule applies). `abs`, `sgn` and `heaviside` are handled by `pieces()`: the interval is split at the zeros of their arguments and each piece gets the sign substituted; a finite piece goes to `defint`, a decaying infinite one to `laplace` at `s = +-i w`. Branches that depend on a sign (`exp(-a*x^2)`, `exp(-a*abs(x))`, the side of a pole) fire only when the assumptions decide it.

### Comparisons, and/or/not, min/max

Undecided comparisons and `and`/`or`/`not` are simplified in the evaluator ([sources/logic_simplify.ts](sources/logic_simplify.ts), entry points in `sources/test.ts`), because every rule holds for every real value; `1` is always true and `0` never, as in `solve`. A comparison comes back with evaluated sides; `lhs-rhs` loses cancelling terms, its numeric content and common factors whose sign is known from `facts()` (a negative one turns the relation, `==` only needs nonzero), but only when the result is smaller (`count`), and never when it is already solved for a symbol. `and`/`or` flatten, drop decided and repeated parts and join the comparisons of one real variable with numeric bounds on the number line (`joinPieces` of `solve_inequality.ts`, so the normal form is the one `solve` prints); `not` turns comparisons round and applies De Morgan only when every part can be negated (`x!=1` stays `not(x==1)`). `compare()` in `test.ts` gives the sign of a difference plus the weaker facts (`x>=0` known), which also lets `min`/`max` drop arguments. Operands without an order (tensors, strings, imaginary parts, symbols assumed complex) are left alone: `comparable()`. Tables keyed by `TESTLT` etc. must be built inside functions, the constants of `runtime/defs.ts` are not there yet while the modules load.

### Poles and jump functions in limits

A function value at a pole stops like `1/0` (`tan(pi/2)`, `gamma(0)`, `digamma(-n)`, as `sec(pi/2)` and `cot(0)` always did): left symbolic, a factor `0` beside it made the product `0`. `limit` ([sources/limit.ts](sources/limit.ts)) rewrites such a function with the pole in a plain denominator (`regularizePoles`: `tan = sin/cos`, `Gamma(g) = Gamma(g+n+2)/(g*...*(g+n+1))`). `log(0)` stays symbolic, but two poles meeting in a sum, product or power make the substitution indeterminate (`evalWatchingPoles`). The numeric probe beside the point decides `sgn`, `abs`, `floor`, `ceiling`, `round` only when their argument settles there (`probeHolds`); `floor(g)` with `g -> inf` becomes `g - mod(g,1)`, a bounded oscillating part for the squeeze argument. L'Hopital (`lhopital`, one function for finite points and infinity) never goes through a jump function, tries a product `0*inf` both ways round and has a budget of derivatives that grows with the polynomial degree. Within one top-level call `limit` remembers its answers and failures, because the fallbacks ask the same questions again and again.

### Time limit

`timelimit` (seconds per top-level statement, default 20, `0` = off) is read in `top_level_eval` and enforced by `check_esc_flag()` in [runtime/run.ts](runtime/run.ts), which `Eval`, `add`, `multiply` and the long loops call. A new loop that does not go through `Eval` (big-integer or polynomial arithmetic of its own) must call `check_esc_flag()` itself, or it can freeze the browser tab of a course. Once the deadline has passed every call stops, so a `try/catch` around a fallback method cannot swallow the timeout.

### Factoring

`factor` of a polynomial with rational coefficients is complete: [sources/factor_zassenhaus.ts](sources/factor_zassenhaus.ts) (square-free parts, factorization mod p, Hensel lifting, recombination) runs first for integer coefficients; the older root and quadratic-factor searches in [sources/factorpoly.ts](sources/factorpoly.ts) remain for symbolic coefficients, and what they leave over goes through Kronecker's substitution in [sources/factor_multivariate.ts](sources/factor_multivariate.ts). `roots`, `apart`, `integral` and `invlaplace` all profit, so a change there shows up in their tests. Integers use trial division, then Pollard's rho in Brent's form ([sources/pollard.ts](sources/pollard.ts)).

### Testing pattern

Tests use a small custom harness ([test-harness.ts](test-harness.ts)), not Jest/Mocha. `run_test([...])` (from `../test-harness`) takes flat pairs of `[algebriteInputString, expectedOutputString]` and asserts `run(input) === expected` for each pair (see [tests/abs.ts](tests/abs.ts) for the idiomatic shape — including inline comments noting known-symbolic edge cases like `abs(x)^2` only holding for real `x`). `defs.test_flag` and `run(clearall)` are toggled around each `run_test` block via `setup_test()`, and the harness stops at the first failing pair of a block. The setup also runs `e=quote(e)`, so inside tests `e` is a plain symbol (use `exp(1)` for Euler's number). Every expected value must be checked mathematically (by substitution, differentiating back, or numerically), never copied from the current output: several old tests had asserted wrong results.

### Public API surface

[index.ts](index.ts) is the npm/browser entry point: it hand-picks internal helpers (cons accessors, `is*` predicates, `symbol`, etc.) onto a `$` object and additionally exposes every name in the `builtin_fns` array as `$.<fn> = exec.bind(this, fn)`, where `exec` (in `runtime/zombocom.ts`) parses JS-native args, builds a call expression, and runs it through `top_level_eval`. When exposing a new builtin publicly, add its name to `builtin_fns` here — don't hand-write a wrapper.
