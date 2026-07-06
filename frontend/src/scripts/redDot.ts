import { ensureFortuneCookieDailyState, getTodayKstDate } from './fortuneCookieDaily';

// ── 기본 유틸 ─────────────────────────────────────────────────────────────────

function showRedDot(dotId: string): void {
  document.getElementById(dotId)?.classList.remove('red-dot--hidden');
}

function hideRedDot(dotId: string): void {
  document.getElementById(dotId)?.classList.add('red-dot--hidden');
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
// TODO 장기 개선: user_minigame_daily (user_id, date, completed_at) DB 테이블로 전환
//   → 기기 변경 시에도 유지, 일일 제한·보상 시스템과 연결 가능

const MINIGAME_KEY = 'mg01_completed_date';

export function markMinigameCompleted(): void {
  localStorage.setItem(MINIGAME_KEY, getTodayKstDate());
  hideRedDot('rdMinigame');
}

export function updateMinigameRedDot(): void {
  if (localStorage.getItem(MINIGAME_KEY) === getTodayKstDate()) {
    hideRedDot('rdMinigame');
  } else {
    showRedDot('rdMinigame');
  }
}

// ── 도감 (localStorage 기반) ─────────────────────────────────────────────────
// TODO 장기 개선: user_characters 테이블에 is_seen(boolean) 컬럼 추가
//   → 기기 변경 시에도 유지, 신규 획득 여부를 서버에서 정확히 관리 가능

const CODEX_NEW_KEY = 'codex_has_new_character';

export function markNewCharacterAcquired(): void {
  localStorage.setItem(CODEX_NEW_KEY, 'true');
  showRedDot('rdCodex');
}

export function markCodexSeen(): void {
  localStorage.removeItem(CODEX_NEW_KEY);
  hideRedDot('rdCodex');
}

export function updateCodexRedDot(): void {
  if (localStorage.getItem(CODEX_NEW_KEY) === 'true') {
    showRedDot('rdCodex');
  } else {
    hideRedDot('rdCodex');
  }
}

// ── 전체 초기화 (로그인 성공 시 호출) ────────────────────────────────────────

export async function initRedDots(userId: string): Promise<void> {
  await updateFortuneCookieRedDot(userId);
  updateMinigameRedDot();
  markNewCharacterAcquired(); // TEST: 도감 레드닷 강제 표시 — 테스트 후 updateCodexRedDot()로 원복
}
