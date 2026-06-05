// 슬롯 아이템 타입
export interface SlotItem {
  symbol: string;
  weight: number;
}

// 당첨 등급 타입
export type Grade = 'jackpot' | 'bigwin' | 'win' | 'small' | 'lose';

// 슬롯 아이템: 이모지와 가중치를 하나의 객체로 관리
export const SLOT_ITEMS: SlotItem[] = [
  { symbol: '🍒', weight: 30 },
  { symbol: '🍋', weight: 25 },
  { symbol: '🍇', weight: 20 },
  { symbol: '🔔', weight: 15 },
  { symbol: '⭐', weight: 7  },
  { symbol: '7️⃣', weight: 3  },
];

// 가중치 기반 랜덤 이모지 선택
export function getRandomSymbol(): string {
  const total = SLOT_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of SLOT_ITEMS) {
    rand -= item.weight;
    if (rand <= 0) return item.symbol;
  }
  return SLOT_ITEMS[0].symbol;
}

// 당첨 결과 판정
export function judgeResult(s1: string, s2: string, s3: string): Grade {
  if (s1 === s2 && s2 === s3) {
    if (s1 === '7️⃣') return 'jackpot';
    if (s1 === '⭐' || s1 === '🔔') return 'bigwin';
    return 'win';
  }
  if (s1 === s2 || s2 === s3 || s1 === s3) return 'small';
  return 'lose';
}
