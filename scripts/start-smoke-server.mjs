import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const host = process.env.HOSTNAME || '127.0.0.1';
const port = process.env.PORT || '3200';
const shouldSkipBuild = process.env.SMOKE_SKIP_BUILD === '1';
const require = createRequire(import.meta.url);
const nextCliPath = require.resolve('next/dist/bin/next');
let activeServer = null;

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}.`));
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function shutdown(signal = 'SIGTERM') {
  if (activeServer && !activeServer.killed) {
    activeServer.kill(signal);
  }
}

async function main() {
  if (!shouldSkipBuild) {
    await runCommand(process.execPath, [nextCliPath, 'build'], 'next build');
  }

  activeServer = spawn(
    process.execPath,
    [nextCliPath, 'start', '--hostname', host, '--port', port],
    {
      stdio: 'inherit',
      env: process.env,
    }
  );

  activeServer.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  activeServer.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
  process.on(signal, () => {
    shutdown(signal);
  });
}

main().catch((error) => {
  console.error(error);
  shutdown();
  process.exit(1);
});
