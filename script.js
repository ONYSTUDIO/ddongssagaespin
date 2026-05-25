// =============================================
// 슬롯 아이템: 이모지와 가중치를 하나의 객체로 관리
// 이모지를 추가할 때 weight도 같이 적어야 실수가 없어요
// =============================================
const SLOT_ITEMS = [
  { symbol: '🍒', weight: 30 },
  { symbol: '🍋', weight: 25 },
  { symbol: '🍇', weight: 20 },
  { symbol: '🔔', weight: 15 },
  { symbol: '⭐', weight: 7  },
  { symbol: '7️⃣', weight: 3  },
];

// =============================================
// 가중치 기반 랜덤 이모지 선택
// 희귀 이모지(7️⃣)는 자주 안 나오게 조절
// =============================================
function getRandomSymbol() {
  const total = SLOT_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of SLOT_ITEMS) {
    rand -= item.weight;
    if (rand <= 0) return item.symbol;
  }
  return SLOT_ITEMS[0].symbol;
}

// =============================================
// 릴 스핀 애니메이션 (일정 시간 동안 이모지를 빠르게 바꿈)
// duration: 스핀 지속 시간(ms), callback: 끝난 후 실행할 함수
// =============================================
function animateReel(symbolEl, reelEl, duration, callback) {
  reelEl.classList.add('spinning');

  const interval = setInterval(() => {
    symbolEl.textContent = getRandomSymbol();
  }, 80); // 80ms마다 이모지 교체

  setTimeout(() => {
    clearInterval(interval);
    reelEl.classList.remove('spinning');
    const finalSymbol = getRandomSymbol();
    symbolEl.textContent = finalSymbol;
    if (callback) callback(finalSymbol);
  }, duration);
}

// =============================================
// 당첨 결과 판정
// =============================================
function judgeResult(s1, s2, s3) {
  if (s1 === s2 && s2 === s3) {
    if (s1 === '7️⃣') return 'jackpot';
    if (s1 === '⭐' || s1 === '🔔') return 'bigwin';
    return 'win';
  }
  if (s1 === s2 || s2 === s3 || s1 === s3) return 'small';
  return 'lose';
}

// =============================================
// 결과 메시지 & 스타일 적용
// =============================================
function showResult(grade) {
  const el = document.getElementById('resultText');
  const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3'),
  ];

  // 기존 클래스 초기화
  el.className = 'result-text';
  reels.forEach(r => r.classList.remove('winner', 'jackpot'));

  const messages = {
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

  // 3hit(win/bigwin/jackpot)일 때만 운세 카드 표시
  const fortuneCard = document.getElementById('fortuneCard');
  if (grade === 'win' || grade === 'bigwin' || grade === 'jackpot') {
    const luckScore = Math.floor(Math.random() * 21) + 80; // 80~100 랜덤
    const fortune = FORTUNE_LIST[Math.floor(Math.random() * FORTUNE_LIST.length)];
    document.getElementById('luckIndex').textContent = luckScore;
    document.getElementById('fortuneMsg').textContent = fortune;
    setTimeout(() => fortuneCard.classList.add('visible'), 300); // 결과 메시지 뒤에 자연스럽게 등장
  } else {
    fortuneCard.classList.remove('visible');
  }
}

// =============================================
// SPIN 메인 함수 (버튼 클릭 시 실행)
// =============================================
function spin() {
  const btn = document.getElementById('spinBtn');
  const resultEl = document.getElementById('resultText');

  // 스핀 중 버튼 비활성화 & 이전 운세 카드 숨김
  btn.disabled = true;
  resultEl.className = 'result-text';
  resultEl.textContent = '두근두근... 🎰';
  document.getElementById('fortuneCard').classList.remove('visible');

  // 릴 요소 가져오기
  const symbol1 = document.getElementById('symbol1');
  const symbol2 = document.getElementById('symbol2');
  const symbol3 = document.getElementById('symbol3');
  const reel1   = document.getElementById('reel1');
  const reel2   = document.getElementById('reel2');
  const reel3   = document.getElementById('reel3');

  // 기존 당첨 효과 제거
  [reel1, reel2, reel3].forEach(r => r.classList.remove('winner', 'jackpot'));

  // 3개 릴 동시에 시작, 멈추는 시간만 다르게 (1초 / 1.5초 / 2초)
  const results = {};
  let stoppedCount = 0;

  function onReelStop(index, val) {
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

// 버튼 이벤트 연결
document.getElementById('spinBtn').addEventListener('click', spin);
