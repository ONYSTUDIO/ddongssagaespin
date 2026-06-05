import { Grade } from './game';
import { showFortuneCard } from './fortune';

// 결과 메시지 & 릴 시각 효과 적용
export function showResult(grade: Grade): void {
  const el = document.getElementById('resultText') as HTMLElement;
  const reels = [
    document.getElementById('reel1') as HTMLElement,
    document.getElementById('reel2') as HTMLElement,
    document.getElementById('reel3') as HTMLElement,
  ];

  el.className = 'result-text';
  reels.forEach(r => r.classList.remove('winner', 'jackpot'));

  const messages: Record<Grade, string> = {
    jackpot: '🎊 JACKPOT!!! 7️⃣7️⃣7️⃣ 대단해요!!!',
    bigwin:  '🔥 초대박! 엄청난 행운이에요!',
    win:     '🎉 대박! 3개 모두 일치!',
    small:   '😊 아쉬운 당첨~ 2개 일치!',
    lose:    '😢 꽝... 다음엔 행운이 있을 거예요!',
  };

  el.textContent = messages[grade];

  if (grade === 'jackpot') {
    el.classList.add('jackpot-msg');
    reels.forEach(r => r.classList.add('jackpot'));
  } else if (grade === 'bigwin') {
    el.classList.add('bigwin');
    reels.forEach(r => r.classList.add('winner'));
  } else if (grade === 'win') {
    el.classList.add('win');
    reels.forEach(r => r.classList.add('winner'));
  } else if (grade === 'small') {
    el.classList.add('small-win');
  } else {
    el.classList.add('lose');
  }

  // 운세 카드는 fortune.ts가 담당
  showFortuneCard(grade);
}
