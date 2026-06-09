import bellSrc        from '../assets/images/symbols/symbol_bell.png';
import corgiSrc       from '../assets/images/symbols/symbol_corgi.png';
import ghostSrc       from '../assets/images/symbols/symbol_ghost.png';
import poogGoldSrc    from '../assets/images/symbols/symbol_poop_gold.png';
import sweetpotatoSrc from '../assets/images/symbols/symbol_sweetpotato.png';
import talismanSrc    from '../assets/images/symbols/symbol_talisman.png';

export interface SlotItem {
  id: string;     // 당첨 판정에 사용
  src: string;    // 이미지 URL (Vite가 빌드 시 해시 처리)
  weight: number;
}

export type Grade = 'SUPER_LUCK' | 'GREAT_LUCK' | 'GOOD_LUCK' | 'SMALL_LUCK' | 'MISS';

// 가중치 기준 등급:
//   talisman(3)         → jackpot
//   poop_gold(15), sweetpotato(7) → bigwin
//   bell(30), corgi(25), ghost(20) → win
export const SLOT_ITEMS: SlotItem[] = [
  { id: 'bell',        src: bellSrc,        weight: 30 },
  { id: 'corgi',       src: corgiSrc,       weight: 25 },
  { id: 'ghost',       src: ghostSrc,       weight: 20 },
  { id: 'poop_gold',   src: poogGoldSrc,    weight: 15 },
  { id: 'sweetpotato', src: sweetpotatoSrc, weight: 7  },
  { id: 'talisman',    src: talismanSrc,    weight: 3  },
];

// 가중치 기반 랜덤 아이템 선택
export function getRandomItem(): SlotItem {
  const total = SLOT_ITEMS.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of SLOT_ITEMS) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }
  return SLOT_ITEMS[0];
}

