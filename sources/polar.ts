import { cadr, Constants, evalPolar, istensor, U } from '../runtime/defs';
import { exponential } from '../sources/misc';
import { abs } from './abs';
import { arg } from './arg';
import { Eval } from './eval';
import { multiply } from './multiply';
import { copy_tensor } from './tensor';

/*
Convert complex z to polar form

  Input:    p1  z
  Output:    Result

  polar(z) = abs(z) * exp(i * arg(z))
*/
export function Eval_polar(p1: U) {
  return polar(Eval(cadr(p1)));
}

export function polar(p1: U): U {
  if (istensor(p1)) {
    const t = copy_tensor(p1);
    t.tensor.elem = t.tensor.elem.map(polar);
    return t;
  }
  // there are points where we turn polar
  // representations into rect, we set a "stack flag"
  // here to avoid that, so we don't undo the
  // work that we are trying to do.
  return evalPolar(() => {
    return multiply(
      abs(p1),
      exponential(multiply(Constants.imaginaryunit, arg(p1)))
    );
  });
}
