/**
 * Hosting appends --port= / --host= ; Next only accepts -H / --hostname.
 */
const { spawn } = require('child_process');
const { join } = require('path');

function arg(name) {
  const eq = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(eq));
  if (hit) return hit.slice(eq.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('-')) {
    return process.argv[idx + 1];
  }
  return undefined;
}

const port = arg('port') ?? '3000';
const host = arg('host') ?? arg('hostname') ?? '0.0.0.0';
const nextBin = join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', String(host)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
