import { Grade } from './game';

// ── 외부에서 사용할 타입 ──────────────────────────────────────────────────────

export type LuckGrade = Grade;  // 등급 타입 시맨틱 별칭

export interface FortuneData {
  resultMessages: string[];      // 3개 일치(트리플) 결과 문구
  pairResultMessages: string[];  // 2개 일치(페어) 결과 문구
  fortuneMessages: string[];     // 운세 카드 문구 (MISS는 미사용)
}

export interface FortuneResult {
  grade: Grade;
  title: string;
  resultMessage: string;
  fortuneMessage: string;
  luckScore: number;
  hitSymbol: string;  // 히트 심볼 ID (e.g. 'corgi', 'bell')
  hitCount: number;   // 히트 개수: 3(트리플) / 2(페어) / 0(ALL_DIFFERENT)
}

// ── 등급별 메타데이터 ─────────────────────────────────────────────────────────

const GRADE_TITLE: Record<Grade, string> = {
  SUPER_LUCK: '초대길',
  GREAT_LUCK: '대길',
  GOOD_LUCK:  '중길',
  SMALL_LUCK: '소길',
  MISS:       '꽝',
};

const LUCK_RANGE: Record<Grade, [number, number]> = {
  SUPER_LUCK: [95, 100],
  GREAT_LUCK: [85, 94],
  GOOD_LUCK:  [65, 84],
  SMALL_LUCK: [40, 64],
  MISS:       [1,  39],
};

// ── 심볼별 운세 데이터 ────────────────────────────────────────────────────────
// 키는 SlotItem.id 와 동일. '_generic_miss'는 모두 다른 경우 폴백용.

