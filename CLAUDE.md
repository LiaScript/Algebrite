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

Symbols are real numbers of unknown sign by default (the `assumeRealVariables` flag), refined per symbol by `assume(x, positive|negative|nonzero|integer|real|complex)`. [sources/assume.ts](sources/assume.ts) stores them and offers three-valued queries on evaluated expressions: `facts(p)`, `isReal`, `isPositive`, `isNegative`, `isNonzero`, `isInteger` return `true`, `false` or `undefined` (unknown), deriving what they can through sums, products and powers; `allSymbolsReal(p)` replaces reading the global flag. A rule that is only valid for some values (`sqrt(x^2) = x`, `log(a*b) = log(a)+log(b)`, `arg(x) = 0`, a quadrant of `arctan`) must ask these queries and fire only on `true`; on unknown it leaves the expression as it is. Never assume a symbol is positive by syntax (e.g. "no leading minus sign"). Inside a limit, `withSign(x, ...)` temporarily assumes the sign of the bound variable.

### Testing pattern

Tests use a small custom harness ([test-harness.ts](test-harness.ts)), not Jest/Mocha. `run_test([...])` (from `../test-harness`) takes flat pairs of `[algebriteInputString, expectedOutputString]` and asserts `run(input) === expected` for each pair (see [tests/abs.ts](tests/abs.ts) for the idiomatic shape — including inline comments noting known-symbolic edge cases like `abs(x)^2` only holding for real `x`). `defs.test_flag` and `run(clearall)` are toggled around each `run_test` block via `setup_test()`, and the harness stops at the first failing pair of a block. The setup also runs `e=quote(e)`, so inside tests `e` is a plain symbol (use `exp(1)` for Euler's number). Every expected value must be checked mathematically (by substitution, differentiating back, or numerically), never copied from the current output: several old tests had asserted wrong results.

### Public API surface

[index.ts](index.ts) is the npm/browser entry point: it hand-picks internal helpers (cons accessors, `is*` predicates, `symbol`, etc.) onto a `$` object and additionally exposes every name in the `builtin_fns` array as `$.<fn> = exec.bind(this, fn)`, where `exec` (in `runtime/zombocom.ts`) parses JS-native args, builds a call expression, and runs it through `top_level_eval`. When exposing a new builtin publicly, add its name to `builtin_fns` here — don't hand-write a wrapper.
