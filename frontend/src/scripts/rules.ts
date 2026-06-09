import { Grade } from './game';

const MISS_TRIPLE = new Set(['ghost', 'sweetpotato']);

export function judgeResult(id1: string, id2: string, id3: string): Grade {
  if (id1 === id2 && id2 === id3) {
    if (id1 === 'corgi')                         return 'SUPER_LUCK';
    if (id1 === 'poop_gold')                     return 'GREAT_LUCK';
    if (id1 === 'talisman' || id1 === 'bell')    return 'GOOD_LUCK';
    if (MISS_TRIPLE.has(id1))                    return 'MISS';
  }
  if (id1 === id2 || id2 === id3 || id1 === id3) return 'SMALL_LUCK';
  return 'MISS';
}
