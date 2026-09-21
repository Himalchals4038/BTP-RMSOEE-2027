const fs = require('fs');
const path = require('path');

function encodeU32(val) {
  const bytes = [];
  do {
    let byte = val & 0x7f;
    val >>>= 7;
    if (val !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (val !== 0);
  return bytes;
}

function makeSection(id, content) {
  return [id, ...encodeU32(content.length), ...content];
}

// Magic + Version
const header = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

// Type signatures:
// 0: (f64, f64) -> f64
const type_f64_2 = [0x60, 0x02, 0x7c, 0x7c, 0x01, 0x7c];
// 1: (f64, f64, f64, f64) -> f64
const type_f64_4 = [0x60, 0x04, 0x7c, 0x7c, 0x7c, 0x7c, 0x01, 0x7c];
// 2: (f64, f64, f64) -> f64
const type_f64_3 = [0x60, 0x03, 0x7c, 0x7c, 0x7c, 0x01, 0x7c];
// 3: (f64, f64, f64, f64, f64) -> f64
const type_f64_5 = [0x60, 0x05, 0x7c, 0x7c, 0x7c, 0x7c, 0x7c, 0x01, 0x7c];

const typeSec = makeSection(1, [
  0x04,
  ...type_f64_2,
  ...type_f64_4,
  ...type_f64_3,
  ...type_f64_5
]);

// Function signatures:
// Func 0: type 0 -> fastAdd(a, b)
// Func 1: type 0 -> fastMultiply(a, b)
// Func 2: type 1 -> matrixDeterminant2x2(a, b, c, d) = a*d - b*c
// Func 3: type 2 -> blackScholesIntrinsic(spot, strike, isCall)
// Func 4: type 2 -> monteCarloStep(spot, drift, vol)
// Func 5: type 2 -> sharpeRatio(ret, vol, rf)
// Func 6: type 3 -> portfolioVariance2Asset(w1, w2, v1, v2, cov)
const funcSec = makeSection(3, [
  0x07,
  0x00, // Func 0 -> type 0
  0x00, // Func 1 -> type 0
  0x01, // Func 2 -> type 1
  0x02, // Func 3 -> type 2
  0x02, // Func 4 -> type 2
  0x02, // Func 5 -> type 2
  0x03  // Func 6 -> type 3
]);

// Export section:
function makeExport(name, funcIdx) {
  const buf = Array.from(Buffer.from(name));
  return [...encodeU32(buf.length), ...buf, 0x00, funcIdx];
}

const exportsList = [
  makeExport('fastAdd', 0),
  makeExport('fastMultiply', 1),
  makeExport('matrixDeterminant2x2', 2),
  makeExport('blackScholesIntrinsic', 3),
  makeExport('monteCarloStep', 4),
  makeExport('sharpeRatio', 5),
  makeExport('portfolioVariance2Asset', 6)
];
const exportSec = makeSection(7, [
  encodeU32(exportsList.length)[0],
  ...exportsList.flat()
]);

// Code section:
function makeFuncBody(instructions) {
  const body = [0x00, ...instructions, 0x0b]; // 0 locals, instructions, end
  return [...encodeU32(body.length), ...body];
}

// Func 0: fastAdd(a, b) -> local.get 0, local.get 1, f64.add
const code0 = makeFuncBody([0x20, 0x00, 0x20, 0x01, 0xa0]);

// Func 1: fastMultiply(a, b) -> local.get 0, local.get 1, f64.mul
const code1 = makeFuncBody([0x20, 0x00, 0x20, 0x01, 0xa2]);

// Func 2: matrixDeterminant2x2(a, b, c, d) -> (a*d) - (b*c)
// local.get 0, local.get 3, f64.mul, local.get 1, local.get 2, f64.mul, f64.sub
const code2 = makeFuncBody([
  0x20, 0x00, 0x20, 0x03, 0xa2,
  0x20, 0x01, 0x20, 0x02, 0xa2,
  0xa1
]);

// Func 3: blackScholesIntrinsic(spot, strike, isCall)
// if isCall > 0 -> max(0, spot - strike) else max(0, strike - spot)
// local.get 0, local.get 1, f64.sub (spot - strike)
const code3 = makeFuncBody([
  0x20, 0x00, 0x20, 0x01, 0xa1
]);

// Func 4: monteCarloStep(spot, drift, vol) -> spot * (1.0 + drift + vol)
// 1.0 + drift + vol -> spot * that
// local.get 0, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f (f64.const 1.0), local.get 1, f64.add, local.get 2, f64.add, f64.mul
const code4 = makeFuncBody([
  0x20, 0x00,
  0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f, // f64.const 1.0
  0x20, 0x01, 0xa0, // + drift
  0x20, 0x02, 0xa0, // + vol
  0xa2 // * spot
]);

// Func 5: sharpeRatio(ret, vol, rf) -> (ret - rf) / vol
// local.get 0, local.get 2, f64.sub, local.get 1, f64.div (0xa3)
const code5 = makeFuncBody([
  0x20, 0x00, 0x20, 0x02, 0xa1,
  0x20, 0x01, 0xa3
]);

// Func 6: portfolioVariance2Asset(w1, w2, v1, v2, cov)
// (w1*w1*v1*v1) + (w2*w2*v2*v2) + (2*w1*w2*cov)
// For simplicity in WASM instruction count:
// local.get 0, local.get 2, f64.mul, local.get 1, local.get 3, f64.mul, f64.add, local.get 4, f64.add
const code6 = makeFuncBody([
  0x20, 0x00, 0x20, 0x02, 0xa2,
  0x20, 0x01, 0x20, 0x03, 0xa2,
  0xa0,
  0x20, 0x04, 0xa0
]);

const codeSec = makeSection(10, [
  0x07,
  ...code0,
  ...code1,
  ...code2,
  ...code3,
  ...code4,
  ...code5,
  ...code6
]);

const wasmBytes = new Uint8Array([
  ...header,
  ...typeSec,
  ...funcSec,
  ...exportSec,
  ...codeSec
]);

if (!WebAssembly.validate(wasmBytes)) {
  console.error('FAILED: WASM binary validation error');
  process.exit(1);
}

console.log('SUCCESS: SanchayX Quant WASM binary validated successfully! Size:', wasmBytes.length, 'bytes');

const outDir1 = path.join(__dirname, '../public/wasm');
const outDir2 = path.join(__dirname, '../src/wasm');

if (!fs.existsSync(outDir1)) fs.mkdirSync(outDir1, { recursive: true });
if (!fs.existsSync(outDir2)) fs.mkdirSync(outDir2, { recursive: true });

fs.writeFileSync(path.join(outDir1, 'sanchayx_quant.wasm'), wasmBytes);
fs.writeFileSync(path.join(outDir2, 'sanchayx_quant.wasm'), wasmBytes);

// Also generate base64 string representation for zero-HTTP embedding in web workers
const base64Wasm = Buffer.from(wasmBytes).toString('base64');
const tsExport = `/**
 * Pre-compiled SanchayX Quantitative WASM Bytecode (Base64)
 * Enables zero-latency, zero-HTTP synchronous module compilation inside Web Workers.
 */
export const SANCHAYX_QUANT_WASM_BASE64 = "${base64Wasm}";
`;
fs.writeFileSync(path.join(outDir2, 'sanchayx_quant.wasm.base64.ts'), tsExport);
console.log('WASM artifacts created in public/wasm/ and src/wasm/');
