import {
  caddddr,
  cadddr,
  caddr,
  cadr,
  Constants,
  DEBUG,
  ismultiply,
  isNumericAtom,
  ispower,
  issymbol,
  U
} from '../runtime/defs';
import { stop } from '../runtime/run';
import { get_binding, set_binding } from '../runtime/symbol';
import { integer, nativeInt } from './bignum';
import { Eval, evaluate_integer } from './eval';
import { evalExactly } from './float';
import { divide, multiply } from './multiply';
import { Find } from '../runtime/find';
import { add, subtract } from './add';
import { factorial } from './factorial';
import { power } from './power';
import { checkArgCount } from './misc';

// 'product' function

//define A p3
//define B p4
//define I p5
//define X p6

// leaves the product at the top of the stack
export function Eval_product(p1: U) {
  return evalExactly(evalProduct, p1);
}

function evalProduct(p1: U): U {
    checkArgCount(p1, 4);
    // 1st arg
    const body = cadr(p1);

    // 2nd arg (index)
    const indexVariable = caddr(p1);
    if (!issymbol(indexVariable)) {
        stop('product: 2nd arg?');
    }

    // 3rd arg (lower limit), 4th arg (upper limit)
  const j = evaluate_integer(cadddr(p1));
  const k = evaluate_integer(caddddr(p1));
    if (isNaN(j) || isNaN(k)) {
        return symbolicProduct(p1, body, indexVariable);
    }

    // remember contents of the index
    // variable so we can put it back after the loop
    const oldIndexVariableValue = get_binding(indexVariable);

    let temp: U = Constants.one;

    try {
        for (let i = j; i <= k; i++) {
            set_binding(indexVariable, integer(i));
            const arg2 = Eval(body);
            const temp2 = multiply(temp, arg2);

            if (DEBUG) {
          console.log(`product - factor 1: ${arg2}`);
          console.log(`product - factor 2: ${temp}`);
          console.log(`product - result: ${temp2}`);
            }
            temp = temp2;
        }
    } finally {
        // put back the index variable to original content,
        // also when the body stops with an error
        set_binding(indexVariable, oldIndexVariableValue);
    }
    return temp;
}

// Closed form for a symbolic bound, factor by factor: a constant c gives
// c^(b-a+1), the index shifted by a constant m gives (b+m)!/(a-1+m)!, and a
// constant power of such a factor the power of its product. Any other factor
// leaves the product unevaluated. As with sum, b >= a is taken for granted.
function symbolicProduct(p1: U, body: U, x: U): U {
  const saved = get_binding(x);
  set_binding(x, x);
  try {
    const f = Eval(body);
    const a = Eval(cadddr(p1));
    const b = Eval(caddddr(p1));
    // numeric bounds that are not integers: no integer steps from a to b
    if ([a, b].some((p) => isNumericAtom(p) && isNaN(nativeInt(p)))) {
      return p1;
    }
    const count = add(subtract(b, a), Constants.one);
    const one = (g: U): U | null => {
      if (!Find(g, x)) {
        return power(g, count);
      }
      if (ispower(g) && !Find(caddr(g), x)) {
        const base = one(cadr(g));
        return base && power(base, caddr(g));
      }
      const m = subtract(g, x);
      if (Find(m, x)) {
        return null;
      }
      return divide(
        factorial(add(b, m)),
        factorial(add(subtract(a, Constants.one), m))
      );
    };
    let result: U = Constants.one;
    for (const g of ismultiply(f) ? f.tail() : [f]) {
      const r = one(g);
      if (!r) {
        return p1;
      }
      result = multiply(result, r);
    }
    return result;
  } finally {
    set_binding(x, saved);
  }
}
