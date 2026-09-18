import { run_test } from '../test-harness';

// norm, jacobian and friends, the matrix decompositions and exp of a matrix
// (sources/linalg.ts), and the speed of irrational eigenvalues
run_test([
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
]);
