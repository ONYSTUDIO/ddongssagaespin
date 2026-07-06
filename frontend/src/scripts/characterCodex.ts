import '../styles/characterCodex.css';

import dog01Src from '../assets/images/characters/dog_01.png';
import dog02Src from '../assets/images/characters/dog_02.png';
import dog03Src from '../assets/images/characters/dog_03.png';
import dog04Src from '../assets/images/characters/dog_04.png';
import dog05Src from '../assets/images/characters/dog_05.png';

import { supabase } from './supabase';
import { playClick } from './sound';
import {
  markCodexSeen,
  getCodexNewCharIds,
  getCodexNewFragmentIds,
  getCodexNewUpgradeIds,
} from './redDot';

const DOG_IMAGES: Record<number, string> = {
  1001: dog01Src,
  1002: dog02Src,
  1003: dog03Src,
  1004: dog04Src,
  1005: dog05Src,
};

export function getCharacterSrc(charId: number): string {
  return DOG_IMAGES[charId] ?? DOG_IMAGES[1001];
}

const DEFINED_CHARACTERS = [1001, 1002, 1003, 1004, 1005];
const TOTAL_SLOTS        = 9;
const FRAGMENT_CAP       = 10;
const MAX_GRADE          = 5;

let currentProfileCharId = 1001;

interface CharacterRow {
  character_id:   number;
  fragment_count: number;
}

interface CodexData {
  characters:        Map<number, number>; // character_id → fragment_count
  profileGrade:      number;
  profileCharacterId: number;
}

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function showToast(msg: string): void {
  const el = document.getElementById('metaToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('meta-toast--visible');
  setTimeout(() => el.classList.remove('meta-toast--visible'), 2500);
}

function handleEsc(e: KeyboardEvent): void {
  if (e.key === 'Escape') hideCharacterCodexPopup();
}

// ── 팝업 열기/닫기 ──────────────────────────────────────────────────
export function showCharacterCodexPopup(): void {
  const overlay = getEl('characterCodexOverlay');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('codex-open');
  }));
  document.addEventListener('keydown', handleEsc);
  renderGrid();
}

export function hideCharacterCodexPopup(): void {
  const overlay = getEl('characterCodexOverlay');
  overlay.classList.remove('codex-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 300);
  document.removeEventListener('keydown', handleEsc);
  markCodexSeen();
}

// ── 확인 팝업 ────────────────────────────────────────────────────────
function showCodexConfirm(): void {
  const overlay = getEl('codexConfirmOverlay');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('codex-confirm-open');
  }));
}

function hideCodexConfirm(): void {
  const overlay = getEl('codexConfirmOverlay');
  overlay.classList.remove('codex-confirm-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 250);
}

// ── 프로필 캐릭터 변경 ────────────────────────────────────────────────
async function changeProfileCharacter(charId: number, btnEl: HTMLButtonElement): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  btnEl.disabled = true;
  btnEl.textContent = '변경 중...';

  const { error } = await supabase
    .from('profiles')
    .update({ profile_character_id: charId })
    .eq('id', user.id);

  if (error) {
    btnEl.disabled = false;
    btnEl.textContent = '변경';
    showToast('프로필 변경 중 오류가 발생했습니다.');
    return;
  }

  // HUD 아바타 업데이트
  const avatarEl = document.getElementById('hudAvatarImg') as HTMLImageElement | null;
  if (avatarEl) avatarEl.src = DOG_IMAGES[charId] ?? DOG_IMAGES[1001];

  // 이전 프로필 버튼 활성화
  const prevBtn = document.querySelector<HTMLButtonElement>(
    `.codex-change-btn[data-char-id="${currentProfileCharId}"]`
  );
  if (prevBtn && prevBtn !== btnEl) {
    prevBtn.disabled = false;
    prevBtn.classList.remove('codex-change-btn--current');
    prevBtn.textContent = '변경';
  }

  // 현재 프로필 ID 업데이트 + 새 버튼 비활성화
  currentProfileCharId = charId;
  btnEl.textContent = '변경';
  btnEl.classList.add('codex-change-btn--current');

  showCodexConfirm();
}

// ── 업그레이드 실행 ──────────────────────────────────────────────────
// profile_grade +1 후 해당 캐릭터의 fragment_count를 0으로 초기화
async function executeUpgrade(charId: number, currentGrade: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [gradeResult, fragmentResult] = await Promise.all([
    supabase
      .from('profiles')
      .update({ profile_grade: currentGrade + 1 })
      .eq('id', user.id),
    supabase
      .from('user_characters')
      .update({ fragment_count: 0 })
      .eq('user_id', user.id)
      .eq('character_id', charId),
  ]);

  if (gradeResult.error || fragmentResult.error) {
    showToast('업그레이드 처리 중 오류가 발생했습니다.');
    return;
  }

  showToast(`프레임이 ${currentGrade + 1}단계로 업그레이드 됐어요! ✨`);
  renderGrid();
}

