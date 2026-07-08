import '../styles/profile.css';
import { supabase } from './supabase';
import { getCharacterSrc } from './characterCodex';
import { playClick } from './sound';
import { updateProfileRedDot } from './redDot';

interface ProfileData {
  nickname:            string | null;
  profile_grade:       number;
  profile_character_id: number;
}

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}


// ── 팝업 열기/닫기 ──────────────────────────────────────────────────
export function showProfilePopup(): void {
  const overlay = getEl('profilePopupOverlay');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('profile-popup-open');
  }));
  loadProfile();
}

export function hideProfilePopup(): void {
  const overlay = getEl('profilePopupOverlay');
  overlay.classList.remove('profile-popup-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 250);
}

// ── 편집 진입/해제 ───────────────────────────────────────────────────
function setStatus(msg: string, type: 'saving' | 'success' | 'error' | '' = ''): void {
  const el = getEl('profileNicknameStatus');
  el.textContent = msg;
  el.className = 'profile-popup-status' + (type ? ` profile-popup-status--${type}` : '');
}

function enterEdit(): void {
  const input = getEl<HTMLInputElement>('profileNicknameInput');
  input.disabled = false;
  input.focus();
  input.select();
  getEl('profileNicknameActions').removeAttribute('hidden');
  setStatus('');
}


// ── 프로필 데이터 로드 ───────────────────────────────────────────────
async function loadProfile(): Promise<void> {
  // await 이전에 동기적으로 초기화 — 팝업 오픈 즉시 이전 상태 제거
  const input = getEl<HTMLInputElement>('profileNicknameInput');
  input.disabled = true;
  input.value = '';
  getEl('profileNicknameActions').setAttribute('hidden', '');
  setStatus('');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  getEl('profilePopupId').textContent = user.email?.split('@')[0] ?? '--';

  const { data } = await supabase
    .from('profiles')
    .select('nickname, profile_grade, profile_character_id')
    .eq('id', user.id)
    .single();

  const profile = data as ProfileData | null;
  const charId  = profile?.profile_character_id ?? 1001;
  const grade   = profile?.profile_grade ?? 1;

  getEl<HTMLImageElement>('profilePopupAvatarImg').src = getCharacterSrc(charId);
  getEl('profilePopupAvatar').dataset.grade = String(grade);

  if (profile?.nickname) {
    input.value    = profile.nickname;
    input.disabled = true;
    getEl('profileNicknameActions').setAttribute('hidden', '');
  } else {
    input.value    = '';
    input.disabled = false;
    getEl('profileNicknameActions').removeAttribute('hidden');
    input.focus();
  }
}

// ── 닉네임 저장 ─────────────────────────────────────────────────────
async function saveNickname(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const input   = getEl<HTMLInputElement>('profileNicknameInput');
  const saveBtn = getEl<HTMLButtonElement>('profileNicknameSaveBtn');
  const nickname = input.value.trim();

  saveBtn.disabled = true;
  setStatus('저장 중...', 'saving');

  const { error } = await supabase
    .from('profiles')
    .update({ nickname: nickname || null })
    .eq('id', user.id);

  saveBtn.disabled = false;

  if (error) {
    setStatus('저장 중 오류가 발생했습니다.', 'error');
    return;
  }

  input.value = nickname;
  input.disabled = true;
  getEl('profileNicknameActions').setAttribute('hidden', '');
  setStatus('저장 완료!', 'success');

  // HUD 닉네임 표시 + 레드닷 업데이트
  const userId = getEl('profilePopupId').textContent ?? '';
  const hudEl  = document.getElementById('hudUsername');
  if (hudEl) hudEl.textContent = nickname ? `${nickname} (${userId})` : userId;
  updateProfileRedDot(!!nickname);
}

// ── 초기화 ──────────────────────────────────────────────────────────
export function initProfilePopup(): void {
  getEl('hudProfileBtn').addEventListener('click', () => {
    playClick();
    showProfilePopup();
  });

  getEl('profilePopupClose').addEventListener('click', () => {
    playClick();
    hideProfilePopup();
  });

  getEl('profileNicknameEditBtn').addEventListener('click', () => {
    playClick();
    enterEdit();
  });

  getEl('profileNicknameSaveBtn').addEventListener('click', () => {
    playClick();
    saveNickname();
  });

  getEl('profileNicknameCancelBtn').addEventListener('click', () => {
    playClick();
    hideProfilePopup();
  });

  getEl<HTMLInputElement>('profileNicknameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveNickname();
  });
}
