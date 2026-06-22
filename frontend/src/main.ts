import './styles/main.css';
import { initLogin } from './scripts/login';
import { getRandomItem, SlotItem } from './scripts/game';
import { judgeResult } from './scripts/rules';
import { initReel, animateReel, nudgeReel, WIN_IDX } from './scripts/reel';
import { showResult } from './scripts/effects';
import { buildFortuneResult, hideFortuneCard } from './scripts/fortune';
import { initPopup, showResultPopup, hideResultPopup } from './scripts/popup';
import { saveScore } from './scripts/ranking';
import { initMeta } from './scripts/meta';
import { initDailyReward, checkAndShowDailyReward } from './scripts/dailyReward';
import { getCurrentSpinCount, consumeSpin } from './scripts/spinManager';
import { saveSlotFortuneLog } from './scripts/history';
import { initStars } from './scripts/stars';

import spinOnSrc       from './assets/images/buttons/btn_spin_on.png';
import spinOffSrc      from './assets/images/buttons/btn_spin_off.png';
import spinFocusSrc    from './assets/images/buttons/btn_spin_focus.png';
import machineFrameSrc from './assets/images/machine/machine_frame.png';

const btn            = document.getElementById('spinBtn')        as HTMLButtonElement;
const btnImg         = document.getElementById('btnSpinImg')     as HTMLImageElement;
const machineFrameEl = document.getElementById('machineFrameImg') as HTMLImageElement;
const reel1          = document.getElementById('reel1')          as HTMLElement;
const reel2          = document.getElementById('reel2')          as HTMLElement;
const reel3          = document.getElementById('reel3')          as HTMLElement;
const resultEl       = document.getElementById('resultText')     as HTMLElement;
const spinCountEl    = document.getElementById('spinCountText')  as HTMLElement;

let isSpinning = false;
let pendingPopupTimer: ReturnType<typeof setTimeout> | null = null;

// ── 특수 연출 확률 (나중에 실제 확률로 조정) ──────────────────────
// 0 ~ SUSPENSE_THRESH: 서스펜스 / SUSPENSE_THRESH ~ NUDGE_THRESH: 넛지 / 나머지: 일반
const SUSPENSE_THRESH = 0.25;
const NUDGE_THRESH    = 0.50;

// ── 스핀 카운트 UI 업데이트 ───────────────────────────────────────
function updateSpinCountUI(count: number): void {
  spinCountEl.innerHTML = `<span class="spin-count-num">${count}</span> SPIN`;
  if (count <= 10) {
    spinCountEl.classList.remove('spin-normal');
    spinCountEl.classList.add('spin-low');
  } else {
    spinCountEl.classList.remove('spin-low');
    spinCountEl.classList.add('spin-normal');
  }
  if (!isSpinning) {
    btn.disabled = count <= 0;
    if (count <= 0) setBtnState('off');
  }
}

// ── 버튼 이미지 상태 전환 ─────────────────────────────────────────
function setBtnState(state: 'on' | 'off' | 'focus'): void {
  const map = { on: spinOnSrc, off: spinOffSrc, focus: spinFocusSrc };
  btnImg.src = map[state];
}

// ── 머신 프레임 로드 후 릴 초기화 ────────────────────────────────
function initAllReels(): void {
  initReel(reel1);
  initReel(reel2);
  initReel(reel3);
}

machineFrameEl.onload = initAllReels;
machineFrameEl.src = machineFrameSrc;
if (machineFrameEl.complete && machineFrameEl.naturalWidth > 0) initAllReels();

setBtnState('on');

// ── 로그인 성공 후 처리 ───────────────────────────────────────────
async function onLoginSuccess(): Promise<void> {
  // 스핀 카운트 표시
  const count = await getCurrentSpinCount();
  updateSpinCountUI(count);

  // 일일 보상 팝업 초기화 및 표시
  initDailyReward((newCount) => {
    updateSpinCountUI(newCount);
  });
  await checkAndShowDailyReward();
}

initStars();
initLogin(onLoginSuccess);
initPopup();
initMeta();

// 포춘쿠키 보상 등 외부에서 스핀 지급 시 UI 갱신
document.addEventListener('spinCountUpdated', (e) => {
  updateSpinCountUI((e as CustomEvent<{ count: number }>).detail.count);
});

// ── 호버 이벤트 ──────────────────────────────────────────────────
btn.addEventListener('mouseenter', () => { if (!btn.disabled) setBtnState('focus'); });
btn.addEventListener('mouseleave', () => { if (!btn.disabled) setBtnState('on');    });

