export interface SupportProduct {
  id: string;
  name: string;
  amount: number;
  description: string;
  emoji: string;
}

export const SUPPORT_PRODUCTS: SupportProduct[] = [
  { id: 'poop_tiny', name: '황금똥 한 조각', amount: 1000, description: '개발자에게 커피 한 모금', emoji: '💩' },
  // 추후 재사용 가능 — 필요 시 주석 해제
  // { id: 'poop_warm',   name: '따끈한 황금똥',  amount: 3000, description: '오늘도 개발할 힘 충전',  emoji: '✨' },
  // { id: 'poop_legend', name: '전설의 황금똥',  amount: 5000, description: '게임 운영비에 큰 힘이 됩니다', emoji: '👑' },
];
