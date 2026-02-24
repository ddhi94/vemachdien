const fs = require('fs');
const { execSync } = require('child_process');
const output = execSync('git show 74b6b25:src/components/circuit/CircuitCanvas.tsx');
fs.writeFileSync('oldCanvas.tsx', output);
