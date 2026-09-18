"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.softBuiltin = void 0;
const gamma_1 = require("./gamma");
const linalg_1 = require("./linalg");
const lists_1 = require("./lists");
const numbers_1 = require("./numbers");
const special_1 = require("./special");
const test_1 = require("./test");
const zeta_1 = require("./zeta");
// Builtins that a user definition overrides. They are not keywords: the
// names stay free for variables (gamma, beta) and for functions of the
// user's own (the laplacian in spherical coordinates of the hydrogen
// example). Eval_user_function looks a name up here when it has no binding.
let table;
function softBuiltin(name) {
    if (!table) {
        // built on first use: the modules import each other in a cycle
        table = {
            gamma: gamma_1.Eval_gamma,
            zeta: zeta_1.Eval_zeta,
            bernoulli: zeta_1.Eval_bernoulli,
            beta: special_1.Eval_beta,
            chebyshevt: special_1.evalChebyshev('chebyshevt'),
            chebyshevu: special_1.evalChebyshev('chebyshevu'),
            cfrac: special_1.Eval_cfrac,
            fibonacci: numbers_1.Eval_fibonacci,
            harmonic: numbers_1.Eval_harmonic,
            totient: numbers_1.Eval_totient,
            powermod: numbers_1.Eval_powermod,
            nextprime: numbers_1.Eval_nextprime,
            primes: numbers_1.Eval_primes,
            norm: linalg_1.Eval_norm,
            jacobian: linalg_1.Eval_jacobian,
            gradient: linalg_1.Eval_jacobian,
            hessian: linalg_1.Eval_hessian,
            laplacian: linalg_1.Eval_laplacian,
            lu: linalg_1.Eval_lu,
            qr: linalg_1.Eval_qr,
            cholesky: linalg_1.Eval_cholesky,
            length: lists_1.Eval_length,
            append: lists_1.Eval_append,
            sort: lists_1.Eval_sort,
            range: lists_1.Eval_range,
            table: lists_1.Eval_table,
            map: lists_1.Eval_map,
            // if(c1, v1, c2, v2, ..., default) is test under the name other CAS use
            if: test_1.Eval_test
        };
        Object.keys(special_1.SPECIAL).forEach((name) => (table[name] = special_1.evalSpecial(name)));
        table.lambertw = special_1.Eval_lambertw; // takes a branch as 2nd argument
    }
    return Object.prototype.hasOwnProperty.call(table, name) ? table[name] : undefined;
}
exports.softBuiltin = softBuiltin;