export const FORTUNE_DATA: Record<string, FortuneData> = {
  corgi: {
    resultMessages: [
      '웰시코기가 당신에게 초대길을 선물했습니다.',
      '코기 삼총사 출현! 오늘은 무엇이든 해낼 수 있어요.',
      '세 마리 코기의 특별한 축복이 쏟아집니다!',
      '코기의 특별한 기운이 하늘을 찌릅니다. 초대길!',
    ],
    pairResultMessages: [
      '코기 두 마리가 소길을 물어다 줬어요.',
      '코기 듀오 등장! 소소하지만 기분 좋은 행운이에요.',
      '코기 두 마리가 꼬리를 흔들며 소길을 선물합니다.',
    ],
    fortuneMessages: [
      '웰시코기처럼 사랑스럽고 활기찬 하루가 펼쳐집니다.',
      '코기의 귀여운 기운이 오늘 하루를 특별하게 만들어 줄 거예요.',
      '세 마리 코기의 에너지로 오늘은 무적입니다. 자신감을 가져요!',
      '코기가 행운을 물어다 줬어요. 오늘은 특별한 인연이 찾아올지도 몰라요.',
      '코기처럼 당신도 오늘 모든 이의 사랑을 받을 거예요.',
      '오늘 하루 코기의 밝은 에너지가 당신을 감싸줄 거예요.',
      '귀여움이 무기가 되는 날! 오늘은 당신의 매력이 빛을 발해요.',
    ],
  },

  poop_gold: {
    resultMessages: [
      '황금똥이 떨어졌습니다. 재물운 상승!',
      '세 개의 황금똥! 오늘은 돈과 관련된 좋은 일이 생길 거예요.',
      '황금의 기운이 넘칩니다. 대박 재물운이에요!',
      '황금똥 트리플! 재물이 쏟아지는 날이에요.',
    ],
    pairResultMessages: [
      '황금똥 두 개! 소소한 재물운이 찾아왔어요.',
      '황금 기운이 살짝 스쳤습니다. 작은 재물운 소길!',
      '황금 기운 2배! 소길이지만 재물운은 분명히 있어요.',
    ],
    fortuneMessages: [
      '오늘은 예상치 못한 재물이 들어올 수 있는 날이에요.',
      '황금빛 기운이 당신을 감싸고 있어요. 투자나 구매 결정에 좋은 날입니다.',
      '재물운이 최상입니다. 오늘 주머니 사정이 나아질 조짐이 보여요.',
      '황금똥처럼 빛나는 하루가 될 거예요. 경제적인 행운이 찾아옵니다.',
      '황금 기운이 가득! 오늘 지출보다 수입이 늘어나는 즐거운 하루예요.',
      '뜻밖의 금전적 행운이 찾아올 수 있어요. 눈을 크게 뜨고 기회를 잡으세요.',
      '오늘 산 것들이 특별한 가치를 지니게 될 거예요. 좋은 소비의 날!',
    ],
  },

  talisman: {
    resultMessages: [
      '부적 삼형제가 당신을 지켜줍니다. 중길!',
      '신비로운 부적의 힘이 모였습니다. 오늘은 보호받는 날이에요.',
      '세 개의 부적이 모든 액운을 막아줍니다!',
      '부적 트리플! 강력한 수호의 기운이 감쌉니다.',
    ],
    pairResultMessages: [
      '부적 두 장이 작은 행운을 선물합니다. 소길!',
      '부적 듀오의 가호가 오늘 하루를 지켜줍니다.',
      '두 장의 부적이 나쁜 기운을 살짝 막아줬어요. 소길!',
    ],
    fortuneMessages: [
      '오늘은 보이지 않는 힘이 당신을 지켜주고 있어요. 두려움 없이 나아가세요.',
      '부적의 신비로운 기운이 하루 종일 당신 곁에 있습니다.',
      '나쁜 기운은 멀리, 좋은 기운은 가까이! 오늘은 평화로운 하루예요.',
      '부적처럼 든든한 존재가 당신 곁에 나타날 거예요.',
      '신비로운 힘이 당신의 소원을 이뤄줄 준비를 하고 있습니다.',
      '오늘 하루 어떤 어려움도 당신을 쓰러뜨리지 못할 거예요.',
      '보이지 않는 손이 당신을 올바른 길로 안내하고 있어요.',
    ],
  },

  bell: {
    resultMessages: [
      '종소리 세 번, 행운이 깨어났습니다. 중길!',
      '딩동댕! 세 개의 방울이 기쁜 소식을 알립니다.',
      '방울 세 개가 당신의 행운을 울려 퍼뜨립니다!',
      '벨 트리플! 기쁜 소식이 세 배로 들려옵니다.',
    ],
    pairResultMessages: [
      '방울 두 개가 딸랑딸랑, 소길이 찾아왔어요.',
      '딩동! 작은 행운의 소리가 들립니다. 소길!',
      '방울 두 개가 소소한 기쁨을 울려 퍼뜨립니다.',
    ],
    fortuneMessages: [
      '기쁜 소식이 종소리처럼 울려 퍼질 거예요. 오늘 연락을 기다려보세요.',
      '딸랑딸랑, 행운의 방울이 당신 곁에서 울립니다.',
      '오늘은 좋은 소식이 잇따라 들어올 하루예요. 기대해도 좋아요.',
      '방울처럼 명랑하고 기분 좋은 하루가 될 거예요.',
      '종소리가 행운의 시작을 알립니다. 오늘 하루 기분 좋은 일이 가득해요.',
      '누군가에게 기쁜 소식을 전하거나 받게 될 거예요.',
      '오늘은 소통이 잘 되는 날! 하고 싶은 말을 편하게 꺼내보세요.',
    ],
  },

  sweetpotato: {
    resultMessages: [
      '고구마처럼 답답한 하루가 예상됩니다.',
      '고구마 세 개가 뭉쳤습니다. 오늘은 막히는 일이 많을 수 있어요.',
      '꽝! 고구마가 가득 쌓였습니다. 물이라도 마셔요.',
      '고구마 트리플... 답답한 하루지만 끝은 달콤할 수 있어요.',
    ],
    pairResultMessages: [
      '고구마 두 개... 그나마 소길이 왔네요!',
      '고구마 듀오 등장. 답답하지만 소소한 행운은 있어요. 소길!',
      '고구마 두 개! 조금 답답해도 행운은 따라와요. 소길.',
    ],
    fortuneMessages: [
      '답답한 상황도 결국 풀릴 거예요. 조금만 더 기다려봐요.',
      '고구마처럼 오래 찌다 보면 달콤해질 거예요. 인내심을 가져보세요.',
      '막힌 것 같아도 의외의 구멍이 보일 거예요. 시야를 넓혀봐요.',
      '오늘 답답한 일이 있더라도 저녁엔 풀릴 조짐이 있어요.',
      '고구마도 잘 익으면 맛있듯이, 오늘의 인내가 내일의 기쁨이 될 거예요.',
    ],
  },

  ghost: {
    resultMessages: [
      '귀신이 오늘의 운세를 훔쳐갔습니다.',
      '으스스한 유령 세 마리가 행운을 가져가 버렸어요.',
      '귀신 삼형제 출현! 오늘은 조심하는 것이 좋겠어요.',
      '유령 트리플... 행운이 어디론가 사라져 버렸어요.',
    ],
    pairResultMessages: [
      '유령 두 마리가 슬쩍 지나갔습니다. 그래도 소길이에요!',
      '귀신 듀오가 나타났지만 소소한 행운은 남겨두고 갔네요. 소길!',
      '유령 두 마리... 스산하지만 소길은 챙겼어요!',
    ],
    fortuneMessages: [
      '스산한 기운이 있지만 작은 행운이 함께해요. 긍정적으로 생각해봐요.',
      '귀신도 당신의 강한 기운에 놀라 도망갈 거예요. 자신감을 가져요.',
      '으스스하지만 그 속에 소소한 즐거움이 숨어 있어요.',
      '오늘은 평소보다 조심스럽게, 하지만 용기 있게 나아가봐요.',
      '귀신이 건드리지 못할 만큼 오늘 하루 단단하게 버텨봐요.',
    ],
  },

  // 3개 모두 다른 꽝 — 심볼 특정 불가
  _generic_miss: {
    resultMessages: [
      '꽝... 다음엔 더 큰 행운이 기다리고 있어요!',
      '이번엔 아쉽지만, 행운은 반드시 돌아옵니다.',
      '꽝! 하지만 포기하지 마세요. 다음 스핀을 기대해봐요.',
      '아무것도 맞지 않았어요... 하지만 도전은 계속돼요!',
    ],
    pairResultMessages: [],
    fortuneMessages: [],
  },
};

