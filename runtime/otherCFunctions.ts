import { nativeInt } from '../sources/bignum';
import { isZeroAtomOrTensor } from '../sources/is';
import { makeList } from '../sources/list';
import { defs, FORCE_FIXED_PRINTOUT, iscons, MAX_FIXED_PRINTOUT_DIGITS, PRINTMODE_LATEX, Sign, U } from './defs';
import { stop } from './run';
import { get_binding, symbol } from './symbol';

export function strcmp(str1: string, str2: string): Sign {
  if (str1 === str2) {
    return 0;
  } else if (str1 > str2) {
    return 1;
  } else {
    return -1;
  }
}

export function doubleToReasonableString(d: number) {
  // when generating code, print out
  // the standard JS Number printout
  let stringRepresentation: string;
  if (defs.codeGen || defs.fullDoubleOutput) {
    return '' + d;
  }

  // float overflow: print like the inf symbol, not as JS "Infinity.0"
  if (d === Infinity || d === -Infinity) {
    const name = defs.printMode === PRINTMODE_LATEX ? '\\infty' : 'inf';
    return d < 0 ? '-' + name : name;
  }

  if (isZeroAtomOrTensor(get_binding(symbol(FORCE_FIXED_PRINTOUT)))) {
    stringRepresentation = '' + d;
    // manipulate the string so that it can be parsed by
    // Algebrite (something like 1.23e-123 wouldn't cut it because
    // that would be parsed as 1.23*e - 123)

    if (defs.printMode === PRINTMODE_LATEX) {
      // 1.0\mathrm{e}{-10} looks much better than the plain 1.0e-10
      if (/\d*\.\d*e.*/gm.test(stringRepresentation)) {
        stringRepresentation = stringRepresentation.replace(
          /e(.*)/gm,
          '\\mathrm{e}{$1}'
        );
      } else {
        // if there is no dot in the mantissa, add it so we see it's
        // a double and not a perfect number
        // e.g. 1e-10 becomes 1.0\mathrm{e}{-10}
        stringRepresentation = stringRepresentation.replace(
          /(\d+)e(.*)/gm,
          '$1.0\\mathrm{e}{$2}'
        );
      }
    } else {
      if (/\d*\.\d*e.*/gm.test(stringRepresentation)) {
        stringRepresentation = stringRepresentation.replace(
          /e(.*)/gm,
          '*10^($1)'
        );
      } else {
        // if there is no dot in the mantissa, add it so we see it's
        // a double and not a perfect number
        // e.g. 1e-10 becomes 1.0e-10
        stringRepresentation = stringRepresentation.replace(
          /(\d+)e(.*)/gm,
          '$1.0*10^($2)'
        );
      }
    }
  } else {
    const maxFixedPrintoutDigits = nativeInt(
      get_binding(symbol(MAX_FIXED_PRINTOUT_DIGITS))
    );
    // Fixed notation would show fewer than 3 significant digits below
    // 10^(3-digits) (1e-7 printed as 0.000000..., which reads as zero),
    // and doubles no longer hold every integer digit from 10^15 on.
    const abs = Math.abs(d);
    if (
      abs !== 0 &&
      (abs < 10 ** Math.min(3 - maxFixedPrintoutDigits, -1) || abs >= 1e15)
    ) {
      return scientificString(d, maxFixedPrintoutDigits);
    }

    stringRepresentation = '' + d.toFixed(maxFixedPrintoutDigits);

    // remove any trailing zeroes after the dot
    // see https://stackoverflow.com/questions/26299160/using-regex-how-do-i-remove-the-trailing-zeros-from-a-decimal-number
    stringRepresentation = stringRepresentation.replace(
      /(\.\d*?[1-9])0+$/gm,
      '$1'
    );
    // in case there are only zeroes after the dot, removes the dot too
    stringRepresentation = stringRepresentation.replace(/\.0+$/gm, '');

    // we actually want to give a hint to user that
    // it's a double, so add a trailing ".0" if there
    // is no decimal point
    if (stringRepresentation.indexOf('.') === -1) {
      stringRepresentation += '.0';
    }

    if (parseFloat(stringRepresentation) !== d) {
      stringRepresentation = d.toFixed(maxFixedPrintoutDigits) + '...';
    }
  }

  return stringRepresentation;
}

