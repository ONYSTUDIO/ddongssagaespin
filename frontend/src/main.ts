import './styles/main.css';
import { judgeResult } from './scripts/game';
import { animateReel } from './scripts/reel';
import { showResult } from './scripts/effects';
import { hideFortuneCard } from './scripts/fortune';

function spin(): void {
  const btn = document.getElementById('spinBtn') as HTMLButtonElement;
  const resultEl = document.getElementById('resultText') as HTMLElement;

  btn.disabled = true;
  resultEl.className = 'result-text';
  resultEl.textContent = '두근두근... 🎰';
  hideFortuneCard();

  const symbol1 = document.getElementById('symbol1') as HTMLElement;
  const symbol2 = document.getElementById('symbol2') as HTMLElement;
  const symbol3 = document.getElementById('symbol3') as HTMLElement;
  const reel1   = document.getElementById('reel1') as HTMLElement;
  const reel2   = document.getElementById('reel2') as HTMLElement;
  const reel3   = document.getElementById('reel3') as HTMLElement;

  [reel1, reel2, reel3].forEach(r => r.classList.remove('winner', 'jackpot'));

  // 3개 릴 동시에 시작, 멈추는 시간만 다르게 (1초 / 1.5초 / 2초)
  const results: Record<number, string> = {};
  let stoppedCount = 0;

  function onReelStop(index: number, val: string): void {
    results[index] = val;
    stoppedCount++;
    if (stoppedCount === 3) {
      const grade = judgeResult(results[0], results[1], results[2]);
      showResult(grade);
      btn.disabled = false;
    }
  }

  animateReel(symbol1, reel1, 1000, (val) => onReelStop(0, val));
  animateReel(symbol2, reel2, 1500, (val) => onReelStop(1, val));
  animateReel(symbol3, reel3, 2000, (val) => onReelStop(2, val));
}

document.getElementById('spinBtn')!.addEventListener('click', spin);
