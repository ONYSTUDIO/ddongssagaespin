import { defineConfig, Plugin } from 'vite';
// @ts-ignore — vite-plugin-imagemin has no bundled types
import viteImagemin from 'vite-plugin-imagemin';

// 로그인 화면에서 가장 먼저 필요한 이미지들을 <link rel="preload"> 로 주입
// → JS 파싱 전에 브라우저가 미리 받기 시작해 체감 로딩 속도 개선
const LOGIN_IMAGE_PATTERNS = ['pop_login_bg_2', 'main_corgi', 'login_button', 'input_bg'];

function preloadLoginImagesPlugin(): Plugin {
  const preloadPaths: string[] = [];

  return {
    name: 'preload-login-images',
    generateBundle(_, bundle) {
      preloadPaths.length = 0;
      for (const filename of Object.keys(bundle)) {
        if (!/\.png$/i.test(filename)) continue;
        const base = (filename.split('/').pop() ?? '').replace(/-[A-Za-z0-9_-]+\.png$/, '');
        if (LOGIN_IMAGE_PATTERNS.includes(base)) {
          preloadPaths.push(filename);
        }
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (preloadPaths.length === 0) return html;
        const tags = preloadPaths
          .map(f => `  <link rel="preload" as="image" href="/${f}">`)
          .join('\n');
        return html.replace('</head>', `${tags}\n</head>`);
      },
    },
  };
}

export default defineConfig({
  root: '.',
  build: {
    outDir: '../dist/frontend',
  },
  server: {
    host: true,        // 모든 네트워크 인터페이스에 바인딩 (모바일 접속 허용)
    allowedHosts: true,
  },
  plugins: [
    preloadLoginImagesPlugin(),
    viteImagemin({
      pngquant: { quality: [0.70, 0.85], speed: 1 },
    }),
  ],
});
