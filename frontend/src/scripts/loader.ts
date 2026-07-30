import '../styles/loader.css';
import jjajang1Src from '../assets/images/meta/support_gift/jjajang_1.png';
import jjajang2Src from '../assets/images/meta/support_gift/jjajang_2.png';

let loaderEl: HTMLDivElement | null = null;
let barEl: HTMLDivElement | null = null;
let pctEl: HTMLSpanElement | null = null;

function ensureLoader(): HTMLDivElement {
  if (loaderEl) return loaderEl;
  const el = document.createElement('div');
  el.className = 'game-loader';

  const inner = document.createElement('div');
  inner.className = 'game-loader-inner';

  // 움짤 이미지
  const animWrap = document.createElement('div');
  animWrap.className = 'game-loader-anim';

  const img1 = document.createElement('img');
  img1.className = 'game-loader-anim-img game-loader-anim-img--1';
  img1.src = jjajang1Src;
  img1.alt = '';

  const img2 = document.createElement('img');
  img2.className = 'game-loader-anim-img game-loader-anim-img--2';
  img2.src = jjajang2Src;
  img2.alt = '';

  animWrap.appendChild(img1);
  animWrap.appendChild(img2);

  const title = document.createElement('div');
  title.className = 'game-loader-title';
  title.textContent = '게임 준비 중...';

  const track = document.createElement('div');
  track.className = 'game-loader-track';

  barEl = document.createElement('div');
  barEl.className = 'game-loader-bar';
  track.appendChild(barEl);

  pctEl = document.createElement('span');
  pctEl.className = 'game-loader-pct';
  pctEl.textContent = '0%';

  inner.appendChild(animWrap);
  inner.appendChild(title);
  inner.appendChild(track);
  inner.appendChild(pctEl);
  el.appendChild(inner);
  document.body.appendChild(el);
  loaderEl = el;
  return el;
}

export function showLoader(): void {
  const el = ensureLoader();
  el.classList.remove('game-loader--out');
  setLoaderProgress(0);
}

export function setLoaderProgress(pct: number): void {
  const p = Math.min(100, Math.max(0, Math.round(pct)));
  if (barEl) barEl.style.width = `${p}%`;
  if (pctEl) pctEl.textContent = `${p}%`;
}

export function hideLoader(): Promise<void> {
  return new Promise(resolve => {
    if (!loaderEl) { resolve(); return; }
    const el = loaderEl;
    el.classList.add('game-loader--out');
    setTimeout(() => {
      el.remove();
      if (loaderEl === el) { loaderEl = null; barEl = null; pctEl = null; }
      resolve();
    }, 450);
  });
}

export function preloadImages(srcs: string[], onEach?: () => void): Promise<void> {
  return Promise.allSettled(
    srcs.map(src => new Promise<void>(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => { onEach?.(); resolve(); };
      img.src = src;
    }))
  ).then(() => {});
}