// 1.5*10^(-7) (1.5 \cdot 10^{-7} in LaTeX), with the same number of
// mantissa decimals and the same "..." marker for rounding as fixed output
function scientificString(d: number, digits: number): string {
  const [rounded, exp] = d.toExponential(digits).split('e');
  let mantissa = rounded
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '.0');
  if (parseFloat(`${mantissa}e${exp}`) !== d) {
    mantissa = rounded + '...';
  }
  const e = parseInt(exp, 10);
  if (defs.printMode === PRINTMODE_LATEX) {
    return `${mantissa} \\cdot 10^{${e}}`;
  }
  return `${mantissa}*10^${e < 0 ? `(${e})` : e}`;
}

// does nothing
export function clear_term() {}

// s is a string here anyways
export function isspace(s: string): boolean {
  if (s == null) {
    return false;
  }
  return (
    s === ' ' ||
    s === '\t' ||
    s === '\n' ||
    s === '\v' ||
    s === '\f' ||
    s === '\r'
  );
}

export function isdigit(str: string): boolean {
  if (str == null) {
    return false;
  }
  return /^\d+$/.test(str);
}

export function isalpha(str: string): boolean {
  if (str == null) {
    return false;
  }
  //Check for non-alphabetic characters and space
  return str.search(/[^A-Za-z]/) === -1;
}

function isalphaOrUnderscore(str: string): boolean {
  if (str == null) {
    return false;
  }
  //Check for non-alphabetic characters and space
  return str.search(/[^A-Za-z_]/) === -1;
}

function isunderscore(str: string): boolean {
  if (str == null) {
    return false;
  }
  return str.search(/_/) === -1;
}

export function isalnumorunderscore(str: string): boolean {
  if (str == null) {
    return false;
  }
  return isalphaOrUnderscore(str) || isdigit(str);
}

// Append one list to another.
export function append(p1: U, p2: U): U {
  // from https://github.com/gbl08ma/eigenmath/blob/8be989f00f2f6f37989bb7fd2e75a83f882fdc49/src/append.cpp
  const arr = [];
  if (iscons(p1)) {
    arr.push(...p1);
  }
  if (iscons(p2)) {
    arr.push(...p2);
  }
  return makeList(...arr);
}

// Integer-order Bessel functions from their integral representations.
// J: (1/2pi) int_0^2pi cos(n t - x sin t) dt, the trapezoidal rule is
// exponentially accurate for this periodic integrand.
export function jn(n: number, x: number): number {
  if (x === 0) {
    return n === 0 ? 1 : 0;
  }
  const m = 2 * Math.ceil(Math.abs(x) + Math.abs(n)) + 64;
  let sum = 0;
  for (let k = 0; k < m; k++) {
    const t = (2 * Math.PI * k) / m;
    sum += Math.cos(n * t - x * Math.sin(t));
  }
  return sum / m;
}

// Y (x > 0): (1/pi) int_0^pi sin(x sin t - n t) dt
//   - (1/pi) int_0^inf (e^(n t) + (-1)^n e^(-n t)) e^(-x sinh t) dt,
// with Y_(-n) = (-1)^n Y_n. Simpson's rule, the second integral cut off
// where its integrand is below e^-50 of its scale.
// ponytail: ~8 significant digits, a series/asymptotic expansion if more
export function yn(n: number, x: number): number {
  if (!(x > 0)) {
    stop('bessely: x must be positive');
  }
  const sign = n < 0 && n % 2 !== 0 ? -1 : 1;
  n = Math.abs(n);
  const simpson = (f: (t: number) => number, a: number, b: number) => {
    const m = 4000;
    const h = (b - a) / m;
    let s = f(a) + f(b);
    for (let k = 1; k < m; k++) {
      s += (k % 2 ? 4 : 2) * f(a + k * h);
    }
    return (s * h) / 3;
  };
  const first = simpson((t) => Math.sin(x * Math.sin(t) - n * t), 0, Math.PI);
  let T = 1;
  while (x * Math.sinh(T) - n * T < 50) {
    T += 1;
  }
  const parity = n % 2 ? -1 : 1;
  const second = simpson(
    (t) => (Math.exp(n * t) + parity * Math.exp(-n * t)) * Math.exp(-x * Math.sinh(t)),
    0,
    T
  );
  return (sign * (first - second)) / Math.PI;
}
