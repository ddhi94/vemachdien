const { execSync } = require('child_process');
const output = execSync('git log -p -n 3 -- src/components/circuit/CircuitCanvas.tsx', { encoding: 'utf-8' });
console.log(output.substring(0, 5000));
