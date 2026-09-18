import { run_test } from '../test-harness';

// 1. LaTeX function names ----------------------------------------------------
// A function name is an operator name, not a product of italic letters:
// \sin, \ln (log is the natural logarithm, \ln is unambiguous), \Gamma, and
// \operatorname{...} for names without a macro. One-letter names (f, y'',
// f_1) stay as they are. The arguments of a named function stand in
// \left( \right). TeX itself puts a thin space around an operator name, so
// x\sin\left(x\right)\cos\left(x\right) needs no explicit separator.
run_test([
  'printlatex(sin(x)*arcsin(x)*log(x)*exp(x)*sinh(x)*erf(x))',
  'e^{x}\\arcsin\\left(x\\right)\\operatorname{erf}\\left(x\\right)\\ln\\left(x\\right)\\sin\\left(x\\right)\\sinh\\left(x\\right)',

  'printlatex(sin(x))',
  '\\sin\\left(x\\right)',

  'printlatex(cos(x))',
  '\\cos\\left(x\\right)',

  'printlatex(tan(x))',
  '\\tan\\left(x\\right)',

  'printlatex(arccos(x))',
  '\\arccos\\left(x\\right)',

  'printlatex(arctan(x))',
  '\\arctan\\left(x\\right)',

  'printlatex(cosh(x))',
  '\\cosh\\left(x\\right)',

  'printlatex(tanh(x))',
  '\\tanh\\left(x\\right)',

  'printlatex(log(x))',
  '\\ln\\left(x\\right)',

  'printlatex(log(x)/log(10))',
  '\\frac{\\ln\\left(x\\right)}{\\ln\\left(10\\right)}',

  // exp(x) is e^x, the function name only appears unevaluated
  'printlatex(exp(sin(x)))',
  'e^{\\sin\\left(x\\right)}',

  'printlatex(quote(exp(x)))',
  '\\exp\\left(x\\right)',

  'printlatex(quote(min(a,b)))',
  '\\min\\left(a,b\\right)',

  'printlatex(quote(max(a,b)))',
  '\\max\\left(a,b\\right)',

  'printlatex(quote(gcd(a,b)))',
  '\\gcd\\left(a,b\\right)',

  'printlatex(quote(det(A)))',
  '\\det\\left(A\\right)',

  'printlatex(quote(arg(z)))',
  '\\arg\\left(z\\right)',

  'printlatex(gamma(x))',
  '\\Gamma\\left(x\\right)',
]);

run_test([
  // no LaTeX macro: \operatorname
  'printlatex(erf(x))',
  '\\operatorname{erf}\\left(x\\right)',

  'printlatex(arcsinh(x))',
  '\\operatorname{arcsinh}\\left(x\\right)',

  'printlatex(besselj(0,x))',
  '\\operatorname{besselj}\\left(0,x\\right)',

  'printlatex(Si(x))',
  '\\operatorname{Si}\\left(x\\right)',

  'printlatex(foo(x)*bar(y))',
  '\\operatorname{bar}\\left(y\\right)\\operatorname{foo}\\left(x\\right)',

  'printlatex(quote(round(x)))',
  '\\operatorname{round}\\left(x\\right)',

  // one-letter function names stay
  'printlatex(f(x))',
  'f(x)',

  'printlatex(f(x)*g(y))',
  'f(x)g(y)',

  "printlatex(y''(0))",
  "y''(0)",

  'printlatex(f_1(x))',
  'f_1(x)',

  'printlatex(quote(d(f(x),x)))',
  'd(f(x),x)',

  'printlatex(quote(f(x)=sin(x)))',
  'f(x)=\\sin\\left(x\\right)',

  'printlatex(f(sin(x)))',
  'f(\\sin\\left(x\\right))',
]);

