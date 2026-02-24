import { parseCircuitNotation } from './src/lib/circuitParser';
import * as util from 'util';

const res = parseCircuitNotation('R4//((R1//R2)ntR3)');
console.log(util.inspect(res, { depth: null, colors: true }));
