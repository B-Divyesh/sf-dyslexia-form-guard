import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site',
  publicDir: resolve(process.cwd(), 'public'),
  build: {
    outDir: resolve(process.cwd(), 'dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), 'site/index.html'),
        privacy: resolve(process.cwd(), 'site/privacy/index.html'),
        terms: resolve(process.cwd(), 'site/terms/index.html'),
        lab: resolve(process.cwd(), 'site/lab/index.html')
      }
    }
  }
});
