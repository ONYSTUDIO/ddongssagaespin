import { getRandomSymbol } from './game';

// 릴 스핀 애니메이션 — 80ms마다 이모지 교체, duration 후 최종값 확정
export function animateReel(
  symbolEl: HTMLElement,
  reelEl: HTMLElement,
  duration: number,
  callback: (symbol: string) => void
): void {
  reelEl.classList.add('spinning');

  const interval = setInterval(() => {
    symbolEl.textContent = getRandomSymbol();
  }, 80);

  setTimeout(() => {
    clearInterval(interval);
    reelEl.classList.remove('spinning');
    const finalSymbol = getRandomSymbol();
    symbolEl.textContent = finalSymbol;
    callback(finalSymbol);
  }, duration);
}