// ── 유틸 ─────────────────────────────────────────────────────────────────────

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 핵심 함수: 등급 + 심볼 조합 → FortuneResult ──────────────────────────────

export function buildFortuneResult(
  grade: Grade,
  id1: string,
  id2: string,
  id3: string,
): FortuneResult {
  const title = GRADE_TITLE[grade];
  const [min, max] = LUCK_RANGE[grade];
  const luckScore = randomInRange(min, max);

  // 대표 심볼 결정
  const isTriple = id1 === id2 && id2 === id3;
  let primarySymbol: string;
  if (isTriple)       primarySymbol = id1;
  else if (id1 === id2) primarySymbol = id1;
  else if (id2 === id3) primarySymbol = id2;
  else if (id1 === id3) primarySymbol = id1;
  else                  primarySymbol = '_generic_miss';

  const data = FORTUNE_DATA[primarySymbol] ?? FORTUNE_DATA['_generic_miss'];

  // 트리플이면 resultMessages, 페어면 pairResultMessages(없으면 폴백)
  const resultPool = (!isTriple && data.pairResultMessages.length > 0)
    ? data.pairResultMessages
    : data.resultMessages;

  const resultMessage = pickRandom(resultPool);
  const fortuneMessage = (grade !== 'MISS' && data.fortuneMessages.length > 0)
    ? pickRandom(data.fortuneMessages)
    : '';

  // 히트 심볼 결정
  let hitSymbol = '';
  let hitCount = 0;
  if (isTriple) {
    hitSymbol = id1;
    hitCount = 3;
  } else if (grade === 'SMALL_LUCK') {
    hitSymbol = (id1 === id2) ? id1 : (id2 === id3) ? id2 : id1; // id1===id3 폴백
    hitCount = 2;
  }

  return { grade, title, resultMessage, fortuneMessage, luckScore, hitSymbol, hitCount };
}

// ── DOM 조작 ─────────────────────────────────────────────────────────────────

export function showFortuneCard(result: FortuneResult): void {
  const fortuneCard  = document.getElementById('fortuneCard')  as HTMLElement;
  const luckIndexEl  = document.getElementById('luckIndex')    as HTMLElement;
  const fortuneMsgEl = document.getElementById('fortuneMsg')   as HTMLElement;

  if (result.grade !== 'MISS' && result.fortuneMessage) {
    luckIndexEl.textContent  = String(result.luckScore);
    fortuneMsgEl.textContent = result.fortuneMessage;
    setTimeout(() => fortuneCard.classList.add('visible'), 300);
  } else {
    fortuneCard.classList.remove('visible');
  }
}

export function hideFortuneCard(): void {
  (document.getElementById('fortuneCard') as HTMLElement).classList.remove('visible');
}
