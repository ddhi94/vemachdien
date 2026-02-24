import * as fs from 'fs';
import * as util from 'util';

const code = fs.readFileSync('src/lib/circuitParser.ts', 'utf8');
const cleanCode = code.replace(/import .*/g, '').replace(/export /g, '');
const testCode = cleanCode + `
const res = parseCircuitNotation('R4//((R1//R2)ntR3)');
console.log(util.inspect(res, { depth: null, colors: true }));
`;
fs.writeFileSync('temp_test.ts', testCode);
