import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: '../dist/frontend',
  },
  server: {
    allowedHosts: true,
  }
});
