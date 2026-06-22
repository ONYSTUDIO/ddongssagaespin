import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: '../dist/frontend',
  },
  server: {
    host: true,        // 모든 네트워크 인터페이스에 바인딩 (모바일 접속 허용)
    allowedHosts: true,
  }
});
