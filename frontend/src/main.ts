import './styles/main.css';
import { initLogin } from './scripts/login';
import { getRandomItem, SlotItem } from './scripts/game';
import { judgeResult } from './scripts/rules';
import { initReel, animateReel, WIN_IDX } from './scripts/reel';
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

  [reel1, reel2, reel3].forEach(r => {
    r.classList.remove('winner', 'jackpot');
    r.querySelectorAll('.reel-symbol.hit').forEach(el => el.classList.remove('hit'));
  });

  const final0 = getRandomItem();
  const final1 = getRandomItem();
  const final2 = getRandomItem();

  const results: Record<number, SlotItem> = {};
  let stoppedCount = 0;

  function onReelStop(index: number, item: SlotItem): void {
    results[index] = item;
    stoppedCount++;
    if (stoppedCount === 3) {
      const grade         = judgeResult(results[0].id, results[1].id, results[2].id);
      const fortuneResult = buildFortuneResult(grade, results[0].id, results[1].id, results[2].id);
      showResult(fortuneResult);
      saveScore(grade, fortuneResult.luckScore);
      saveSlotFortuneLog(fortuneResult).catch(() => { /* silent */ });
      isSpinning = false;
      btn.disabled = remaining <= 0;
      if (remaining > 0) setBtnState('on');

      // 매칭 심볼 찾기
      const reelEls = [reel1, reel2, reel3];
      const ids = [results[0].id, results[1].id, results[2].id];
      const countMap: Record<string, number[]> = {};
      ids.forEach((id, i) => {
        if (!countMap[id]) countMap[id] = [];
        countMap[id].push(i);
      });
      const hitIndices = Object.values(countMap)
        .filter(arr => arr.length >= 2)
        .flat();

      if (hitIndices.length > 0) {
        hitIndices.forEach(i => {
          const strip = reelEls[i].querySelector('.reel-strip');
          const symbol = strip?.children[WIN_IDX] as HTMLElement | undefined;
          symbol?.classList.add('hit');
        });
        setTimeout(() => showResultPopup(fortuneResult), 3100);
      } else {
        showResultPopup(fortuneResult);
      }
    }
  }

  animateReel(reel1, 1000, final0, (item) => onReelStop(0, item));
  animateReel(reel2, 1500, final1, (item) => onReelStop(1, item));
  animateReel(reel3, 2000, final2, (item) => onReelStop(2, item));
}

btn.addEventListener('click', spin);