// ── DB 조회 ─────────────────────────────────────────────────────────
// profile_grade는 profiles의 전역 컬럼 — user_characters에 추가 불필요
async function fetchCodexData(): Promise<CodexData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { characters: new Map(), profileGrade: 1, profileCharacterId: 1001 };

  const [charResult, profileResult] = await Promise.all([
    supabase
      .from('user_characters')
      .select('character_id, fragment_count')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('profile_grade, profile_character_id')
      .eq('id', user.id)
      .single(),
  ]);

  const characters = new Map<number, number>();
  if (!charResult.error && charResult.data) {
    for (const row of charResult.data as CharacterRow[]) {
      characters.set(row.character_id, row.fragment_count);
    }
  }

  const profileData = profileResult.data as { profile_grade: number; profile_character_id: number } | null;
  const profileGrade       = profileData?.profile_grade       ?? 1;
  const profileCharacterId = profileData?.profile_character_id ?? 1001;
  return { characters, profileGrade, profileCharacterId };
}

// ── 깜빡임 클래스 1회 적용 헬퍼 ───────────────────────────────────
function addBlink(el: Element | null, cls: string): void {
  if (!el) return;
  el.classList.add(cls);
}

// ── 그리드 렌더링 ─────────────────────────────────────────────────
async function renderGrid(): Promise<void> {
  const grid = getEl('codexGrid');
  grid.innerHTML = '<p class="codex-loading">불러오는 중...</p>';

  const { characters, profileGrade, profileCharacterId } = await fetchCodexData();
  currentProfileCharId = profileCharacterId;

  const newCharIds     = getCodexNewCharIds();
  const newFragmentIds = getCodexNewFragmentIds();
  const newUpgradeIds  = getCodexNewUpgradeIds();

  grid.innerHTML = '';

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const slot = document.createElement('div');
    let charId      = 0;
    let isCollected = false;
    let canUpgrade  = false;

    if (i < DEFINED_CHARACTERS.length) {
      charId = DEFINED_CHARACTERS[i];
      const fragments = characters.get(charId);
      isCollected = fragments !== undefined;

      if (isCollected) {
        canUpgrade = fragments! >= FRAGMENT_CAP && profileGrade < MAX_GRADE;
        const isMaxGrade = profileGrade >= MAX_GRADE;

        const fragmentLabel = canUpgrade
          ? '업그레이드'
          : isMaxGrade
            ? `MAX`
            : `${fragments}/${FRAGMENT_CAP}`;

        const fragmentClass = canUpgrade
          ? 'codex-fragment-btn codex-fragment-btn--active'
          : 'codex-fragment-btn codex-fragment-btn--disabled';

        const isCurrentProfile = charId === currentProfileCharId;
        slot.className = 'codex-slot codex-slot--collected';
        slot.dataset.charId = String(charId);
        slot.innerHTML = `
          <div class="codex-circle">
            <img class="codex-char-img" src="${DOG_IMAGES[charId]}" alt="캐릭터 ${charId}">
          </div>
          <div class="codex-btn-row">
            <button class="codex-change-btn${isCurrentProfile ? ' codex-change-btn--current' : ''}" type="button" data-char-id="${charId}" ${isCurrentProfile ? 'disabled' : ''}>변경</button>
            <button class="${fragmentClass}" type="button" data-char-id="${charId}" ${canUpgrade ? '' : 'disabled'}>${fragmentLabel}</button>
          </div>
        `;
      } else {
        slot.className = 'codex-slot codex-slot--empty';
        slot.innerHTML = `
          <div class="codex-circle">
            <span class="codex-empty-icon" aria-hidden="true">?</span>
          </div>
        `;
      }
    } else {
      slot.className = 'codex-slot codex-slot--future';
      slot.innerHTML = `
        <div class="codex-circle">
          <span class="codex-future-icon" aria-hidden="true">🔒</span>
        </div>
      `;
    }

    grid.appendChild(slot);

    if (isCollected && charId > 0) {
      if (newCharIds.includes(charId)) {
        addBlink(slot.querySelector('.codex-circle'), 'codex-circle--blink');
      }
      const fragBtn = slot.querySelector('.codex-fragment-btn');
      if (!canUpgrade && newFragmentIds.includes(charId)) {
        addBlink(fragBtn, 'codex-fragment-btn--blink');
      } else if (canUpgrade && newUpgradeIds.includes(charId)) {
        addBlink(fragBtn, 'codex-fragment-btn--upgrade-blink');
      }
    }
  }

  grid.querySelectorAll<HTMLButtonElement>('.codex-change-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const charId = Number(btn.dataset.charId);
      changeProfileCharacter(charId, btn);
    });
  });

  grid.querySelectorAll<HTMLButtonElement>('.codex-fragment-btn--active').forEach(btn => {
    btn.addEventListener('click', () => {
      const charId = Number(btn.dataset.charId);
      btn.disabled = true;
      btn.textContent = '처리 중...';
      executeUpgrade(charId, profileGrade);
    });
  });
}

// ── 초기화 ────────────────────────────────────────────────────────
export function initCharacterCodex(): void {
  getEl('codexCloseBtn').addEventListener('click', () => {
    playClick();
    hideCharacterCodexPopup();
  });

  getEl('characterCodexOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideCharacterCodexPopup();
  });

  getEl('codexBtn').addEventListener('click', () => {
    playClick();
    showCharacterCodexPopup();
  });

  getEl('codexConfirmBtn').addEventListener('click', () => {
    playClick();
    hideCodexConfirm();
  });
}