run_test([
  // next to other factors
  'printlatex(x*sin(x))',
  'x\\sin\\left(x\\right)',

  'printlatex(pi*sin(x))',
  '\\pi\\sin\\left(x\\right)',

  'printlatex(pi*x*cos(x))',
  '\\pi x\\cos\\left(x\\right)',

  'printlatex(2*sin(x)*cos(x))',
  '2\\cos\\left(x\\right)\\sin\\left(x\\right)',

  'printlatex(-sin(x))',
  '-\\sin\\left(x\\right)',

  'printlatex(sin(x)/cos(x))',
  '\\frac{\\sin\\left(x\\right)}{\\cos\\left(x\\right)}',

  'printlatex(1/sin(x))',
  '\\frac{1}{\\sin\\left(x\\right)}',

  'printlatex(sin(x)^2)',
  '\\sin\\left(x\\right)^2',

  'printlatex(erf(x)^2)',
  '\\operatorname{erf}\\left(x\\right)^2',

  'printlatex(x^sin(x))',
  'x^{\\sin\\left(x\\right)}',

  'printlatex(sin(a+b)^(1/2))',
  '\\sqrt{\\sin\\left(a+b\\right)}',

  'printlatex(tan(x)+cos(2*x))',
  '\\cos\\left(2x\\right)+\\tan\\left(x\\right)',

  'printlatex(sin(x/2))',
  '\\sin\\left(\\frac{x}{2}\\right)',

  'printlatex([sin(x),cos(x)])',
  '\\begin{bmatrix} \\sin\\left(x\\right) & \\cos\\left(x\\right) \\end{bmatrix}',

  'printlatex(quote(sum(sin(k),k,1,n)))',
  '\\sum_{k=1}^{n}{\\sin\\left(k\\right)}',

  'printlatex(quote(sin(x)>0))',
  '{\\sin\\left(x\\right)} > {0}',

  // an unevaluated limit
  'printlatex(quote(limit(sin(x)/x,x,0)))',
  '\\lim_{x \\to 0}{\\frac{\\sin\\left(x\\right)}{x}}',

  'printlatex(quote(limit(1/t,t,inf)))',
  '\\lim_{t \\to \\infty}{\\frac{1}{t}}',

  'printlatex(quote(limit(a+b,x,-inf)))',
  '\\lim_{x \\to -\\infty}{\\left(a+b\\right)}',

  'printlatex(quote(limit(1/x,x,0,right)))',
  '\\lim_{x \\to 0^{+}}{\\frac{1}{x}}',

  'printlatex(quote(limit(1/x,x,0,left)))',
  '\\lim_{x \\to 0^{-}}{\\frac{1}{x}}',

  'printlatex(quote(limit(1/x,x,0,-1)))',
  '\\lim_{x \\to 0^{-}}{\\frac{1}{x}}',
]);

run_test([
  // what must not change: the special LaTeX forms and the other print modes
  'printlatex(abs(x))',
  '\\left |x \\right |',

  'printlatex(sqrt(x))',
  '\\sqrt{x}',

  'printlatex(exp(-x))',
  'e^{-x}',

  'printlatex(quote(factorial(n)))',
  'n!',

  'printlatex(quote(floor(x)))',
  ' \\lfloor {x} \\rfloor ',

  'printlatex(quote(binomial(n,k)))',
  '\\binom{n}{k} ',

  'printlatex(1/(x+1)^2)',
  '\\frac{1}{(1+x)^2}',

  'printlatex(pi*x)',
  '\\pi x',

  'sin(x)*log(x)*erf(x)',
  'erf(x)*log(x)*sin(x)',

  'printcomputer(sin(x)*log(x))',
  'log(x)*sin(x)',

  'printhuman(sin(x)*log(x))',
  'log(x) sin(x)',

  'printlist(sin(x)*log(x))',
  '(multiply (log x) (sin x))',

  'gamma(x)',
  'Gamma(x)',
]);

