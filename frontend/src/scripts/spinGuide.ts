import '../styles/spinGuide.css';

const GUIDE_KEY = 'ddong_spin_guide_shown';

let active = false;
let clickHandler: ((e: MouseEvent) => void) | null = null;

export function hasSeenSpinGuide(): boolean {
  return localStorage.getItem(GUIDE_KEY) === 'true';
}

export function isSpinGuideActive(): boolean {
  return active;
}

export function showSpinGuide(): void {
  if (active) return;

  const overlay = document.getElementById('spinGuideOverlay');
  const bubble  = document.getElementById('spinGuideBubble');
  const btn     = document.getElementById('spinBtn');
  if (!overlay || !bubble || !btn) return;

  active = true;

  const rect = btn.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  const rx   = rect.width  * 1.2;
  const ry   = rect.height * 1.0;

  // 스핀 버튼 위치에 투명 원형 spotlight, 주변은 어둡게
  overlay.style.background =
    `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, ` +
    `transparent 0%, transparent 45%, rgba(0,0,0,0.88) 115%)`;

  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('spin-guide-open');

  // 말풍선: 스핀 버튼 위에 고정
  bubble.style.left   = `${cx}px`;
  bubble.style.bottom = `${window.innerHeight - rect.top + 16}px`;
  bubble.setAttribute('aria-hidden', 'false');
  bubble.classList.add('spin-guide-bubble-open');

  // 오버레이 클릭 시 스핀 버튼 영역이면 가이드 해제 + 스핀 실행
  clickHandler = (e: MouseEvent) => {
    const r2 = btn.getBoundingClientRect();
    if (
      e.clientX >= r2.left && e.clientX <= r2.right &&
      e.clientY >= r2.top  && e.clientY <= r2.bottom
    ) {
      hideSpinGuide();
      btn.click();
    }
  };
  overlay.addEventListener('click', clickHandler);
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
