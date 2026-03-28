import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const host = process.env.HOSTNAME || '127.0.0.1';
const port = process.env.PORT || '3200';
const shouldSkipBuild = process.env.SMOKE_SKIP_BUILD === '1';
const shouldMockProviders = process.env.SMOKE_PROVIDER_MOCKS === '1';
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

  const serverEnv = { ...process.env };

  if (shouldMockProviders) {
    const mockProviderUrl = pathToFileURL(
      path.resolve(process.cwd(), 'tests/helpers/mock-provider-fetch.mjs')
    ).href;
    const existingNodeOptions = serverEnv.NODE_OPTIONS ? `${serverEnv.NODE_OPTIONS} ` : '';
    serverEnv.NODE_OPTIONS = `${existingNodeOptions}--import=${mockProviderUrl}`.trim();
  }

  activeServer = spawn(
    process.execPath,
    [nextCliPath, 'start', '--hostname', host, '--port', port],
    {
      stdio: 'inherit',
      env: serverEnv,
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
