import { ensureFortuneCookieDailyState, getTodayKstDate } from './fortuneCookieDaily';

// ── 기본 유틸 ─────────────────────────────────────────────────────────────────

function showRedDot(dotId: string): void {
  document.getElementById(dotId)?.classList.remove('red-dot--hidden');
}

function hideRedDot(dotId: string): void {
  document.getElementById(dotId)?.classList.add('red-dot--hidden');
}

// ── 계정별 localStorage 키 ───────────────────────────────────────────────────
// 로그인 시 initRedDots()가 setRedDotUser()를 호출하므로, 이후 모든 함수는
// currentUserId가 설정된 상태에서 실행됨

let currentUserId = '';

function setRedDotUser(userId: string): void {
  currentUserId = userId;
}

function userKey(key: string): string {
  return currentUserId ? `${key}_${currentUserId}` : key;
}

// ── 포춘쿠키 ─────────────────────────────────────────────────────────────────
// checked_cookie=false OR wrote_message=false → 레드닷 표시

export async function updateFortuneCookieRedDot(userId: string): Promise<void> {
  try {
    const state = await ensureFortuneCookieDailyState(userId);
    if (!state.checked_cookie || !state.wrote_message) {
      showRedDot('rdFortune');
    } else {
      hideRedDot('rdFortune');
    }
  } catch {
    // 네트워크 실패 시 기존 상태 유지
  }
}

// ── 미니게임 (localStorage 기반) ─────────────────────────────────────────────
// 매일 체크: 하루 중 최초 로그인 시 레드닷 표시, 완료하면 제거

const MINIGAME_KEY = 'mg01_completed_date';

export function markMinigameCompleted(): void {
  localStorage.setItem(userKey(MINIGAME_KEY), getTodayKstDate());
  hideRedDot('rdMinigame');
}

export function updateMinigameRedDot(): void {
  if (localStorage.getItem(userKey(MINIGAME_KEY)) === getTodayKstDate()) {
    hideRedDot('rdMinigame');
  } else {
    showRedDot('rdMinigame');
  }
}

// ── 도감 (localStorage 기반) ─────────────────────────────────────────────────
// 캐릭터 수집(신규/조각/업그레이드 도달) 시에만 레드닷 표시

const CODEX_NEW_KEY         = 'codex_has_new';
const CODEX_NEW_CHAR_IDS    = 'codex_new_char_ids';
const CODEX_NEW_FRAG_IDS    = 'codex_new_fragment_ids';
const CODEX_NEW_UPGRADE_IDS = 'codex_new_upgrade_ids';

function addToCodexSet(key: string, id: number): void {
  const arr: number[] = JSON.parse(localStorage.getItem(userKey(key)) ?? '[]');
  if (!arr.includes(id)) arr.push(id);
  localStorage.setItem(userKey(key), JSON.stringify(arr));
}

export function getCodexNewCharIds(): number[] {
  return JSON.parse(localStorage.getItem(userKey(CODEX_NEW_CHAR_IDS)) ?? '[]');
}
export function getCodexNewFragmentIds(): number[] {
  return JSON.parse(localStorage.getItem(userKey(CODEX_NEW_FRAG_IDS)) ?? '[]');
}
export function getCodexNewUpgradeIds(): number[] {
  return JSON.parse(localStorage.getItem(userKey(CODEX_NEW_UPGRADE_IDS)) ?? '[]');
}

export function markCodexNewChar(charId: number): void {
  addToCodexSet(CODEX_NEW_CHAR_IDS, charId);
  localStorage.setItem(userKey(CODEX_NEW_KEY), 'true');
  showRedDot('rdCodex');
}

export function markCodexNewFragment(charId: number): void {
  addToCodexSet(CODEX_NEW_FRAG_IDS, charId);
  localStorage.setItem(userKey(CODEX_NEW_KEY), 'true');
  showRedDot('rdCodex');
}

export function markCodexNewUpgrade(charId: number): void {
  addToCodexSet(CODEX_NEW_UPGRADE_IDS, charId);
  localStorage.setItem(userKey(CODEX_NEW_KEY), 'true');
  showRedDot('rdCodex');
}

export function markCodexSeen(): void {
  localStorage.removeItem(userKey(CODEX_NEW_KEY));
  localStorage.removeItem(userKey(CODEX_NEW_CHAR_IDS));
  localStorage.removeItem(userKey(CODEX_NEW_FRAG_IDS));
  localStorage.removeItem(userKey(CODEX_NEW_UPGRADE_IDS));
  hideRedDot('rdCodex');
}

export function updateCodexRedDot(): void {
  if (localStorage.getItem(userKey(CODEX_NEW_KEY)) === 'true') {
    showRedDot('rdCodex');
  } else {
    hideRedDot('rdCodex');
  }
}

// ── 나의기록 / 순위 (localStorage 기반) ──────────────────────────────────────
// 매일 체크: 하루 중 최초 스핀 후 레드닷 표시, 아이콘 눌러 확인하면 제거

const SPIN_RECORD_KEY  = 'spin_record_date';
const HISTORY_SEEN_KEY = 'history_seen_date';
const RANKING_SEEN_KEY = 'ranking_seen_date';

export function markSpinRecordUpdated(): void {
  const today = getTodayKstDate();
  if (localStorage.getItem(userKey(SPIN_RECORD_KEY)) !== today) {
    localStorage.setItem(userKey(SPIN_RECORD_KEY), today);
    showRedDot('rdHistory');
    showRedDot('rdRanking');
  }
}

export function markHistorySeen(): void {
  localStorage.setItem(userKey(HISTORY_SEEN_KEY), getTodayKstDate());
  hideRedDot('rdHistory');
}

export function markRankingSeen(): void {
  localStorage.setItem(userKey(RANKING_SEEN_KEY), getTodayKstDate());
  hideRedDot('rdRanking');
}

function updateHistoryRedDot(): void {
  const today = getTodayKstDate();
  if (localStorage.getItem(userKey(SPIN_RECORD_KEY)) === today &&
      localStorage.getItem(userKey(HISTORY_SEEN_KEY)) !== today) {
    showRedDot('rdHistory');
  } else {
    hideRedDot('rdHistory');
  }
}

function updateRankingRedDot(): void {
  const today = getTodayKstDate();
  if (localStorage.getItem(userKey(SPIN_RECORD_KEY)) === today &&
      localStorage.getItem(userKey(RANKING_SEEN_KEY)) !== today) {
    showRedDot('rdRanking');
  } else {
    hideRedDot('rdRanking');
  }
}

// ── 프로필 (nickname null 여부 기반) ─────────────────────────────────────────

export function updateProfileRedDot(hasNickname: boolean): void {
  if (hasNickname) {
    hideRedDot('rdProfile');
  } else {
    showRedDot('rdProfile');
  }
}

// ── 전체 초기화 (로그인 성공 시 호출) ────────────────────────────────────────

export async function initRedDots(userId: string): Promise<void> {
  setRedDotUser(userId);
  await updateFortuneCookieRedDot(userId);
  updateMinigameRedDot();
  updateCodexRedDot();
  updateHistoryRedDot();
  updateRankingRedDot();
}