// ── SPIN 함수 ─────────────────────────────────────────────────────
async function spin(): Promise<void> {
  if (isSpinning) return;
  isSpinning = true;

  // 이전 스핀의 지연 팝업 타이머가 살아 있으면 취소
  if (pendingPopupTimer !== null) {
    clearTimeout(pendingPopupTimer);
    pendingPopupTimer = null;
  }

  btn.disabled = true;
  setBtnState('off');
  resultEl.className = 'result-text';
  resultEl.textContent = '두근두근... 🎰';
  hideFortuneCard();
  hideResultPopup();

  // 스핀 1개 차감
  const { success, remaining } = await consumeSpin();
  if (!success) {
    isSpinning = false;
    updateSpinCountUI(0);
    return;
  }
  updateSpinCountUI(remaining);

  // 이전 히트 클론 제거 + 숨겨진 원본 심볼 복구
  const hitOverlay = document.getElementById('hitSymbolOverlay');
  if (hitOverlay) hitOverlay.innerHTML = '';
  [reel1, reel2, reel3].forEach(r => {
    r.classList.remove('winner', 'jackpot');
    r.querySelectorAll<HTMLElement>('.reel-symbol').forEach(s => { s.style.opacity = ''; });
  });

  const final0 = getRandomItem();
  const final1 = getRandomItem();
  const final2 = getRandomItem();

  // 특수 연출 롤 — 셋 중 하나만 발생
  const roll        = Math.random();
  const isSuspense  = roll < SUSPENSE_THRESH;
  const isNudge     = roll >= SUSPENSE_THRESH && roll < NUDGE_THRESH;
  const suspenseMs  = isSuspense ? 1500 : 0;

  const results: Record<number, SlotItem> = {};
  const reelCenterIdx = [WIN_IDX, WIN_IDX, WIN_IDX]; // 넛지 후 각 릴의 실제 중앙 인덱스
  let stoppedCount = 0;

  const reelEls = [reel1, reel2, reel3];

  function runJudgment(): void {
    const judgment      = judgeResult(results[0].id, results[1].id, results[2].id);
    const fortuneResult = buildFortuneResult(judgment.grade, results[0].id, results[1].id, results[2].id);

    saveScore(judgment.grade, fortuneResult.luckScore);
    saveSlotFortuneLog(fortuneResult).catch(() => { /* silent */ });

    isSpinning = false;
    btn.disabled = remaining <= 0;
    if (remaining > 0) setBtnState('on');

    // 모두 다른 꽝(ALL_DIFFERENT): 히트 연출 없음, 팝업 없음, 텍스트만 표시
    if (!judgment.shouldShowResultPopup) {
      resultEl.className = 'result-text lose';
      resultEl.textContent = '꽝... 다음 스핀을 기대해보세요!';
      return;
    }

    showResult(fortuneResult);

    // 매칭 심볼 하이라이트 (pair / triple)
    const ids = [results[0].id, results[1].id, results[2].id];
    const countMap: Record<string, number[]> = {};
    ids.forEach((id, i) => {
      if (!countMap[id]) countMap[id] = [];
      countMap[id].push(i);
    });
    const hitIndices = Object.values(countMap)
      .filter(arr => arr.length >= 2)
      .flat();

    if (judgment.shouldPlayHitEffect && hitIndices.length > 0) {
      const overlay = document.getElementById('hitSymbolOverlay');
      hitIndices.forEach(i => {
        const strip  = reelEls[i].querySelector('.reel-strip');
        // 넛지된 릴은 reelCenterIdx[i]가 WIN_IDX와 다를 수 있음
        const symbol = strip?.children[reelCenterIdx[i]] as HTMLImageElement | undefined;
        if (!symbol || !overlay) return;

        const rect  = symbol.getBoundingClientRect();
        const clone = document.createElement('img');
        clone.src   = symbol.src;
        clone.className    = 'hit-symbol-clone';
        clone.style.left   = `${rect.left}px`;
        clone.style.top    = `${rect.top}px`;
        clone.style.width  = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        overlay.appendChild(clone);

        symbol.style.opacity = '0';
        setTimeout(() => {
          clone.remove();
          symbol.style.opacity = '';
        }, 3000);
      });
      pendingPopupTimer = setTimeout(() => {
        pendingPopupTimer = null;
        showResultPopup(fortuneResult);
      }, 3100);
    } else {
      showResultPopup(fortuneResult);
    }
  }

  function onReelStop(index: number, item: SlotItem): void {
    results[index] = item;
    stoppedCount++;
    if (stoppedCount < 3) return;

    if (isNudge) {
      // 3릴 정지 후 잠깐 대기 → 랜덤 릴 1개 넛지
      setTimeout(() => {
        const nudgeIdx = Math.floor(Math.random() * 3);
        const dir: 'up' | 'down' = Math.random() < 0.5 ? 'up' : 'down';
        nudgeReel(reelEls[nudgeIdx], dir, (newItem, newIdx) => {
          results[nudgeIdx]      = newItem;
          reelCenterIdx[nudgeIdx] = newIdx;
          runJudgment();
        });
      }, 400);
    } else {
      runJudgment();
    }
  }

  animateReel(reel1,  700,  final0, (item) => onReelStop(0, item));
  animateReel(reel2, 1100,  final1, (item) => onReelStop(1, item));
  animateReel(reel3, 1550,  final2, (item) => onReelStop(2, item), suspenseMs);
}

btn.addEventListener('click', spin);
