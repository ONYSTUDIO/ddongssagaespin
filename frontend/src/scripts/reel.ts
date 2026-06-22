import { getRandomItem, SlotItem, SLOT_ITEMS } from './game';

const STRIP_LENGTH = 25;
export const WIN_IDX = 3;  // 스트립 앞쪽 배치 — 끝에서 앞으로 스크롤(위→아래 방향)

function buildStrip(stripEl: HTMLElement, finalItem: SlotItem, cellH: number, length = STRIP_LENGTH): void {
  stripEl.innerHTML = '';
  for (let i = 0; i < length; i++) {
    const item = i === WIN_IDX ? finalItem : getRandomItem();
    const img = document.createElement('img');
    img.className = 'reel-symbol';
    img.style.height = cellH + 'px';
    img.src = item.src;
    img.alt = item.id;
    stripEl.appendChild(img);
  }
}

// 페이지 로드 시 각 릴에 랜덤 3개 심볼 표시
export function initReel(reelEl: HTMLElement): void {
  const stripEl = reelEl.querySelector('.reel-strip') as HTMLElement;
  const cellH = reelEl.offsetHeight / 3;
  stripEl.style.transform = '';
  stripEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const item = getRandomItem();
    const img = document.createElement('img');
    img.className = 'reel-symbol';
    img.style.height = cellH + 'px';
    img.src = item.src;
    img.alt = item.id;
    stripEl.appendChild(img);
  }
}

// 릴 스핀 애니메이션
// - 선형 구간: 모든 릴 동일 속도 (baseDuration 기준). suspenseMs만큼 스트립을 연장해 더 돌림
// - 급감속 5% + 감쇠 바운스 25%는 baseDuration 고정
export function animateReel(
  reelEl: HTMLElement,
  duration: number,
  finalItem: SlotItem,
  callback: (item: SlotItem) => void,
  suspenseMs = 0
): void {
  const stripEl = reelEl.querySelector('.reel-strip') as HTMLElement;
  const cellH = reelEl.offsetHeight / 3;

  const targetY       = -(WIN_IDX - 1) * cellH;
  const beforeTargetY = targetY - 1.5 * cellH;
  const bounceAmp     = cellH * 1.5;

  // 모든 릴 공통 기준 속도 (duration 기반)
  const linearBaseMs = duration * 0.70;
  const decelMs      = duration * 0.05;
  const bounceMs     = duration * 0.25;

  const baseStartY   = -(STRIP_LENGTH - 4) * cellH;         // -21*cellH
  const baseDistance = beforeTargetY - baseStartY;           //  17.5*cellH
  const speed        = baseDistance / linearBaseMs;          // px/ms (양수)

  // 서스펜스만큼 선형 거리를 연장 → 시작점(startY)을 더 뒤로
  const totalLinearDist = speed * (linearBaseMs + suspenseMs);
  const startY          = beforeTargetY - totalLinearDist;

  // 스트립: startY에서 보이는 최상단 인덱스까지 커버
  const topCellNeeded = Math.ceil(-startY / cellH);
  const totalStrip    = Math.max(STRIP_LENGTH, topCellNeeded + 3);

  buildStrip(stripEl, finalItem, cellH, totalStrip);
  stripEl.style.transition = '';
  stripEl.style.transform  = `translateY(${startY}px)`;

  reelEl.classList.add('spinning');

  // 시간 기반 구간 경계 (ms)
  const T_DECEL  = linearBaseMs + suspenseMs;   // 선형 → 감속
  const T_BOUNCE = T_DECEL + decelMs;           // 감속 → 바운스
  const T_END    = T_BOUNCE + bounceMs;         // 종료

  let startTime: number | null = null;

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(timestamp: number): void {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    let y: number;
    if (elapsed < T_DECEL) {
      // ① 고속 선형 스핀 — 릴 간 속도 동일
      y = startY + speed * elapsed;
    } else if (elapsed < T_BOUNCE) {
      // ② 급감속
      const t = (elapsed - T_DECEL) / decelMs;
      y = beforeTargetY + (targetY - beforeTargetY) * easeOutCubic(t);
    } else {
      // ③ 감쇠 바운스
      const t = Math.min((elapsed - T_BOUNCE) / bounceMs, 1);
      y = targetY + bounceAmp * Math.exp(-2.0 * t) * Math.sin(2 * Math.PI * t);
    }

    stripEl.style.transform = `translateY(${y}px)`;

    if (elapsed < T_END) {
      requestAnimationFrame(frame);
    } else {
      stripEl.style.transform = `translateY(${targetY}px)`;
      reelEl.classList.remove('spinning');
      callback(finalItem);
    }
  }

  requestAnimationFrame(frame);
}

// 릴 1칸 이동 (넛지): 당첨 결과 변경 연출
// direction 'up'  = 스트립 아래로 → 위 심볼(WIN_IDX-1)이 중앙으로
// direction 'down' = 스트립 위로  → 아래 심볼(WIN_IDX+1)이 중앙으로
export function nudgeReel(
  reelEl: HTMLElement,
  direction: 'up' | 'down',
  callback: (item: SlotItem, newCenterIdx: number) => void
): void {
  const stripEl = reelEl.querySelector('.reel-strip') as HTMLElement;
  const cellH   = reelEl.offsetHeight / 3;
  const fromY   = -(WIN_IDX - 1) * cellH;
  const toY     = direction === 'up' ? fromY + cellH : fromY - cellH;
  const newIdx  = direction === 'up' ? WIN_IDX - 1 : WIN_IDX + 1;
  const newImg  = stripEl.children[newIdx] as HTMLImageElement;
  const newItem: SlotItem = SLOT_ITEMS.find(it => it.id === newImg.alt) ?? SLOT_ITEMS[0];

  const T_SLIDE  = 420;   // 슬라이드 구간 (ms)
  const T_BOUNCE = 600;   // 바운스 구간 (ms)
  const T_END    = T_SLIDE + T_BOUNCE;
  const bounceAmp = cellH * 1.5;  // ★ 넛지 바운스 진폭

  let startTime: number | null = null;

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(ts: number): void {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    let y: number;
    if (elapsed < T_SLIDE) {
      const t = elapsed / T_SLIDE;
      y = fromY + (toY - fromY) * easeOutCubic(t);
    } else {
      const t = Math.min((elapsed - T_SLIDE) / T_BOUNCE, 1);
      y = toY + bounceAmp * Math.exp(-2.5 * t) * Math.sin(2 * Math.PI * t);
    }

    stripEl.style.transform = `translateY(${y}px)`;

    if (elapsed < T_END) {
      requestAnimationFrame(frame);
    } else {
      stripEl.style.transform = `translateY(${toY}px)`;
      callback(newItem, newIdx);
    }
  }

  requestAnimationFrame(frame);
}
