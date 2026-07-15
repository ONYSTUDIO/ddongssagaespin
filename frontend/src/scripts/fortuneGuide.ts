import '../styles/fortuneGuide.css';
import {
  setOnFortuneCookieOpenCallback,
  setOnFortuneCookieActionsCallback,
} from './fortuneCookie';

let active = false;
let clickHandler: ((e: MouseEvent) => void) | null = null;
let onGuideComplete: (() => void) | null = null;

export function isFortuneGuideActive(): boolean {
  return active;
}

export function hideFortuneGuide(): void {
  if (!active) return;
  active = false;

  const overlay = document.getElementById('fortuneGuideOverlay');
  const bubble  = document.getElementById('fortuneGuideBubble');

  if (overlay) {
    overlay.classList.remove('fortune-guide-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (clickHandler) {
      overlay.removeEventListener('click', clickHandler);
      clickHandler = null;
    }
  }
  bubble?.classList.remove('fortune-guide-bubble-open', 'fortune-guide-bubble--above-target');
  bubble?.setAttribute('aria-hidden', 'true');
}

function showGuide(
  targetEl: HTMLElement,
  bubbleText: string,
  onConfirm: () => void,
): void {
  hideFortuneGuide();

  const overlay = document.getElementById('fortuneGuideOverlay');
  const bubble  = document.getElementById('fortuneGuideBubble');
  if (!overlay || !bubble) return;

  active = true;

  const rect = targetEl.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const rx = rect.width  * 1.4;
  const ry = rect.height * 1.3;

  overlay.style.background =
    `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, ` +
    `transparent 0%, transparent 45%, rgba(0,0,0,0.88) 115%)`;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('fortune-guide-open');

  bubble.innerHTML = bubbleText.replace(/\n/g, '<br>');
  const bubbleHalfW = 160;
  const clampedX = Math.max(bubbleHalfW, Math.min(cx, window.innerWidth - bubbleHalfW));
  bubble.style.left = `${clampedX}px`;

  const isTopHalf = rect.top < window.innerHeight / 2;
  if (isTopHalf) {
    bubble.classList.add('fortune-guide-bubble--above-target');
    bubble.style.top    = `${rect.bottom + 16}px`;
    bubble.style.bottom = '';
  } else {
    bubble.classList.remove('fortune-guide-bubble--above-target');
    bubble.style.top    = '';
    bubble.style.bottom = `${window.innerHeight - rect.top + 16}px`;
  }

  bubble.setAttribute('aria-hidden', 'false');
  bubble.classList.add('fortune-guide-bubble-open');

  clickHandler = (e: MouseEvent) => {
    const r = targetEl.getBoundingClientRect();
    if (
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top  && e.clientY <= r.bottom
    ) {
      hideFortuneGuide();
      onConfirm();
    }
  };
  overlay.addEventListener('click', clickHandler);
}

// Step 1: 포춘쿠키 아이콘 가이드
// onComplete: 아이콘 클릭 확인 즉시 호출 (DB step 저장) — 이후 팝업 흐름과 무관하게 보장
export function showFortuneCookieIconGuide(onComplete?: () => void): void {
  onGuideComplete = onComplete ?? null;
  const btn = document.getElementById('metaBtnFortune');
  if (!btn) return;

  setOnFortuneCookieOpenCallback(() => showFortuneHammerGuide());

  showGuide(
    btn,
    '다른 똥싸개들이 전하는 운세를 확인하세요!',
    () => {
      // 아이콘 클릭 시점에 완료 처리 (이후 팝업이 limit/create로 분기돼도 보장)
      const cb = onGuideComplete;
      onGuideComplete = null;
      cb?.();
      btn.click();
    },
  );
}

// Step 2: 망치 가이드 (포춘쿠키 팝업 내부)
function showFortuneHammerGuide(): void {
  const btn = document.getElementById('fcHammerBtn');
  if (!btn) return;

  setOnFortuneCookieActionsCallback(() => showFortuneCreateGuide());

  showGuide(
    btn,
    '망치를 클릭해 포춘쿠키를 깨부수자!',
    () => btn.click(),
  );
}

// 도감 아이콘 가이드 (onboarding step 3 — 미니게임 신규 캐릭터 획득 경로)
export function showCodexGuide(onComplete?: () => void): void {
  const btn = document.getElementById('codexBtn');
  if (!btn) return;

  showGuide(
    btn,
    '새로운 똥싸개를 얻었어요!\n도감을 확인해보세요!',
    () => {
      onComplete?.();
      btn.click();
    },
  );
}

// 순위 아이콘 가이드 (onboarding step 4)
export function showRankingGuide(onComplete?: () => void): void {
  const btn = document.getElementById('metaBtnRanking');
  if (!btn) return;

  showGuide(
    btn,
    '다른 똥싸개들과 순위를 비교해 보세요!',
    () => {
      onComplete?.();
      btn.click();
    },
  );
}

// 미니게임 아이콘 가이드 (onboarding step 2)
export function showMinigameIconGuide(onComplete?: () => void): void {
  const btn = document.getElementById('metaBtnMinigame');
  if (!btn) return;

  showGuide(
    btn,
    '슬롯이 지루할 때 미니게임도 즐겨보아요!',
    () => {
      onComplete?.();
      btn.click();
    },
  );
}

// Step 3: 메세지 작성 버튼 가이드
function showFortuneCreateGuide(): void {
  const btn = document.getElementById('fcActionCreate');
  if (!btn) return;

  showGuide(
    btn,
    '다른 똥싸개들에게 전달할 메세지를 작성해보세요!',
    () => btn.click(),
  );
}
