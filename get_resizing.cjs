const { execSync } = require('child_process');
const output = execSync('git log -S "resizing" -p -- src/components/circuit/CircuitCanvas.tsx', { encoding: 'utf-8' });
require('fs').writeFileSync('resizing_history.patch', output);
