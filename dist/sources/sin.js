"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specialSineAngle = exports.specialSine = exports.integerTimesPi = exports.sine = exports.Eval_sin = void 0;
const assume_1 = require("./assume");
const defs_1 = require("../runtime/defs");
const symbol_1 = require("../runtime/symbol");
const add_1 = require("./add");
const bignum_1 = require("./bignum");
const cos_1 = require("./cos");
const eval_1 = require("./eval");
const is_1 = require("./is");
const list_1 = require("./list");
const misc_1 = require("./misc");
const multiply_1 = require("./multiply");
const power_1 = require("./power");
const quantity_1 = require("./quantity");
// Sine function of numerical and symbolic arguments
function Eval_sin(p1) {
    return sine(quantity_1.requireDimensionless(eval_1.Eval(defs_1.cadr(p1)), 'sin'));
}
exports.Eval_sin = Eval_sin;
function sine(p1) {
    if (defs_1.isadd(p1)) {
        // sin of a sum can be further decomposed into
        //sin(alpha+beta) = sin(alpha)*cos(beta)+sin(beta)*cos(alpha)
        return sine_of_angle_sum(p1);
    }
    return sine_of_angle(p1);
}
exports.sine = sine;
//console.log "sine end ---- "
// Use angle sum formula for special angles.
// decompose sum sin(alpha+beta) into
// sin(alpha)*cos(beta)+sin(beta)*cos(alpha)
function sine_of_angle_sum(p1) {
    let p2 = defs_1.cdr(p1);
    while (defs_1.iscons(p2)) {
        const B = defs_1.car(p2);
        if (is_1.isnpi(B) || integerTimesPi(B)) {
            const A = add_1.subtract(p1, B);
            return add_1.add(multiply_1.multiply(sine(A), cos_1.cosine(B)), multiply_1.multiply(cos_1.cosine(A), sine(B)));
        }
        p2 = defs_1.cdr(p2);
    }
    return sine_of_angle(p1);
}
// p = k*pi with k a symbolic integer (from the assumptions): k, else
// undefined. Numeric multiples are left to isnpi and the degree tables.
function integerTimesPi(p) {
    if (!defs_1.ismultiply(p) || !p.tail().includes(symbol_1.symbol(defs_1.PI))) {
        return undefined;
    }
    const k = multiply_1.divide(p, symbol_1.symbol(defs_1.PI));
    return assume_1.isInteger(k) && !defs_1.isNumericAtom(k) ? k : undefined;
}
exports.integerTimesPi = integerTimesPi;
function sine_of_angle(p1) {
    if (defs_1.car(p1) === symbol_1.symbol(defs_1.ARCSIN)) {
        return defs_1.cadr(p1);
    }
    // sin(k*pi) = 0 for integer k
    if (integerTimesPi(p1)) {
        return defs_1.Constants.zero;
    }
    if (defs_1.isdouble(p1)) {
        let d = Math.sin(p1.d);
        if (Math.abs(d) < 1e-10) {
            d = 0.0;
        }
        return bignum_1.double(d);
    }
    // sine function is antisymmetric, sin(-x) = -sin(x)
    if (is_1.isnegative(p1)) {
        return multiply_1.negate(sine(multiply_1.negate(p1)));
    }
    // sin(arctan(x)) = x / sqrt(1 + x^2)
    // see p. 173 of the CRC Handbook of Mathematical Sciences
    if (defs_1.car(p1) === symbol_1.symbol(defs_1.ARCTAN)) {
        return multiply_1.multiply(defs_1.cadr(p1), power_1.power(add_1.add(defs_1.Constants.one, power_1.power(defs_1.cadr(p1), bignum_1.integer(2))), bignum_1.rational(-1, 2)));
    }
    // multiply by 180/pi to go from radians to degrees.
    // we go from radians to degrees because it's much
    // easier to calculate symbolic results of most (not all) "classic"
    // angles (e.g. 30,45,60...) if we calculate the degrees
    // and the we do a switch on that.
    // Alternatively, we could look at the fraction of pi
    // (e.g. 60 degrees is 1/3 pi) but that's more
    // convoluted as we'd need to look at both numerator and
    // denominator.
    const n = bignum_1.nativeInt(multiply_1.divide(multiply_1.multiply(p1, bignum_1.integer(180)), defs_1.Constants.Pi()));
    // most "good" (i.e. compact) trigonometric results
    // happen for a round number of degrees. There are some exceptions
    // though, e.g. 22.5 degrees, which we don't capture here.
    if (n < 0 || isNaN(n)) {
        return list_1.makeList(symbol_1.symbol(defs_1.SIN), p1);
    }
    // values of some famous angles. Many more here:
    // https://en.wikipedia.org/wiki/Trigonometric_constants_expressed_in_real_radicals
    switch (n % 360) {
        case 0:
        case 180:
            return defs_1.Constants.zero;
        case 30:
        case 150:
            return bignum_1.rational(1, 2);
        case 210:
        case 330:
            return bignum_1.rational(-1, 2);
        case 45:
        case 135:
            return multiply_1.multiply(bignum_1.rational(1, 2), power_1.power(bignum_1.integer(2), bignum_1.rational(1, 2)));
        case 225:
        case 315:
            return multiply_1.multiply(bignum_1.rational(-1, 2), power_1.power(bignum_1.integer(2), bignum_1.rational(1, 2)));
        case 60:
        case 120:
            return multiply_1.multiply(bignum_1.rational(1, 2), power_1.power(bignum_1.integer(3), bignum_1.rational(1, 2)));
        case 240:
        case 300:
            return multiply_1.multiply(bignum_1.rational(-1, 2), power_1.power(bignum_1.integer(3), bignum_1.rational(1, 2)));
        case 90:
            return defs_1.Constants.one;
        case 270:
            return defs_1.Constants.negOne;
        default:
            return specialSine(n % 360) || list_1.makeList(symbol_1.symbol(defs_1.SIN), p1);
    }
}
// sin of n degrees, 0 <= n < 360, for the odd multiples of 15:
// sin(15) = (6^(1/2)-2^(1/2))/4, sin(75) = (6^(1/2)+2^(1/2))/4 and their
// mirror images. cos uses it through cos(n) = sin(90-n).
// ponytail: multiples of 18 degrees (pi/10) are left alone on purpose, their
// nested radicals make roots of unity and arg() results unreadable.
function specialSine(n) {
    if (n > 180) {
        const s = specialSine(n - 180);
        return s && multiply_1.negate(s);
    }
    if (n > 90) {
        return specialSine(180 - n);
    }
    const sqrt = (k) => power_1.power(bignum_1.integer(k), bignum_1.rational(1, 2));
    if (n === 15) {
        return multiply_1.multiply(bignum_1.rational(1, 4), add_1.subtract(sqrt(6), sqrt(2)));
    }
    if (n === 75) {
        return multiply_1.multiply(bignum_1.rational(1, 4), add_1.add(sqrt(6), sqrt(2)));
    }
    return undefined;
}
exports.specialSine = specialSine;
// the angle in degrees within [-90, 90] whose sine is the special value x
function specialSineAngle(x) {
    for (const n of [15, 75]) {
        if (misc_1.equal(x, specialSine(n))) {
            return n;
        }
        if (misc_1.equal(x, multiply_1.negate(specialSine(n)))) {
            return -n;
        }
    }
    return undefined;
}
exports.specialSineAngle = specialSineAngle;
