import '../styles/spinGuide.css';

const GUIDE_KEY = 'ddong_spin_guide_shown';

let active = false;
let blocked = false;
let clickHandler: ((e: MouseEvent) => void) | null = null;
let confirmedFromGuide = false;

export function setSpinGuideBlocked(v: boolean): void {
  blocked = v;
  if (v) hideSpinGuide();
}

// 가이드에서 스핀 버튼을 클릭해 진입했는지 여부를 소비 방식으로 반환
export function consumeSpinGuideConfirm(): boolean {
  const val = confirmedFromGuide;
  confirmedFromGuide = false;
  return val;
}

export function hasSeenSpinGuide(): boolean {
  return localStorage.getItem(GUIDE_KEY) === 'true';
}

export function isSpinGuideActive(): boolean {
  return active;
}

function applySpinGuideLayout(
  btn: HTMLElement,
  overlay: HTMLElement,
  bubble: HTMLElement,
): void {
  const rect = btn.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  const rx   = rect.width  * 1.2;
  const ry   = rect.height * 1.0;

  overlay.style.background =
    `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, ` +
    `transparent 0%, transparent 45%, rgba(0,0,0,0.88) 115%)`;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('spin-guide-open');

  bubble.style.left   = `${cx}px`;
  bubble.style.bottom = `${window.innerHeight - rect.top + 16}px`;
  bubble.setAttribute('aria-hidden', 'false');
  bubble.classList.add('spin-guide-bubble-open');
}

export function showSpinGuide(): void {
  if (blocked || active) return;

  const overlay = document.getElementById('spinGuideOverlay');
  const bubble  = document.getElementById('spinGuideBubble');
  const btn     = document.getElementById('spinBtn');
  if (!overlay || !bubble || !btn) return;

  active = true;

  // 오버레이 클릭 시 스핀 버튼 영역이면 가이드 해제 + 스핀 실행
  clickHandler = (e: MouseEvent) => {
    const r2 = btn.getBoundingClientRect();
    if (
      e.clientX >= r2.left && e.clientX <= r2.right &&
      e.clientY >= r2.top  && e.clientY <= r2.bottom
    ) {
      confirmedFromGuide = true;
      hideSpinGuide();
      btn.click();
    }
  };
  overlay.addEventListener('click', clickHandler);

  const rect = btn.getBoundingClientRect();
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (!inView) {
    // 스핀 버튼이 뷰포트 밖 → 스크롤 후 좌표 재계산
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
      if (!active) return;
      applySpinGuideLayout(btn, overlay, bubble);
    }, 400);
  } else {
    applySpinGuideLayout(btn, overlay, bubble);
  }
}

export function hideSpinGuide(): void {
  if (!active) return;
  active = false;

  const overlay = document.getElementById('spinGuideOverlay');
  const bubble  = document.getElementById('spinGuideBubble');

  if (overlay) {
    overlay.classList.remove('spin-guide-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (clickHandler) {
      overlay.removeEventListener('click', clickHandler);
      clickHandler = null;
    }
  }

  bubble?.classList.remove('spin-guide-bubble-open');
  bubble?.setAttribute('aria-hidden', 'true');

  localStorage.setItem(GUIDE_KEY, 'true');
}