// 2. i^i ---------------------------------------------------------------------
// z^w = exp(w*log(z)) on the principal branch. For z = -1, i, -i the
// logarithm is i*pi, i*pi/2, -i*pi/2, so a numeric complex exponent gives a
// closed form: i^i = exp(i*i*pi/2) = exp(-pi/2) = 0.2078795763...
run_test([
  'i^i',
  'exp(-1/2*pi)',

  // mpmath: 0.20787957635076190855
  'float(i^i)',
  '0.207880...',

  'i^i-exp(-pi/2)',
  '0',

  '(-1)^i',
  'exp(-pi)',

  // mpmath: 0.043213918263772249774
  'float((-1)^i)',
  '0.043214...',

  'i^(2*i)',
  'exp(-pi)',

  'i^(-i)',
  'exp(1/2*pi)',

  '(-i)^i',
  'exp(1/2*pi)',

  '(-1)^(i/2)',
  'exp(-1/2*pi)',

  'i^(i/2)',
  'exp(-1/4*pi)',

  '(-1)^(2*i)',
  'exp(-2*pi)',

  // i^(1+i) = i*i^i, (-1)^(1+i) = -(-1)^i, (-1)^(1/2+i) = i*(-1)^i
  'i^(1+i)',
  'i*exp(-1/2*pi)',

  '(-1)^(1+i)',
  '-exp(-pi)',

  '(-1)^(1/2+i)',
  'i*exp(-pi)',

  'i^i*i^i',
  'exp(-pi)',

  'imag(i^i)',
  '0',

  'real(i^i)',
  'exp(-1/2*pi)',
]);

run_test([
  // other bases: left exact, right under float. The values are mpmath's
  // (1+1j)**1j and so on.
  '2^i',
  '2^i',

  '(1+i)^i',
  '(1+i)^i',

  'float(2^i)',
  '0.769239...+0.638961...*i',

  'float((1+i)^i)',
  '0.428829...+0.154872...*i',

  'float((-2)^i)',
  '0.033242...+0.027612...*i',

  '(-2.0)^i',
  '0.033242...+0.027612...*i',

  'float((1+i)^(1+i))',
  '0.273957...+0.583701...*i',

  'float((2*i)^i)',
  '0.159909...+0.132827...*i',

  'float((3+4*i)^(1/2+i))',
  '-0.425894...+0.775370...*i',

  // symbolic parts: nothing happens
  'x^i',
  'x^i',

  'i^x',
  'i^x',

  '(-1)^(i*x)',
  '(-1)^(i*x)',

  // the neighbours
  'i^2',
  '-1',

  'i^3',
  '-i',

  'i^(1/2)',
  '1/2*2^(1/2)+1/2*i*2^(1/2)',

  '(-1)^(1/2)',
  'i',

  '(-1)^(1/3)',
  '1/2+1/2*i*3^(1/2)',

  '(1+i)^2',
  '2*i',

  'exp(i*pi/2)',
  'i',

  'exp(i)',
  'cos(1)+i*sin(1)',
]);

// 3. float(x,n) for the special functions -------------------------------------
// every value from mpmath at 30, 50 and 100 digits
run_test([
  'float(zeta(3),30)',
  '1.20205690315959428539973816151',

  'float(zeta(3),50)',
  '1.2020569031595942853997381615114499907649862923405',

  'float(zeta(3),100)',
  '1.202056903159594285399738161511449990764986292340498881792271555341838205786313090186455873609335258',

  'float(zeta(5),30)',
  '1.03692775514336992633136548646',

  'float(zeta(51),30)',
  '1.00000000000000044408921031438',

  'float(zeta(5/2),30)',
  '1.34148725725091717975676969335',

  'float(zeta(5/2),50)',
  '1.3414872572509171797567696933486121366230376295060',

  'float(zeta(5/2),100)',
  '1.341487257250917179756769693348612136623037629505986511253796728340918923813185441581761085998697994',

  'float(zeta(3/2),30)',
  '2.61237534868548834334856756792',

  'float(zeta(7/3),30)',
  '1.41515560944598302461278911828',

  'float(zeta(11/10),30)',
  '10.5844484649508098263864007917',

  // left of the pole
  'float(zeta(1/2),30)',
  '-1.46035450880958681288949915252',

  'float(zeta(-1/2),30)',
  '-0.207886224977354566017306725397',

  'float(zeta(-7/2),30)',
  '0.00444101133547943195853465801782',

  'float(zeta(pi),30)',
  '1.17624173838258275887215045194',

  'float(zeta(3)+zeta(5),30)',
  '2.23898465830296421173110364797',

  // exact values as before
  'float(zeta(2),30)',
  '1.64493406684822643647241516665',

  'zeta(3)',
  'zeta(3)',

  'float(zeta(3))',
  '1.202057...',

  'zeta(1)',
  'Stop: zeta: pole at 1',
]);

