import './styles/main.css';
import { initLogin } from './scripts/login';
import { getRandomItem, SlotItem } from './scripts/game';
import { judgeResult } from './scripts/rules';
import { initReel, animateReel } from './scripts/reel';
import { showResult } from './scripts/effects';
import { buildFortuneResult, hideFortuneCard } from './scripts/fortune';
import { initPopup, showResultPopup, hideResultPopup } from './scripts/popup';

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

// ── 버튼 이미지 상태 전환 ──
function setBtnState(state: 'on' | 'off' | 'focus'): void {
  const map = { on: spinOnSrc, off: spinOffSrc, focus: spinFocusSrc };
  btnImg.src = map[state];
}

// ── 머신 프레임 로드 후 릴 초기화 ──
function initAllReels(): void {
  initReel(reel1);
  initReel(reel2);
  initReel(reel3);
}

machineFrameEl.onload = initAllReels;
machineFrameEl.src = machineFrameSrc;
if (machineFrameEl.complete && machineFrameEl.naturalWidth > 0) initAllReels();

setBtnState('on');
initLogin();
initPopup();

// ── 호버 이벤트 ──
btn.addEventListener('mouseenter', () => { if (!btn.disabled) setBtnState('focus'); });
btn.addEventListener('mouseleave', () => { if (!btn.disabled) setBtnState('on');    });

// ── SPIN 함수 ──
function spin(): void {
  btn.disabled = true;
  setBtnState('off');
  resultEl.className = 'result-text';
  resultEl.textContent = '두근두근... 🎰';
  hideFortuneCard();
  hideResultPopup();

  [reel1, reel2, reel3].forEach(r => r.classList.remove('winner', 'jackpot'));

  // 당첨 심볼 사전 결정 (스트립 구성에 필요)
  const final0 = getRandomItem();
  const final1 = getRandomItem();
  const final2 = getRandomItem();

  const results: Record<number, SlotItem> = {};
  let stoppedCount = 0;

  function onReelStop(index: number, item: SlotItem): void {
    results[index] = item;
    stoppedCount++;
    if (stoppedCount === 3) {
      const grade        = judgeResult(results[0].id, results[1].id, results[2].id);
      const fortuneResult = buildFortuneResult(grade, results[0].id, results[1].id, results[2].id);
      showResult(fortuneResult);
      showResultPopup(fortuneResult);
      btn.disabled = false;
      setBtnState('on');
    }
  }

  animateReel(reel1, 1000, final0, (item) => onReelStop(0, item));
  animateReel(reel2, 1500, final1, (item) => onReelStop(1, item));
  animateReel(reel3, 2000, final2, (item) => onReelStop(2, item));
}

btn.addEventListener('click', spin);
