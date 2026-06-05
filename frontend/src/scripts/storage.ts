// 저장 시스템 — STEP 3에서 구현 예정
export interface PlayRecord {
  grade: string;
  symbols: string[];
  timestamp: number;
}

export function savePlayRecord(_record: PlayRecord): void {}
export function getPlayHistory(): PlayRecord[] { return []; }
export function getBestStreak(): number { return 0; }