run_test([
  'float(digamma(1),30)',
  '-0.577215664901532860606512090082',

  'float(digamma(1),50)',
  '-0.57721566490153286060651209008240243104215933593992',

  'float(digamma(1),100)',
  '-0.5772156649015328606065120900824024310421593359399235988057672348848677267776646709369470632917467495',

  'float(digamma(1/3),30)',
  '-3.13203378002080632299641907429',

  'float(digamma(-1/2),30)',
  '0.0364899739785765205590236670012',

  'float(digamma(10),30)',
  '2.25175258906672110764745616389',

  'float(Si(1),30)',
  '0.946083070367183014941353313823',

  'float(Si(1),50)',
  '0.94608307036718301494135331382317965781233795473811',

  'float(Si(1),100)',
  '0.9460830703671830149413533138231796578123379547381117904714547735666870365407979180887021330817407112',

  'float(Si(-2),30)',
  '-1.60541297680269484857672014820',

  // an alternating series with large terms: the precision check has to work
  'float(Si(20),30)',
  '1.54824170104343984016364334213',

  'float(Ci(1),30)',
  '0.337403922900968134662646203889',

  'float(Ci(1),50)',
  '0.33740392290096813466264620388915076999757803258573',

  'float(Ci(1),100)',
  '0.3374039229009681346626462038891507699975780325857318948013185424361303300250560528968481830973229946',

  'float(Ci(1/2),30)',
  '-0.177784078806612901335810271071',

  'float(Ei(1),30)',
  '1.89511781635593675546652093433',

  'float(Ei(1),50)',
  '1.8951178163559367554665209343316342690170605817327',

  'float(Ei(1),100)',
  '1.895117816355936755466520934331634269017060581732707591646228431882513834533804153548900710126138957',

  'float(Ei(-1),30)',
  '-0.219383934395520273677163775460',

  'float(Ei(10),30)',
  '2492.22897624187775913844014400',
]);

run_test([
  'float(lambertw(1),30)',
  '0.567143290409783872999968662210',

  'float(lambertw(1),50)',
  '0.56714329040978387299996866221035554975381578718651',

  'float(lambertw(1),100)',
  '0.5671432904097838729999686622103555497538157871865125081351310792230457930866845666932194469617522946',

  'float(lambertw(-1/5),30)',
  '-0.259171101819073745056651950215',

  'float(lambertw(-1/5,-1),30)',
  '-2.54264135777352642429380615666',

  'float(lambertw(100),30)',
  '3.38563014029005018488824436453',

  'float(fresnels(1),30)',
  '0.438259147390354766076756696625',

  'float(fresnels(1),50)',
  '0.43825914739035476607675669662515263749378657245242',

  'float(fresnels(1),100)',
  '0.4382591473903547660767566966251526374937865724524165673344073262658059382112998771734606741411548457',

  'float(fresnels(-1/2),30)',
  '-0.0647324328599992776114805122306',

  'float(fresnelc(1),30)',
  '0.779893400376822829474206413653',

  'float(fresnelc(1),50)',
  '0.77989340037682282947420641365269013663062570813632',

  'float(fresnelc(1),100)',
  '0.7798934003768228294742064136526901366306257081363209601031335831780717609791088901087787073052785282',

  'float(besselj(0,1),30)',
  '0.765197686557966551449717526103',

  'float(besselj(0,1),50)',
  '0.76519768655796655144971752610266322090927428975533',

  'float(besselj(0,1),100)',
  '0.7651976865579665514497175261026632209092742897553252418615475491192789122152724401671806000989156340',

  'float(besselj(2,3/2),30)',
  '0.232087672144214727237776539925',

  'float(besselj(1,-2),30)',
  '-0.576724807756873387202448242269',

  'float(besselj(-3,2),30)',
  '-0.128943249474402051098793332969',

  'float(besselj(0,30),30)',
  '-0.0863679835810402113359623244961',
]);

