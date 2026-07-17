import '../styles/fortuneGuide.css';
import {
  setOnFortuneCookieOpenCallback,
  setOnFortuneCookieActionsCallback,
  setOnFortuneCookieCreateCloseCallback,
} from './fortuneCookie';

let active = false;
let blocked = false;
let clickHandler: ((e: MouseEvent) => void) | null = null;
let onGuideComplete: (() => void) | null = null;
let onFortuneChainDone: (() => void) | null = null;

export function setFortuneGuidesBlocked(v: boolean): void {
  blocked = v;
  if (v) hideFortuneGuide();
}

export function setOnFortuneChainDoneCallback(cb: () => void): void {
  onFortuneChainDone = cb;
}

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
  if (bubble) {
    bubble.classList.remove(
      'fortune-guide-bubble-open',
      'fortune-guide-bubble--above-target',
      'fortune-guide-bubble--tail-left',
      'fortune-guide-bubble--tail-right',
    );
    bubble.style.transform = '';
    bubble.style.right = '';
  }
  bubble?.setAttribute('aria-hidden', 'true');
}

function applyGuideLayout(
  targetEl: HTMLElement,
  overlay: HTMLElement,
  bubble: HTMLElement,
  bubbleText: string,
  position: 'above' | 'below',
): void {
  const rect = targetEl.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const rx = Math.max(60, rect.width  * 1.4);
  const ry = Math.max(60, rect.height * 1.3);

  overlay.style.background =
    `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, ` +
    `transparent 0%, transparent 45%, rgba(0,0,0,0.88) 115%)`;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('fortune-guide-open');

  bubble.innerHTML = bubbleText.replace(/\n/g, '<br>');

  // 이전 방향 클래스 초기화
  bubble.classList.remove(
    'fortune-guide-bubble--above-target',
    'fortune-guide-bubble--tail-left',
    'fortune-guide-bubble--tail-right',
  );

  // 화면 존 판별: 좌/우 30% 안에 있으면 말풍선을 옆에 배치
  const leftZone  = cx < window.innerWidth * 0.30;
  const rightZone = cx > window.innerWidth * 0.70;

  if (leftZone) {
    // 말풍선을 타겟 오른쪽에 배치, 꼬리 왼쪽
    bubble.classList.add('fortune-guide-bubble--tail-left');
    const clampedCy = Math.max(40, Math.min(cy, window.innerHeight - 40));
    bubble.style.left      = `${rect.right + 16}px`;
    bubble.style.right     = 'auto';
    bubble.style.top       = `${clampedCy}px`;
    bubble.style.bottom    = '';
    bubble.style.transform = 'translateY(-50%)';
  } else if (rightZone) {
    // 말풍선을 타겟 왼쪽에 배치, 꼬리 오른쪽
    bubble.classList.add('fortune-guide-bubble--tail-right');
    const clampedCy = Math.max(40, Math.min(cy, window.innerHeight - 40));
    bubble.style.left      = 'auto';
    bubble.style.right     = `${window.innerWidth - rect.left + 16}px`;
    bubble.style.top       = `${clampedCy}px`;
    bubble.style.bottom    = '';
    bubble.style.transform = 'translateY(-50%)';
  } else if (position === 'below') {
    // 중앙 하단 요소: 말풍선을 타겟 아래에 배치
    bubble.classList.add('fortune-guide-bubble--above-target');
    bubble.style.left      = `${cx}px`;
    bubble.style.right     = 'auto';
    bubble.style.top       = `${rect.bottom + 16}px`;
    bubble.style.bottom    = '';
    bubble.style.transform = '';
  } else {
    // 중앙 상단 요소: 말풍선을 타겟 위에 배치
    const bubbleHalfW = Math.min(160, (window.innerWidth - 32) / 2);
    const clampedX = Math.max(bubbleHalfW, Math.min(cx, window.innerWidth - bubbleHalfW));
    bubble.style.left      = `${clampedX}px`;
    bubble.style.right     = 'auto';
    bubble.style.top       = '';
    bubble.style.bottom    = `${window.innerHeight - rect.top + 16}px`;
    bubble.style.transform = '';
  }

  bubble.setAttribute('aria-hidden', 'false');
  bubble.classList.add('fortune-guide-bubble-open');
}

function showGuide(
  targetEl: HTMLElement,
  bubbleText: string,
  onConfirm: () => void,
  position: 'above' | 'below' = 'above',
): void {
  if (blocked) return;
  hideFortuneGuide();

  const overlay = document.getElementById('fortuneGuideOverlay');
  const bubble  = document.getElementById('fortuneGuideBubble');
  if (!overlay || !bubble) return;

  active = true;

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

  const rect = targetEl.getBoundingClientRect();
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (!inView) {
    // 타겟이 뷰포트 밖 → 중앙 정렬 즉시 스크롤 후 좌표 재계산
    // block:'center'로 슬롯 머신 하단과의 겹침 방지, 타이밍 이슈 제거
    targetEl.scrollIntoView({ block: 'center' });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!active) return;
      applyGuideLayout(targetEl, overlay, bubble, bubbleText, position);
    }));
  } else {
    applyGuideLayout(targetEl, overlay, bubble, bubbleText, position);
  }
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
    '새로운 똥싸개를 얻었네요?\n도감을 확인해보세요!',
    () => {
      onComplete?.();
      btn.click();
    },
    'below',
  );
}

// 순위 아이콘 가이드 (onboarding step 4)
export function showRankingGuide(onComplete?: () => void): void {
  const btn = document.getElementById('metaBtnRanking');
  if (!btn) return;

  showGuide(
    btn,
    '오늘 나의 운세 순위를 확인해보세요!',
    () => {
      onComplete?.();
      btn.click();
    },
  );
}

// 프로필 아이콘 가이드 (onboarding step 5)
export function showProfileGuide(onComplete?: () => void): void {
  const btn = document.getElementById('hudProfileBtn');
  if (!btn) return;

  showGuide(
    btn,
    '프로필 사진을 확인하고\n닉네임을 설정해 보세요!',
    () => {
      onComplete?.();
      btn.click();
    },
    'below',
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
    () => {
      // 메세지 작성 팝업이 닫힌 뒤 체인 완료 (미니게임 가이드와 겹치지 않도록)
      setOnFortuneCookieCreateCloseCallback(() => {
        const cb = onFortuneChainDone;
        onFortuneChainDone = null;
        cb?.();
      });
      btn.click();
    },
  );
}
