const { rmSync } = require('fs');
const { join } = require('path');

rmSync(join(__dirname, '.next'), { recursive: true, force: true });
