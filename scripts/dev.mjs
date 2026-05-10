import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const electronViteBin = resolve(root, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js');
const env = { ...process.env };

delete env.ELECTRON_RUN_AS_NODE;

if (process.argv.includes('--force-update-check')) {
  env.RADIOSS_FORCE_UPDATE_CHECK = 'true';
}

const child = spawn(process.execPath, [electronViteBin, 'dev'], {
  cwd: root,
  env,
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
