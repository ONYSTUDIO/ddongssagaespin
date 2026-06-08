import { getRandomItem, SlotItem } from './game';

const STRIP_LENGTH = 25;
const WIN_IDX = 3;  // 스트립 앞쪽 배치 — 끝에서 앞으로 스크롤(위→아래 방향)

function buildStrip(stripEl: HTMLElement, finalItem: SlotItem, cellH: number): void {
  stripEl.innerHTML = '';
  for (let i = 0; i < STRIP_LENGTH; i++) {
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
// - 전반 75%: 빠른 선형 스크롤
// - 후반 25%: ease-out으로 당첨 심볼 위치에 안착
export function animateReel(
  reelEl: HTMLElement,
  duration: number,
  finalItem: SlotItem,
  callback: (item: SlotItem) => void
): void {
  const stripEl = reelEl.querySelector('.reel-strip') as HTMLElement;
  const cellH = reelEl.offsetHeight / 3;

  buildStrip(stripEl, finalItem, cellH);
  stripEl.style.transition = '';
  stripEl.style.transform = 'translateY(0)';

  reelEl.classList.add('spinning');

  // ─── 위에서 아래로 스크롤 (심볼이 위에서 내려오는 방향) ───
  // translateY가 클수록(덜 음수) 스트립이 아래로 내려감 = 심볼이 아래로 이동
  //
  // WIN_IDX = 3을 가운데 행에 표시할 때의 y값:
  //   targetY = -(WIN_IDX - 1) * cellH = -2 * cellH
  //
  // 시작 위치는 스트립 끝 근처(y가 매우 작은 음수 = 스트립 위쪽이 아닌 끝 노출):
  //   startY = -(STRIP_LENGTH - 4) * cellH  (끝에서 3번째 행 노출)
  //
  // 애니메이션: startY → targetY (y가 증가 = 스트립 아래로 = 심볼 아래로)

  const targetY     = -(WIN_IDX - 1) * cellH;            // -2 * cellH
  const startY      = -(STRIP_LENGTH - 4) * cellH;       // -21 * cellH
  const beforeTargetY = targetY - 3 * cellH;             // -5 * cellH (감속 시작점)

  // 초기 위치를 startY로 즉시 설정 (점프 방지)
  stripEl.style.transform = `translateY(${startY}px)`;

  let startTime: number | null = null;

  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(timestamp: number): void {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    let y: number;
    if (progress < 0.75) {
      // 빠른 선형 구간: startY → beforeTargetY (y 증가 = 아래로)
      y = startY + (beforeTargetY - startY) * (progress / 0.75);
    } else {
      // 감속 구간: beforeTargetY → targetY
      const t = (progress - 0.75) / 0.25;
      y = beforeTargetY + (targetY - beforeTargetY) * easeOutCubic(t);
    }

    stripEl.style.transform = `translateY(${y}px)`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      stripEl.style.transform = `translateY(${targetY}px)`;
      reelEl.classList.remove('spinning');
      callback(finalItem);
    }
  }

  requestAnimationFrame(frame);
}
