import '../styles/characterCodex.css';

import dog01Src from '../assets/images/characters/dog_01.png';
import dog02Src from '../assets/images/characters/dog_02.png';
import dog03Src from '../assets/images/characters/dog_03.png';
import dog04Src from '../assets/images/characters/dog_04.png';
import dog05Src from '../assets/images/characters/dog_05.png';

import { supabase } from './supabase';

const DOG_IMAGES: Record<number, string> = {
  1001: dog01Src,
  1002: dog02Src,
  1003: dog03Src,
  1004: dog04Src,
  1005: dog05Src,
};

// 현재 정의된 5종 캐릭터 ID
const DEFINED_CHARACTERS = [1001, 1002, 1003, 1004, 1005];
// 3×3 = 9슬롯 (나머지 4칸은 미래 캐릭터용)
const TOTAL_SLOTS = 9;

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
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
}

// ── DB 조회 ─────────────────────────────────────────────────────────
async function fetchUserCharacters(): Promise<Set<number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from('user_characters')
    .select('character_id')
    .eq('user_id', user.id);

  if (error || !data) return new Set();
  return new Set(data.map((row: { character_id: number }) => row.character_id));
}

// ── 그리드 렌더링 ─────────────────────────────────────────────────
async function renderGrid(): Promise<void> {
  const grid = getEl('codexGrid');
  grid.innerHTML = '<p class="codex-loading">불러오는 중...</p>';

  const collected = await fetchUserCharacters();

  grid.innerHTML = '';

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const slot = document.createElement('div');

    if (i < DEFINED_CHARACTERS.length) {
      const charId = DEFINED_CHARACTERS[i];
      const isCollected = collected.has(charId);

      if (isCollected) {
        slot.className = 'codex-slot codex-slot--collected';
        slot.innerHTML = `
          <div class="codex-circle">
            <img class="codex-char-img" src="${DOG_IMAGES[charId]}" alt="캐릭터 ${charId}">
          </div>
          <button class="codex-change-btn" type="button" data-char-id="${charId}">변경</button>
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
      // 미래 캐릭터 슬롯
      slot.className = 'codex-slot codex-slot--future';
      slot.innerHTML = `
        <div class="codex-circle">
          <span class="codex-future-icon" aria-hidden="true">🔒</span>
        </div>
      `;
    }

    grid.appendChild(slot);
  }

  // 변경 버튼 이벤트 (추후 프로필 변경 기능 확장 시 여기서 처리)
  grid.querySelectorAll<HTMLButtonElement>('.codex-change-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // TODO: 프로필 캐릭터 변경 기능 구현 예정
      const toast = document.getElementById('metaToast');
      if (!toast) return;
      toast.textContent = '프로필 변경 기능은 준비 중입니다 🐾';
      toast.classList.add('meta-toast--visible');
      setTimeout(() => toast.classList.remove('meta-toast--visible'), 2500);
    });
  });
}

// ── 초기화 ────────────────────────────────────────────────────────
export function initCharacterCodex(): void {
  getEl('codexCloseBtn').addEventListener('click', hideCharacterCodexPopup);

  getEl('characterCodexOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideCharacterCodexPopup();
  });

  getEl('codexBtn').addEventListener('click', showCharacterCodexPopup);
}