run_test([
  'float(arcsinh(1),30)',
  '0.881373587019543025232609324980',

  'float(arcsinh(-2),30)',
  '-1.44363547517881034249327674027',

  'float(arccosh(2),30)',
  '1.31695789692481670862504634731',

  'float(arctanh(1/2),30)',
  '0.549306144334054845697622618461',

  // (1/3)! = Gamma(4/3)
  'float((1/3)!,30)',
  '0.892979511569249211218564313658',

  // worked before
  'float(gamma(1/3),30)',
  '2.67893853470774763365569294097',

  'float(gamma(1/3),50)',
  '2.6789385347077476336556929409746776441286893779573',

  'float(gamma(1/3),100)',
  '2.678938534707747633655692940974677644128689377957301100950428327590417610167743819540982889041188789',

  'float(erf(1),30)',
  '0.842700792949714869341220635083',

  // no method with a known error: the message says so
  'float(bessely(0,1),30)',
  'Stop: float: cannot evaluate bessely(0,1) to 30 digits: no arbitrary precision for bessely',

  'float(besselj(1/3,1),30)',
  'Stop: float: cannot evaluate besselj(1/3,1) to 30 digits: no arbitrary precision for besselj of this order',

  'float(f(2),20)',
  'Stop: float: cannot evaluate f(2) to 20 digits: no arbitrary precision for f',

  // double precision still works
  'float(bessely(0,1))',
  '0.088257...',

  'float(x,20)',
  'Stop: float: cannot evaluate x to 20 digits',

  'float(zeta(x),20)',
  'Stop: float: cannot evaluate zeta(x) to 20 digits',
]);

// 4. 0^n and defint(x^n,x,0,1) -----------------------------------------------
// 0^p = 0 needs p > 0: 0^0 = 1 and 0^(-1) is a division by zero. The
// integral of x^n over (0,1) is 1/(1+n) for n > -1 and diverges otherwise;
// with nothing known about n the term 0^(1+n) stays.
run_test([
  'defint(x^n,x,0,1)',
  '1/(1+n)-0^(1+n)/(1+n)',

  '0^n',
  '0^n',

  'assume(n,positive)',
  '',

  '0^n',
  '0',

  '0^(n+1)',
  '0',

  '0^(2*n)',
  '0',

  '0^(n^2)',
  '0',

  '5*0^n+1',
  '1',

  '0.0^n',
  '0.0',

  // n-1 may be negative or zero
  '0^(n-1)',
  '0^(-1+n)',

  '0^(-n)',
  '0^(-n)',

  'defint(x^n,x,0,1)',
  '1/(1+n)',

  'defint(x^n,x,0,a)',
  'a^(1+n)/(1+n)',

  // the antiderivative is x^n/n, n > 0
  'defint(x^(n-1),x,0,1)',
  '1/n',

  'defint(y^n,y,0,2)',
  '2^(1+n)/(1+n)',

  // not touched by the bound 0
  'defint(x^n,x,1,2)',
  '-1/(1+n)+2^(1+n)/(1+n)',

  'subst(0,x,x^n)',
  '0',

  'forget(n)',
  '',

  '0^n',
  '0^n',
]);

