"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factorpoly = void 0;
const lcm_1 = require("./lcm");
const big_integer_1 = __importDefault(require("big-integer"));
const defs_1 = require("../runtime/defs");
const factor_zassenhaus_1 = require("./factor_zassenhaus");
const factor_multivariate_1 = require("./factor_multivariate");
const find_1 = require("../runtime/find");
const run_1 = require("../runtime/run");
const misc_1 = require("../sources/misc");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const coeff_1 = require("./coeff");
const condense_1 = require("./condense");
const conj_1 = require("./conj");
const denominator_1 = require("./denominator");
const divisors_1 = require("./divisors");
const is_1 = require("./is");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const print_1 = require("./print");
const quotient_1 = require("./quotient");
const rect_1 = require("./rect");
// Factor a polynomial
//define POLY p1
//define X p2
//define Z p3
//define A p4
//define B p5
//define Q p6
//define RESULT p7
//define FACTOR p8
function factorpoly(POLY, X) {
    if (!find_1.Find(POLY, X)) {
        return POLY;
    }
    if (!is_1.ispolyexpandedform(POLY, X)) {
        return POLY;
    }
    if (!defs_1.issymbol(X)) {
        return POLY;
    }
    // i * (real polynomial): the rational root search needs real
    // coefficients, so factor the real polynomial and put i back in front
    const cs = coeff_1.coeff(POLY, X);
    if (cs.every((c) => is_1.isZeroAtomOrTensor(c) || is_1.isimaginarynumber(c))) {
        const minusI = multiply_1.negate(defs_1.Constants.imaginaryunit);
        const realPoly = cs.reduce((acc, c, k) => add_1.add(acc, multiply_1.multiply(multiply_1.multiply(c, minusI), power_1.power(X, bignum_1.integer(k)))), defs_1.Constants.zero);
        return multiply_1.multiply_noexpand(defs_1.Constants.imaginaryunit, yyfactorpoly(realPoly, X));
    }
    return yyfactorpoly(POLY, X);
}
exports.factorpoly = factorpoly;
//-----------------------------------------------------------------------------
//
//  Input:    p1    true polynomial
//            p2    free variable
//
//  Output:    factored polynomial
//
//-----------------------------------------------------------------------------
function yyfactorpoly(p1, p2) {
    let p4, p5, p8;
    let prev_expanding;
    if (is_1.isfloating(p1)) {
        run_1.stop('floating point numbers in polynomial');
    }
    // 2*x*y+2*x*z: the number comes out first, the root search would put it
    // into a factor 2*y+2*z
    const content = numericContent(p1);
    if (content) {
        p1 = multiply_1.divide(p1, content);
    }
    const polycoeff = coeff_1.coeff(p1, p2);
    let factpoly_expo = polycoeff.length - 1;
    let p7 = rationalize_coefficients(polycoeff);
    if (content) {
        p7 = multiply_1.multiply(p7, content);
    }
    // integer coefficients: the complete algorithm, and much faster than the
    // searches below, which stay for symbolic coefficients
    const complete = factorRemainder(p1, p2, polycoeff);
    if (complete) {
        return complete.reduce(multiply_1.multiply_noexpand, p7);
    }
    // for univariate polynomials we could do factpoly_expo > 1
    let whichRootsAreWeFinding = 'real';
    let remainingPoly = null;
    let quadratic;
    // the searches need the divisors of the first and the last coefficient:
    // beyond 2^31 they stop with "number too big to factor"
    const tooBig = (c) => is_1.isinteger(c) && !isFinite(bignum_1.nativeInt(c));
    while (factpoly_expo > 0) {
        var foundComplexRoot, foundRealRoot;
        if (!is_1.isZeroAtomOrTensor(polycoeff[0]) &&
            (tooBig(polycoeff[0]) || tooBig(polycoeff[factpoly_expo]))) {
            break;
        }
        if (is_1.isZeroAtomOrTensor(polycoeff[0])) {
            p4 = defs_1.Constants.one;
            p5 = defs_1.Constants.zero;
        }
        else {
            //console.log("trying to find a " + whichRootsAreWeFinding + " root")
            if (whichRootsAreWeFinding === 'real') {
                [foundRealRoot, p4, p5] = get_factor_from_real_root(polycoeff, factpoly_expo, p2, p4, p5);
            }
            else if (whichRootsAreWeFinding === 'complex') {
                [foundComplexRoot, p4] = get_factor_from_complex_root(remainingPoly, polycoeff, factpoly_expo);
                quadratic = foundComplexRoot
                    ? multiply_1.multiply(add_1.subtract(p4, p2), add_1.subtract(conj_1.conjugate(p4), p2))
                    : get_quadratic_factor(polycoeff, factpoly_expo, p2);
                foundComplexRoot = quadratic !== undefined;
            }
        }
        if (whichRootsAreWeFinding === 'real') {
            if (foundRealRoot === false) {
                whichRootsAreWeFinding = 'complex';
                continue;
            }
            else {
                p8 = add_1.add(multiply_1.multiply(p4, p2), p5); // A, x, B
                if (defs_1.DEBUG) {
                    console.log(`success\nFACTOR=${p8}`);
                }
                // factor out negative sign (not req'd because p4 > 1)
                //if 0
                /*
                if (isnegativeterm(p4))
                  push(p8)
                  negate()
                  p8 = pop()
                  push(p7)
                  negate_noexpand()
                  p7 = pop()
                */
                //endif
                // p7 is the part of the polynomial that was factored so far,
                // add the newly found factor to it. Note that we are not actually
                // multiplying the polynomials fully, we are just leaving them
                // expressed as (P1)*(P2), we are not expanding the product.
                p7 = multiply_1.multiply_noexpand(p7, p8);
                // ok now on stack we have the coefficients of the
                // remaining part of the polynomial still to factor.
                // Divide it by the newly-found factor so that
                // the stack then contains the coefficients of the
                // polynomial part still left to factor.
                yydivpoly(p4, p5, polycoeff, factpoly_expo);
                while (factpoly_expo && is_1.isZeroAtomOrTensor(polycoeff[factpoly_expo])) {
                    factpoly_expo--;
                }
                let temp = defs_1.Constants.zero;
                for (let i = 0; i <= factpoly_expo; i++) {
                    // p2: the free variable
                    temp = add_1.add(temp, multiply_1.multiply(polycoeff[i], power_1.power(p2, bignum_1.integer(i))));
                }
                remainingPoly = temp;
            }
            //console.log("real branch remainingPoly: " + remainingPoly)
        }
        else if (whichRootsAreWeFinding === 'complex') {
            if (foundComplexRoot === false) {
                break;
            }
            else {
                p8 = quadratic;
                //if (factpoly_expo > 0 && isnegativeterm(polycoeff[factpoly_expo]))
                //  negate()
                //  negate_noexpand()
                if (defs_1.DEBUG) {
                    console.log(`success\nFACTOR=${p8}`);
                }
                // factor out negative sign (not req'd because p4 > 1)
                //if 0
                /*
                if (isnegativeterm(p4))
                  push(p8)
                  negate()
                  p8 = pop()
                  push(p7)
                  negate_noexpand()
                  p7 = pop()
                */
                //endif
                // p7 is the part of the polynomial that was factored so far,
                // add the newly found factor to it. Note that we are not actually
                // multiplying the polynomials fully, we are just leaving them
                // expressed as (P1)*(P2), we are not expanding the product.
                const previousFactorisation = p7;
                //console.log("previousFactorisation: " + previousFactorisation)
                p7 = multiply_1.multiply_noexpand(p7, p8);
                //console.log("new prospective factorisation: " + p7)
                // build the polynomial of the unfactored part
                //console.log("build the polynomial of the unfactored part factpoly_expo: " + factpoly_expo)
                if (remainingPoly == null) {
                    let temp = defs_1.Constants.zero;
                    for (let i = 0; i <= factpoly_expo; i++) {
                        // p2: the free variable
                        temp = add_1.add(temp, multiply_1.multiply(polycoeff[i], power_1.power(p2, bignum_1.integer(i))));
                    }
                    remainingPoly = temp;
                }
                //console.log("original polynomial (dividend): " + remainingPoly)
                //push(dividend)
                //degree()
                //startingDegree = pop()
                //console.log("dividing " + stack[tos-1].toString() + " by " + p8)
                const X = p2;
                const divisor = p8;
                const dividend = remainingPoly;
                remainingPoly = quotient_1.divpoly(dividend, divisor, X);
                const checkingTheDivision = multiply_1.multiply(remainingPoly, p8);
                if (!misc_1.equal(checkingTheDivision, dividend)) {
                    //push(dividend)
                    //gcd_sum()
                    //console.log("gcd top of stack: " + stack[tos-1].toString())
                    if (defs_1.DEBUG) {
                        console.log("we found a polynomial based on complex root and its conj but it doesn't divide the poly, quitting");
                        console.log(`so just returning previousFactorisation times dividend: ${previousFactorisation} * ${dividend}`);
                    }
                    return multiply_1.multiply_noexpand(previousFactorisation, defs_1.noexpand(condense_1.yycondense, dividend));
                }
                //console.log("result: (still to be factored) " + remainingPoly)
                //push(remainingPoly)
                //degree()
                //remainingDegree = pop()
                /*
                if compare_numbers(startingDegree, remainingDegree)
                  * ok even if we found a complex root that
                  * together with the conjugate generates a poly in Z,
                  * that doesn't mean that the division would end up in Z.
                  * Example: 1+x^2+x^4+x^6 has +i and -i as one of its roots
                  * so a factor is 1+x^2 ( = (x+i)*(x-i))
                  * BUT
                */
                // replace all coefficients: after a real factor was divided out,
                // polycoeff is longer than factpoly_expo + 1, and popping only that
                // many left a stale coefficient in front
                polycoeff.splice(0, polycoeff.length, ...coeff_1.coeff(remainingPoly, p2));
                factpoly_expo -= 2;
            }
        }
    }
    //console.log("factpoly_expo: " + factpoly_expo)
    // build the remaining unfactored part of the polynomial
    let temp = defs_1.Constants.zero;
    for (let i = 0; i <= factpoly_expo; i++) {
        // p2: the free variable
        temp = add_1.add(temp, multiply_1.multiply(polycoeff[i], power_1.power(p2, bignum_1.integer(i))));
    }
    p1 = temp;
    if (defs_1.DEBUG) {
        console.log(`POLY=${p1}`);
    }
    // factor out negative sign, before condensing: negate() would expand
    // a condensed -2*(x^2+x+1) back into 2*x^2+2*x+2
    if (factpoly_expo > 0 && is_1.isnegativeterm(polycoeff[factpoly_expo])) {
        p1 = multiply_1.negate(p1);
        p7 = multiply_1.negate_noexpand(p7);
    }
    // the complete algorithm gave up on the whole polynomial (too many
    // modular factors): with the small factors gone it may succeed
    const again = factpoly_expo >= 2
        ? factorRemainder(p1, p2, coeff_1.coeff(p1, p2)) // p1 may have changed sign
        : undefined;
    if (again && again.length > 2) {
        return again.reduce(multiply_1.multiply_noexpand, p7);
    }
    // several variables: the searches above miss x+y+z in x^2+2*x*y+y^2-z^2
    const multivariate = factpoly_expo > 0 ? factor_multivariate_1.factorKronecker(p1, p2) : undefined;
    if (multivariate) {
        return multivariate.reduce(multiply_1.multiply_noexpand, p7);
    }
    p1 = defs_1.noexpand(condense_1.yycondense, p1);
    p7 = multiply_1.multiply_noexpand(p7, p1);
    if (defs_1.DEBUG) {
        console.log(`RESULT=${p7}`);
    }
    return p7;
}
function rationalize_coefficients(coefficients) {
    // LCM of all polynomial coefficients
    let p7 = defs_1.Constants.one;
    for (const coeff of coefficients) {
        p7 = lcm_1.lcm(denominator_1.denominator(coeff), p7);
    }
    // multiply each coefficient by RESULT
    for (let i = 0; i < coefficients.length; i++) {
        coefficients[i] = multiply_1.multiply(p7, coefficients[i]);
    }
    // reciprocate RESULT
    p7 = multiply_1.reciprocate(p7);
    if (defs_1.DEBUG) {
        console.log('rationalize_coefficients result');
    }
    return p7;
}
//console.log print_list(p7)
function get_factor_from_real_root(polycoeff, factpoly_expo, p2, p4, p5) {
    let p1, p3, p6;
    if (defs_1.DEBUG) {
        let temp = defs_1.Constants.zero;
        for (let i = 0; i <= factpoly_expo; i++) {
            temp = add_1.add(temp, multiply_1.multiply(polycoeff[i], power_1.power(p2, bignum_1.integer(i))));
        }
        p1 = temp;
        console.log(`POLY=${p1}`);
    }
    const an = divisors_1.ydivisors(polycoeff[factpoly_expo]);
    const a0 = divisors_1.ydivisors(polycoeff[0]);
    if (defs_1.DEBUG) {
        console.log('divisors of base term');
        for (let i = 0; i < a0.length; i++) {
            console.log(`, ${a0[i]}`);
        }
        console.log('divisors of leading term');
        for (let i = 0; i < an.length; i++) {
            console.log(`, ${an[i]}`);
        }
    }
    // try roots
    for (let rootsTries_i = 0; rootsTries_i < an.length; rootsTries_i++) {
        for (let rootsTries_j = 0; rootsTries_j < a0.length; rootsTries_j++) {
            //if DEBUG then console.log "nan: " + nan + " na0: " + na0 + " i: " + rootsTries_i + " j: " + rootsTries_j
            p4 = an[rootsTries_i];
            p5 = a0[rootsTries_j];
            p3 = multiply_1.negate(multiply_1.divide(p5, p4));
            p6 = Evalpoly(p3, polycoeff, factpoly_expo);
            if (defs_1.DEBUG) {
                console.log(`try A=${p4}\n, B=${p5}\n, root ${p2}\n=-B/A=${p3}\n, POLY(${p3}\n)=${p6}`);
            }
            if (is_1.isZeroAtomOrTensor(p6)) {
                if (defs_1.DEBUG) {
                    console.log('get_factor_from_real_root returning true');
                }
                return [true, p4, p5];
            }
            p5 = multiply_1.negate(p5);
            p3 = multiply_1.negate(p3);
            p6 = Evalpoly(p3, polycoeff, factpoly_expo);
            if (defs_1.DEBUG) {
                console.log(`try A=${p4}\n, B=${p5}\n, root ${p2}\n=-B/A=${p3}\n, POLY(${p3}\n)=${p6}`);
            }
            if (is_1.isZeroAtomOrTensor(p6)) {
                if (defs_1.DEBUG) {
                    console.log('get_factor_from_real_root returning true');
                }
                return [true, p4, p5];
            }
        }
    }
    if (defs_1.DEBUG) {
        console.log('get_factor_from_real_root returning false');
    }
    return [false, p4, p5];
}
function get_factor_from_complex_root(remainingPoly, polycoeff, factpoly_expo) {
    let p1, p4, p3, p6;
    if (factpoly_expo <= 2) {
        if (defs_1.DEBUG) {
            console.log('no more factoring via complex roots to be found in polynomial of degree <= 2');
        }
        return [false, p4];
    }
    p1 = remainingPoly;
    if (defs_1.DEBUG) {
        console.log(`complex root finding for POLY=${p1}`);
    }
    // trying -1^(2/3) which generates a polynomial in Z
    // generates x^2 + 2x + 1
    p4 = rect_1.rect(power_1.power(defs_1.Constants.negOne, bignum_1.rational(2, 3)));
    if (defs_1.DEBUG) {
        console.log(`complex root finding: trying with ${p4}`);
    }
    p3 = p4;
    p6 = Evalpoly(p3, polycoeff, factpoly_expo);
    if (defs_1.DEBUG) {
        console.log(`complex root finding result: ${p6}`);
    }
    if (is_1.isZeroAtomOrTensor(p6)) {
        if (defs_1.DEBUG) {
            console.log('get_factor_from_complex_root returning true');
        }
        return [true, p4];
    }
    // trying 1^(2/3) which generates a polynomial in Z
    // http://www.wolframalpha.com/input/?i=(1)%5E(2%2F3)
    // generates x^2 - 2x + 1
    p4 = rect_1.rect(power_1.power(defs_1.Constants.one, bignum_1.rational(2, 3)));
    if (defs_1.DEBUG) {
        console.log(`complex root finding: trying with ${p4}`);
    }
    p3 = p4;
    p6 = Evalpoly(p3, polycoeff, factpoly_expo);
    if (defs_1.DEBUG) {
        console.log(`complex root finding result: ${p6}`);
    }
    if (is_1.isZeroAtomOrTensor(p6)) {
        if (defs_1.DEBUG) {
            console.log('get_factor_from_complex_root returning true');
        }
        return [true, p4];
    }
    // trying some simple complex numbers. All of these
    // generate polynomials in Z
    for (let rootsTries_i = -10; rootsTries_i <= 10; rootsTries_i++) {
        for (let rootsTries_j = 1; rootsTries_j <= 5; rootsTries_j++) {
            p4 = rect_1.rect(add_1.add(bignum_1.integer(rootsTries_i), multiply_1.multiply(bignum_1.integer(rootsTries_j), defs_1.Constants.imaginaryunit)));
            //console.log("complex root finding: trying simple complex combination: " + p4)
            const p3 = p4;
            const p6 = Evalpoly(p3, polycoeff, factpoly_expo);
            //console.log("complex root finding result: " + p6)
            if (is_1.isZeroAtomOrTensor(p6)) {
                if (defs_1.DEBUG) {
                    console.log(`found complex root: ${p6}`);
                }
                return [true, p4];
            }
        }
    }
    if (defs_1.DEBUG) {
        console.log('get_factor_from_complex_root returning false');
    }
    return [false, p4];
}
// The complex roots tried above only cover some quadratic factors: x^2+2,
// 3*x^2+1 or real ones like x^2-2 were missed. Searches all integer
// quadratic factors a*x^2+b*x+c instead: a divides the leading coefficient,
// c the constant term, and the factor's values at 1 and -1, a+b+c and
// a-b+c, divide P(1) and P(-1). These are not zero because the rational
// roots have been divided out already. Degree >= 4 only: a quadratic
// factor of a cubic would come with a rational root.
function get_quadratic_factor(polycoeff, n, X) {
    if (n < 4) {
        return;
    }
    const cs = polycoeff.slice(0, n + 1);
    const P1 = bignum_1.nativeInt(Evalpoly(defs_1.Constants.one, cs, n));
    const Pm1 = bignum_1.nativeInt(Evalpoly(defs_1.Constants.negOne, cs, n));
    // big values: factor_small_number could not produce the divisors
    if (!cs.every(is_1.isinteger) ||
        !isFinite(P1) ||
        !isFinite(Pm1) ||
        P1 === 0 ||
        Pm1 === 0 ||
        [cs[0], cs[n]].some((c) => !isFinite(bignum_1.nativeInt(c)))) {
        return;
    }
    const divs = (c) => divisors_1.ydivisors(c).map(bignum_1.nativeInt);
    for (const a of divs(cs[n])) {
        for (const c0 of divs(cs[0])) {
            for (const c of [c0, -c0]) {
                for (const d0 of divs(bignum_1.integer(P1))) {
                    for (const d of [d0, -d0]) {
                        const b = d - a - c;
                        if (Pm1 % (a - b + c) !== 0) {
                            continue;
                        }
                        const q = add_1.add(multiply_1.multiply(bignum_1.integer(a), power_1.power(X, bignum_1.integer(2))), add_1.add(multiply_1.multiply(bignum_1.integer(b), X), bignum_1.integer(c)));
                        if (dividesExactly(cs, n, [c, b, a])) {
                            return q;
                        }
                    }
                }
            }
        }
    }
}
// does the quadratic d[0]+d[1]*x+d[2]*x^2 divide the polynomial with
// integer coefficients cs, leaving an integer quotient?
function dividesExactly(cs, n, d) {
    const r = cs.slice(0, n + 1);
    for (let i = n; i >= 2; i--) {
        const q = multiply_1.divide(r[i], bignum_1.integer(d[2]));
        if (!is_1.isinteger(q)) {
            return false;
        }
        r[i] = defs_1.Constants.zero;
        r[i - 1] = add_1.subtract(r[i - 1], multiply_1.multiply(q, bignum_1.integer(d[1])));
        r[i - 2] = add_1.subtract(r[i - 2], multiply_1.multiply(q, bignum_1.integer(d[0])));
    }
    return is_1.isZeroAtomOrTensor(r[0]) && is_1.isZeroAtomOrTensor(r[1]);
}
//-----------------------------------------------------------------------------
//
//  Divide a polynomial by Ax+B
//
//  Input:  on stack:  polycoeff  Dividend coefficients
//
//      factpoly_expo    Degree of dividend
//
//      A (p4)    As above
//
//      B (p5)    As above
//
//  Output:   on stack: polycoeff  Contains quotient coefficients
//
//-----------------------------------------------------------------------------
function yydivpoly(p4, p5, polycoeff, factpoly_expo) {
    let p6 = defs_1.Constants.zero;
    for (let i = factpoly_expo; i > 0; i--) {
        const divided = multiply_1.divide(polycoeff[i], p4);
        polycoeff[i] = p6;
        p6 = divided;
        polycoeff[i - 1] = add_1.subtract(polycoeff[i - 1], multiply_1.multiply(p6, p5));
    }
    polycoeff[0] = p6;
    if (defs_1.DEBUG) {
        console.log('yydivpoly Q:');
    }
}
//console.log print_list(p6)
function Evalpoly(p3, polycoeff, factpoly_expo) {
    let temp = defs_1.Constants.zero;
    for (let i = factpoly_expo; i >= 0; i--) {
        if (defs_1.DEBUG) {
            console.log('Evalpoly top of stack:');
            console.log(print_1.print_list(temp));
        }
        temp = add_1.add(multiply_1.multiply(temp, p3), polycoeff[i]);
    }
    return temp;
}
// Integer coefficients: irreducible factors from factor_zassenhaus.ts.
// undefined: symbolic coefficients, or the search was given up.
function factorRemainder(p, X, cs) {
    if (!cs.every(is_1.isinteger)) {
        return;
    }
    const result = factor_zassenhaus_1.factorZ(cs.map((c) => c.q.a));
    if (!result) {
        return;
    }
    const out = [new defs_1.Num(result.content)];
    for (const [f, mult] of result.factors) {
        const poly = f.reduce((sum, c, i) => add_1.add(sum, multiply_1.multiply(new defs_1.Num(c), power_1.power(X, bignum_1.integer(i)))), defs_1.Constants.zero);
        for (let k = 0; k < mult; k++) {
            out.push(poly);
        }
    }
    return out;
}
// gcd of the numerators over lcm of the denominators of the coefficients of
// a sum, undefined if that is 1 or a coefficient is not rational
function numericContent(p) {
    if (!defs_1.isadd(p)) {
        return;
    }
    let num = big_integer_1.default.zero;
    let den = big_integer_1.default.one;
    for (const t of p.tail()) {
        const c = defs_1.ismultiply(t) ? defs_1.cadr(t) : t;
        const q = defs_1.isrational(c) ? c : defs_1.Constants.one;
        num = big_integer_1.default.gcd(num, q.a);
        den = big_integer_1.default.lcm(den, q.b);
    }
    return num.equals(1) && den.equals(1) ? undefined : new defs_1.Num(num, den);
}
