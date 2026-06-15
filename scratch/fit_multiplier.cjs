// Let's fit the multiplier function to the three points:
// (417, 1.0031653)
// (388, 1.0071362)
// (287, 1.0120525)

const points = [
  { area: 417, m: 1.0031653 },
  { area: 388, m: 1.0071362 },
  { area: 287, m: 1.0120525 }
];

console.log("Points:", points);

// Let's test a linear fit: m = a * area + b
// Let's find a and b for points 1 and 3:
// 1.0031653 = a * 417 + b
// 1.0120525 = a * 287 + b
// Subtract: -0.0088872 = a * 130 => a = -0.000068363
// b = 1.0031653 - a * 417 = 1.03167
// Let's test this linear function for area = 388:
// m(388) = -0.000068363 * 388 + 1.03167 = 1.00514 (actual is 1.0071362, diff of 0.2%).
// Not a perfect linear fit.

// What if the function is: m = a * (1 / area) + b?
// 1.0031653 = a / 417 + b
// 1.0120525 = a / 287 + b
// Subtract: -0.0088872 = a * (1/417 - 1/287) = a * (-0.00108647)
// => a = 8.17988
// b = 1.0031653 - 8.17988 / 417 = 0.983549
// Let's test for area = 388:
// m(388) = 8.17988 / 388 + 0.983549 = 1.00463 (actual is 1.0071362).
// Not perfect either.

// Wait! What if the relationship is based on the RMT or the base percentage?
// Let's check:
// Point 1 (417m²): percMin = 0.70, baseMaoObra = 18%, eff = 17.755%
// Point 2 (388m²): percMin = 0.70, baseMaoObra = 14%, eff = 13.755%
// Point 3 (287m²): percMin = 0.50, baseMaoObra = 11%, eff = 10.755%

// Let's check if the multiplier is based on:
// totalRemun_competitor = (some base) corrected by month?
// Let's look at the competitor's monthly Remunerações:
// - 417m²: R$ 15.303,50
// - 388m²: R$ 8.881,26
// - 287m²: R$ 3.686,90

// Let's find a quadratic fit: m = a * area^2 + b * area + c
// Let's solve the system:
// 1. 417^2 * a + 417 * b + c = 1.0031653
// 2. 388^2 * a + 388 * b + c = 1.0071362
// 3. 287^2 * a + 287 * b + c = 1.0120525

// We can solve this exactly!
const A = [
  [417*417, 417, 1],
  [388*388, 388, 1],
  [287*287, 287, 1]
];
const B = [1.0031653, 1.0071362, 1.0120525];

// Solve using Cramer's rule or simple elimination:
function solve3x3(A, B) {
  const det = A[0][0]*(A[1][1]*A[2][2] - A[1][2]*A[2][1]) - A[0][1]*(A[1][0]*A[2][2] - A[1][2]*A[2][0]) + A[0][2]*(A[1][0]*A[2][1] - A[1][1]*A[2][0]);
  const detA = B[0]*(A[1][1]*A[2][2] - A[1][2]*A[2][1]) - A[0][1]*(B[1]*A[2][2] - A[1][2]*B[2]) + A[0][2]*(B[1]*A[2][1] - A[1][1]*B[2]);
  const detB = A[0][0]*(B[1]*A[2][2] - A[1][2]*B[2]) - B[0]*(A[1][0]*A[2][2] - A[1][2]*A[2][0]) + A[0][2]*(A[1][0]*B[2] - B[1]*A[2][0]);
  const detC = A[0][0]*(A[1][1]*B[2] - B[1]*A[2][1]) - A[0][1]*(A[1][0]*B[2] - B[1]*A[2][0]) + B[0]*(A[1][0]*A[2][1] - A[1][1]*A[2][0]);
  return [detA/det, detB/det, detC/det];
}

const [a, b, c] = solve3x3(A, B);
console.log(`Quadratic fit: a=${a.toExponential(6)}, b=${b.toExponential(6)}, c=${c.toFixed(6)}`);
for (const p of points) {
  const calc = a * p.area * p.area + b * p.area + c;
  console.log(`Area: ${p.area}, Actual: ${p.m.toFixed(7)}, Calc: ${calc.toFixed(7)}, Diff: ${(calc - p.m).toExponential(3)}`);
}