run_test([
  // n >= 0: 0^n may be 0^0 = 1, but 1+n > 0
  'assume(m>=0)',
  '',

  '0^m',
  '0^m',

  '0^(m+1)',
  '0',

  'defint(x^m,x,0,1)',
  '1/(1+m)',

  'assume(k<0)',
  '',

  '0^k',
  '0^k',

  'defint(x^k,x,0,1)',
  '1/(1+k)-0^(1+k)/(1+k)',

  // numbers as before
  '0^2',
  '0',

  '0^(1/2)',
  '0',

  '0^0',
  '1',

  '0^(-1)',
  'Stop: divide by zero',

  'defint(x^2,x,0,1)',
  '1/3',

  'defint(x^(1/2),x,0,1)',
  '2/3',

  'defint(x^(-1/2),x,0,1)',
  '2',
]);

// 5. limits of oscillating functions -----------------------------------------
// sin(g) and cos(g) with g -> +-inf take every value of [-1,1] again and
// again: there is no limit, and L'Hopital has nothing to do with it.
run_test([
  'limit(sin(1/x),x,0)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(sin(1/x),x,0,right)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(sin(1/x),x,0,left)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(cos(1/x^2),x,0)',
  'Stop: limit: the limit does not exist: cos(1/x^2) oscillates',

  'limit(sin(x),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  'limit(cos(x),x,-inf)',
  'Stop: limit: the limit does not exist: cos(x) oscillates',

  'limit(sin(2*t+1),t,inf)',
  'Stop: limit: the limit does not exist: sin(1+2*t) oscillates',

  // times something that does not go to 0
  'limit(x*sin(x),x,infinity)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  'limit(3*sin(x),x,inf)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  'limit(sin(1/x)/x,x,0)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(sin(x)^2,x,inf)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  // plus something with a finite limit
  'limit(2+sin(1/x),x,0)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  'limit(sin(x)+1/x,x,inf)',
  'Stop: limit: the limit does not exist: sin(x) oscillates',

  // the primitive -cos(x) at inf
  'defint(sin(x),x,0,inf)',
  'Stop: limit: the limit does not exist: cos(x) oscillates',
]);

run_test([
  // the squeeze argument still gives 0
  'limit(x*sin(1/x),x,0)',
  '0',

  'limit(x^2*cos(1/x),x,0)',
  '0',

  'limit(sin(x)/x,x,infinity)',
  '0',

  'limit(exp(-x)*sin(x),x,inf)',
  '0',

  // no oscillation at all
  'limit(sin(x)/x,x,0)',
  '1',

  'limit(sin(1/x),x,inf)',
  '0',

  'limit(cos(1/x),x,inf)',
  '1',

  'limit(sin(x),x,0)',
  '0',

  'limit(sin(x),x,pi/2)',
  '1',

  // sin(2*pi*floor(x)) is 0 everywhere although the argument goes to inf
  'limit(sin(floor(x)*2*pi),x,inf)',
  '0',

  // a*sin(1/x) is 0 for a = 0, sin(a*x) is constant for a = 0: undecided
  'limit(a*sin(1/x),x,0)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  'limit(sin(a*x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",

  'assume(a>0)',
  '',

  'limit(sin(a*x),x,inf)',
  'Stop: limit: the limit does not exist: sin(a*x) oscillates',

  'limit(a*sin(1/x),x,0)',
  'Stop: limit: the limit does not exist: sin(1/x) oscillates',

  // other messages stay
  'limit(1/x,x,0)',
  'Stop: limit: left and right limits differ — limit does not exist',

  'limit(exp(b*x),x,inf)',
  "Stop: limit: could not resolve after repeated L'Hopital iterations",
]);

// 7. rank is the number of axes of a tensor, matrixrank the rank of a matrix
run_test([
  'rank([[1,2],[2,4]])',
  '2',

  'matrixrank([[1,2],[2,4]])',
  '1',

  'rank([1,2,3])',
  '1',

  'matrixrank([[1,0],[0,1]])',
  '2',
]);
