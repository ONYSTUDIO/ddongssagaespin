import { FortuneResult, showFortuneCard } from './fortune';

export function showResult(result: FortuneResult): void {
  const el = document.getElementById('resultText') as HTMLElement;
  const reels = [
    document.getElementById('reel1') as HTMLElement,
    document.getElementById('reel2') as HTMLElement,
    document.getElementById('reel3') as HTMLElement,
  ];

  el.className = 'result-text';
  reels.forEach(r => r.classList.remove('winner', 'jackpot'));

  el.textContent = result.resultMessage;

  const { grade } = result;
  if (grade === 'SUPER_LUCK') {
    el.classList.add('jackpot-msg');
    reels.forEach(r => r.classList.add('jackpot'));
  } else if (grade === 'GREAT_LUCK') {
    el.classList.add('bigwin');
    reels.forEach(r => r.classList.add('winner'));
  } else if (grade === 'GOOD_LUCK') {
    el.classList.add('win');
    reels.forEach(r => r.classList.add('winner'));
  } else if (grade === 'SMALL_LUCK') {
    el.classList.add('small-win');
  } else {
    el.classList.add('lose');
  }

  showFortuneCard(result);
}
