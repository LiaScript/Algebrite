import { run_test } from '../test-harness';

run_test([
  // float(x, n) with heavy cancellation: the precision is raised until two
  // runs agree. sin(10^22) = -0.85220084976718880177270589375303...
  'float(sin(10^22),30)',
  '-0.852200849767188801772705893753',

  // exp(100)-exp(100)+1/3: the difference of two huge numbers
  'float(exp(100)+1/3-exp(100),20)',
  '0.33333333333333333333',

  // Gamma(1/3) = 2.67893853470774763365569294097 4677... (mpmath)
  'float(Gamma(1/3),30)',
  '2.67893853470774763365569294097',

  'float(Gamma(5),10)',
  '24.00000000',

  // Gamma(-1/2) = -2*sqrt(pi) = -3.5449077018110320546
  'float(Gamma(-1/2),20)',
  '-3.5449077018110320546',

  // erf(1) = 0.842700792949714869341220635082 60...
  'float(erf(1),30)',
  '0.842700792949714869341220635083',

  // erf(1/2) = 0.52049987781304653768 27...
  'float(erf(1/2),20)',
  '0.52049987781304653768',

  // erfc(1) = 1-erf(1) = 0.15729920705028513066
  'float(erfc(1),20)',
  '0.15729920705028513066',

  // norm: Euclidean for vectors, Frobenius for matrices
  'norm([3,4])',
  '5',

  'norm([1,2,2])',
  '3',

  'norm([a,b])',
  '(a^2+b^2)^(1/2)',

  'norm([3,4*i])',
  '5',

  // sqrt(1+4+9+16)
  'norm([[1,2],[3,4]])',
  '2^(1/2)*3^(1/2)*5^(1/2)',

  'norm([1,2,3]/norm([1,2,3]))',
  '1',

  'jacobian([x*y,x+y],[x,y])',
  '[[y,x],[1,1]]',

  'gradient(x^2+y^2,[x,y])',
  '[2*x,2*y]',

  'hessian(x^2*y,[x,y])',
  '[[2*y,2*x],[2*x,0]]',

  'laplacian(x^2+y^2,[x,y])',
  '4',

  // harmonic: the real part of (x+i*y)^3
  'laplacian(x^3-3*x*y^2,[x,y])',
  '0',

  // r*cos(t)^2 + r*sin(t)^2
  'simplify(det(jacobian([r*cos(t),r*sin(t)],[r,t])))',
  'r',

  // lu(A) = [L,U,P] with P*A = L*U
  'lu([[4,3],[6,3]])',
  '[[[1,0],[3/2,1]],[[4,3],[0,-3/2]],[[1,0],[0,1]]]',

  'A=[[4,3],[6,3]]',
  '',

  'F=lu(A)',
  '',

  'dot(F[1],F[2])-dot(F[3],A)',
  '[[0,0],[0,0]]',

  // a zero pivot needs a row swap
  'lu([[0,1],[2,3]])',
  '[[[1,0],[0,1]],[[2,3],[0,1]],[[0,1],[1,0]]]',

  'lu([[1,2],[2,4]])',
  'Stop: lu: the matrix is singular',

  // qr(A) = [Q,R] by Gram-Schmidt: columns (3,4) and (0,5)
  'qr([[3,0],[4,5]])',
  '[[[3/5,-4/5],[4/5,3/5]],[[5,4],[0,3]]]',

  'B=[[1,1],[1,2]]',
  '',

  'G=qr(B)',
  '',

  // simplify gives a zero matrix as 0
  'simplify(dot(G[1],G[2])-B)',
  '0',

  'simplify(dot(transpose(G[1]),G[1]))',
  '[[1,0],[0,1]]',

  // cholesky(A) = L with L*transpose(L) = A
  'cholesky([[4,2],[2,3]])',
  '[[2,0],[1,2^(1/2)]]',

  'cholesky([[1,2],[2,1]])',
  'Stop: cholesky: the matrix is not positive definite',

  // the matrix exponential: nilpotent, diagonal, symmetric
  'exp([[0,1],[0,0]])',
  '[[1,1],[0,1]]',

  'exp([[1,0],[0,2]])',
  '[[e,0],[0,exp(2)]]',

  'exp([[0,0],[0,0]])',
  '[[1,0],[0,1]]',

  // [[cosh(1),sinh(1)],[sinh(1),cosh(1)]]
  'float(exp([[0,1],[1,0]]))',
  '[[1.543081...,1.175201...],[1.175201...,1.543081...]]',

  // lists
  'length([1,2,3])',
  '3',

  'length([[1,2],[3,4],[5,6]])',
  '3',

  'length(5)',
  '1',

  'append([1,2],[3])',
  '[1,2,3]',

  'append([1,2],3)',
  '[1,2,3]',

  'append([1],[2],[3,4])',
  '[1,2,3,4]',

  'sort([3,1,2])',
  '[1,2,3]',

  'sort([pi,3,sqrt(2),-1/2])',
  '[-1/2,2^(1/2),3,pi]',

  'sort([b,a,c])',
  '[a,b,c]',

  'range(1,5)',
  '[1,2,3,4,5]',

  'range(0,1,1/4)',
  '[0,1/4,1/2,3/4,1]',

  'range(5,1,-2)',
  '[5,3,1]',

  'range(3)',
  '[1,2,3]',

  'table(k^2,k,1,5)',
  '[1,4,9,16,25]',

  'table(x^k,k,0,3)',
  '[1,x,x^2,x^3]',

  'sq(x)=x^2',
  '',

  'map(sq,[1,2,3])',
  '[1,4,9]',

  'map(sin,[0,pi/2])',
  '[0,1]',

  'map(sq,range(1,4))',
  '[1,4,9,16]',

  'sum(k,k,1,length([7,8,9]))',
  '6',

  // if is test: conditions and values in pairs, an optional default last
  'if(1<2,a,b)',
  'a',

  'if(1>2,a,b)',
  'b',

  'sg(x)=if(x>0,1,x<0,-1,0)',
  '',

  'map(sg,[-2,0,3])',
  '[-1,0,1]',

  // a semicolon separates statements like a line break
  'a1=1;b1=2;a1+b1',
  '3',

  'x1=2; x1^10',
  '1024',

  // irrational eigenvalues of a 3x3 matrix: the three real roots of
  // x^3-16*x^2-12*x+3 (casus irreducibilis, complex radicals). These used to
  // take 14 s in a hopeless attempt to denest the cube roots.
  // trace 16 and determinant -3 are the sum and product of the eigenvalues
  'M=[[1,2,3],[4,5,6],[7,8,10]]',
  '',

  'v=eigenvalues(M)',
  '',

  'abs(float(v[1]+v[2]+v[3])-16)<10^(-9)',
  '1',

  'abs(float(v[1]*v[2]*v[3])+3)<10^(-9)',
  '1',

  // 0.198247, 16.707493 and -0.905740 up to rounding in the imaginary part
  'abs(float(v[2])-16.707493)<10^(-5)',
  '1',

  // denesting still works where it can: (2+11*i)^(1/3) = 2+i
  'simplify((2+11*i)^(1/3))',
  '2+i',

  'simplify((7+5*2^(1/2))^(1/3))',
  '1+2^(1/2)',

  'simplify(sqrt(3+2*sqrt(2)))',
  '1+2^(1/2)',
]);
