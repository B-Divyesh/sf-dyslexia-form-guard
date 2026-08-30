import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

const previewUrl = 'http://127.0.0.1:4173';

function runNpm(args) {
  execFileSync('npm', args, { stdio: 'inherit' });
}

async function waitForPreview(process) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) throw new Error(`Vite preview exited before it was ready (${process.exitCode}).`);
    try {
      const response = await fetch(previewUrl);
      if (response.ok) return;
    } catch {
      // The server has not bound the loopback port yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error('Timed out waiting for the built static site preview.');
}

export async function withPreview(check) {
  runNpm(['run', 'build']);
  const vite = spawn(resolve('node_modules/.bin/vite'), ['preview', '--config', 'vite.site.config.ts', '--host', '127.0.0.1', '--port', '4173'], {
    stdio: 'inherit'
  });
  try {
    await waitForPreview(vite);
    await check(previewUrl);
  } finally {
    if (vite.exitCode === null) {
      const exited = once(vite, 'exit');
      vite.kill('SIGTERM');
      await exited;
    }
  }
}
