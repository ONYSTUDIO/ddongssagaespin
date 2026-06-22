import { Grade } from './game';

export type MissType = 'GHOST_TRIPLE' | 'SWEETPOTATO_TRIPLE' | 'ALL_DIFFERENT' | null;

export interface SlotJudgeResult {
  grade: Grade;
  missType: MissType;
  shouldShowResultPopup: boolean;
  shouldPlayHitEffect: boolean;
}

// ── [TEST] 초대길 연출 확인용 ──────────────────────────────────────
/*
export function judgeResult(_id1: string, _id2: string, _id3: string): SlotJudgeResult {
  return { grade: 'SUPER_LUCK', missType: null, shouldShowResultPopup: true, shouldPlayHitEffect: true };
}
*/

/*
 * 판정 우선순위
 * 1. corgi×3            → SUPER_LUCK
 * 2. poop_gold×3        → GREAT_LUCK
 * 3. bell×3 / talisman×3 → GOOD_LUCK
 * 4. ghost×3            → MISS (GHOST_TRIPLE,        팝업 있음)
 * 5. sweetpotato×3      → MISS (SWEETPOTATO_TRIPLE,  팝업 있음)
 * 6. 2개 일치           → SMALL_LUCK
 * 7. 모두 다름          → MISS (ALL_DIFFERENT,        팝업 없음)
 *
 * 테스트 케이스:
 * corgi/corgi/corgi                        → SUPER_LUCK,              팝업 있음
 * poop_gold/poop_gold/poop_gold            → GREAT_LUCK,              팝업 있음
 * bell/bell/bell                           → GOOD_LUCK,               팝업 있음
 * talisman/talisman/talisman               → GOOD_LUCK,               팝업 있음
 * ghost/ghost/ghost                        → MISS (GHOST_TRIPLE),     팝업 있음
 * sweetpotato/sweetpotato/sweetpotato      → MISS (SWEETPOTATO_TRIPLE),팝업 있음
 * ghost/ghost/bell                         → SMALL_LUCK,              팝업 있음
 * sweetpotato/sweetpotato/corgi            → SMALL_LUCK,              팝업 있음
 * corgi/bell/ghost                         → MISS (ALL_DIFFERENT),    팝업 없음
 * poop_gold/talisman/sweetpotato           → MISS (ALL_DIFFERENT),    팝업 없음
 */
export function judgeResult(id1: string, id2: string, id3: string): SlotJudgeResult {
  const withPopup = (grade: Grade, missType: MissType = null): SlotJudgeResult =>
    ({ grade, missType, shouldShowResultPopup: true, shouldPlayHitEffect: true });

  if (id1 === id2 && id2 === id3) {
    if (id1 === 'corgi')                      return withPopup('SUPER_LUCK');
    if (id1 === 'poop_gold')                  return withPopup('GREAT_LUCK');
    if (id1 === 'bell' || id1 === 'talisman') return withPopup('GOOD_LUCK');
    if (id1 === 'ghost')                      return withPopup('MISS', 'GHOST_TRIPLE');
    if (id1 === 'sweetpotato')                return withPopup('MISS', 'SWEETPOTATO_TRIPLE');
    // 미등록 심볼 트리플 → SMALL_LUCK으로 오판되지 않도록 명시적 처리
    return { grade: 'MISS', missType: 'ALL_DIFFERENT', shouldShowResultPopup: false, shouldPlayHitEffect: false };
  }

  if (id1 === id2 || id2 === id3 || id1 === id3) return withPopup('SMALL_LUCK');

  return { grade: 'MISS', missType: 'ALL_DIFFERENT', shouldShowResultPopup: false, shouldPlayHitEffect: false };
}
