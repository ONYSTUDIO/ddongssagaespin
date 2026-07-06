import '../styles/minigame01.css';
import { grantSpins } from './spinManager';
import { playClick } from './sound';
import { loadOwnedCharacters, isCharacterOwned, collectCharacter } from './characterManager';
import { markMinigameCompleted } from './redDot';

import dog01Src       from '../assets/images/characters/dog_01.png';
import dog02Src       from '../assets/images/characters/dog_02.png';
import dog03Src       from '../assets/images/characters/dog_03.png';
import dog04Src       from '../assets/images/characters/dog_04.png';
import dog05Src       from '../assets/images/characters/dog_05.png';
import ghostSrc       from '../assets/images/symbols/symbol_ghost.png';
import sweetPotatoSrc from '../assets/images/symbols/symbol_sweetpotato.png';
import goldenPoopSrc  from '../assets/images/symbols/symbol_poop_gold.png';
import corgiSrc       from '../assets/images/symbols/symbol_corgi.png';

// ── Cell Type Constants ────────────────────────────────────────────
export const CELL_TYPE = {
  EMPTY:        0,
  GOLDEN_POOP:  1,
  CORGI:        2,
  GHOST:        3,
  SWEET_POTATO: 4,
} as const;

export const DOG_CHARACTER_ID = {
  DOG_01: 1001,
  DOG_02: 1002,
  DOG_03: 1003,
  DOG_04: 1004,
  DOG_05: 1005,
} as const;

type FixedCellType   = 0 | 1 | 2 | 3 | 4;
type DogCharacterId  = 1001 | 1002 | 1003 | 1004 | 1005;
export type CellType = FixedCellType | DogCharacterId;

export const isDogCell = (t: number): t is DogCharacterId => t >= 1001;

// ── Asset Map ─────────────────────────────────────────────────────
const CELL_ASSETS: Record<number, string> = {
  [CELL_TYPE.GOLDEN_POOP]:   goldenPoopSrc,
  [CELL_TYPE.CORGI]:         corgiSrc,
  [CELL_TYPE.GHOST]:         ghostSrc,
  [CELL_TYPE.SWEET_POTATO]:  sweetPotatoSrc,
  [DOG_CHARACTER_ID.DOG_01]: dog01Src,
  [DOG_CHARACTER_ID.DOG_02]: dog02Src,
  [DOG_CHARACTER_ID.DOG_03]: dog03Src,
  [DOG_CHARACTER_ID.DOG_04]: dog04Src,
  [DOG_CHARACTER_ID.DOG_05]: dog05Src,
};

// ── Game Config ────────────────────────────────────────────────────
const GRID_SIZE          = 36;
const GRID_COLS          = 6;
const INITIAL_SELECTIONS = 10;
const MAX_AUTO_EXPAND    = 6;
const DANGER_TYPES       = new Set<number>([CELL_TYPE.GHOST, CELL_TYPE.SWEET_POTATO]);

// ── Game State ────────────────────────────────────────────────────
let mapData:         CellType[] = [];
let revealed:        boolean[]  = [];
let hintNumbers:     number[]   = [];
let selectionCount:  number     = 0;
let goldenPoopCount: number     = 0;
let foundDogIds:       number[]   = [];
let newCharacterCount: number     = 0;
let isGameOver:        boolean    = false;

// ── Helpers ──────────────────────────────────────────────────────
function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function getNeighbors(idx: number): number[] {
  const row = Math.floor(idx / GRID_COLS);
  const col = idx % GRID_COLS;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_COLS && nc >= 0 && nc < GRID_COLS) {
        result.push(nr * GRID_COLS + nc);
      }
    }
  }
  return result;
}

// ── Map Generation ────────────────────────────────────────────────
function generateMap(): CellType[] {
  const dogPool = Object.values(DOG_CHARACTER_ID) as DogCharacterId[];
  const shuffledDogs = [...dogPool].sort(() => Math.random() - 0.5).slice(0, 3);

  const items: CellType[] = [
    CELL_TYPE.GOLDEN_POOP, CELL_TYPE.GOLDEN_POOP, CELL_TYPE.GOLDEN_POOP, CELL_TYPE.GOLDEN_POOP,
    CELL_TYPE.CORGI,
    CELL_TYPE.GHOST, CELL_TYPE.GHOST, CELL_TYPE.GHOST,
    CELL_TYPE.SWEET_POTATO, CELL_TYPE.SWEET_POTATO, CELL_TYPE.SWEET_POTATO,
    ...shuffledDogs,
  ];

  while (items.length < GRID_SIZE) items.push(CELL_TYPE.EMPTY);

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

function computeHints(map: CellType[]): number[] {
  return map.map((cell, idx) => {
    if (cell !== CELL_TYPE.EMPTY) return 0;
    return getNeighbors(idx).filter(n => DANGER_TYPES.has(map[n])).length;
  });
}

// ── HUD ──────────────────────────────────────────────────────────
function updateHUD(): void {
  const selEl  = document.getElementById('mg01SelectionCount');
  const poopEl = document.getElementById('mg01PoopCount');
  const dogEl  = document.getElementById('mg01DogCount');
  if (selEl)  selEl.textContent  = String(Math.max(0, selectionCount));
  if (poopEl) poopEl.textContent = String(goldenPoopCount);
  if (dogEl)  dogEl.textContent  = String(newCharacterCount);
}

// ── Cell DOM ─────────────────────────────────────────────────────
function revealCellEl(idx: number): void {
  const grid = document.getElementById('mg01Grid');
  if (!grid) return;
  const cell = grid.children[idx] as HTMLButtonElement;
  if (!cell) return;

  cell.classList.add('mg01-cell--revealed');
  cell.disabled = true;

  const cellType = mapData[idx];

  if (cellType === CELL_TYPE.EMPTY) {
    const hint = hintNumbers[idx];
    if (hint > 0) {
      cell.textContent = String(hint);
      cell.dataset.hint = String(hint);
      cell.classList.add('mg01-cell--hint');
    } else {
      cell.classList.add('mg01-cell--empty');
    }
  } else {
    cell.dataset.cellType = String(cellType);
    const src = CELL_ASSETS[cellType];
    if (src) {
      const img = document.createElement('img');
      img.src       = src;
      img.className = 'mg01-cell-img';
      img.alt       = '';
      img.draggable = false;
      cell.appendChild(img);
    }
  }
}

// ── 말풍선 연출 ──────────────────────────────────────────────────
function showSelectionBubble(
  cellEl: HTMLElement,
  text: string,
  variant: 'danger' | 'bonus' | 'new',
): void {
  const bubble = document.createElement('span');
  bubble.className = `mg01-bubble mg01-bubble--${variant}`;
  bubble.textContent = text;
  cellEl.classList.add('mg01-cell--bubbling');
  cellEl.appendChild(bubble);

  if (variant === 'new') {
    bubble.classList.add('mg01-bubble--stay');
    // 신규 강아지 말풍선은 사라지지 않음
  } else {
    bubble.classList.add('mg01-bubble--float');
    bubble.addEventListener('animationend', () => {
      bubble.remove();
      cellEl.classList.remove('mg01-cell--bubbling');
    }, { once: true });
  }
}

// ── BFS Auto-expand ───────────────────────────────────────────────
function autoExpand(startIdx: number): void {
  let expanded  = 0;
  const visited = new Set<number>([startIdx]);
  const queue: number[] = [];

  for (const n of getNeighbors(startIdx)) {
    if (!revealed[n] && mapData[n] === CELL_TYPE.EMPTY && !visited.has(n)) {
      queue.push(n);
      visited.add(n);
    }
  }

  while (queue.length > 0 && expanded < MAX_AUTO_EXPAND) {
    const idx = queue.shift()!;
    if (revealed[idx]) continue;

    revealed[idx] = true;
    revealCellEl(idx);
    expanded++;

    if (hintNumbers[idx] === 0 && expanded < MAX_AUTO_EXPAND) {
      for (const n of getNeighbors(idx)) {
        if (!revealed[n] && mapData[n] === CELL_TYPE.EMPTY && !visited.has(n)) {
          queue.push(n);
          visited.add(n);
        }
      }
    }
  }
}

// ── Result ───────────────────────────────────────────────────────
function hideResultOverlay(): void {
  const resultEl = document.getElementById('mg01Result');
  if (resultEl) resultEl.classList.remove('mg01-result--open');
}

async function showResultScreen(): Promise<void> {
  const resultEl = document.getElementById('mg01Result');
  if (!resultEl) return;

  const poopEl = document.getElementById('mg01ResultPoop');
  const spinEl = document.getElementById('mg01ResultSpin');
  const dogEl  = document.getElementById('mg01ResultDog');
  if (poopEl) poopEl.textContent = String(goldenPoopCount);
  if (spinEl) spinEl.textContent = String(goldenPoopCount);
  if (dogEl)  dogEl.textContent  = String(foundDogIds.length);

  // 게임 화면은 그대로 두고 위에 오버레이로 표시 (네트워크 전에 먼저 표시)
  requestAnimationFrame(() => resultEl.classList.add('mg01-result--open'));
  markMinigameCompleted();

  // 획득한 스핀 지급 및 HUD 갱신 (오버레이 표시 후 비동기 처리)
  if (goldenPoopCount > 0) {
    try {
      const newCount = await grantSpins(goldenPoopCount, 'minigame');
      document.dispatchEvent(
        new CustomEvent('spinCountUpdated', { detail: { count: newCount } }),
      );
    } catch {
      // 네트워크 실패 시 HUD 갱신 생략
    }
  }
}

// ── Game Over ─────────────────────────────────────────────────────
function triggerGameOver(): void {
  if (isGameOver) return;
  isGameOver = true;

  for (let i = 0; i < GRID_SIZE; i++) {
    if (!revealed[i]) {
      revealed[i] = true;
      revealCellEl(i);
    }
  }

  setTimeout(showResultScreen, 1000);
}

// ── Cell Click ────────────────────────────────────────────────────
function handleCellClick(idx: number): void {
  if (isGameOver || revealed[idx]) return;

  const grid = document.getElementById('mg01Grid');
  const cellEl = grid?.children[idx] as HTMLElement | null;

  revealed[idx] = true;
  selectionCount--;
  revealCellEl(idx);

  const cellType = mapData[idx];

  if (cellType === CELL_TYPE.GOLDEN_POOP) {
    goldenPoopCount++;

  } else if (isDogCell(cellType)) {
    if (!foundDogIds.includes(cellType)) foundDogIds.push(cellType);
    const isNewToCollection = !isCharacterOwned(cellType);
    if (isNewToCollection) {
      newCharacterCount++;
      if (cellEl) showSelectionBubble(cellEl, 'New', 'new');
    }
    collectCharacter(cellType).catch(() => {});

  } else if (cellType === CELL_TYPE.CORGI) {
    selectionCount += 2; // net +1 after base -1
    if (cellEl) showSelectionBubble(cellEl, '+1', 'bonus');
    // TODO: 코기 발견 시 주변 일부 칸 공개 효과 검토

  } else if (cellType === CELL_TYPE.GHOST) {
    selectionCount--; // additional -1, total -2
    if (cellEl) showSelectionBubble(cellEl, '-1', 'danger');

  } else if (cellType === CELL_TYPE.SWEET_POTATO) {
    selectionCount--; // additional -1, total -2 (ghost와 동일)
    if (cellEl) showSelectionBubble(cellEl, '-1', 'danger');

  } else if (cellType === CELL_TYPE.EMPTY && hintNumbers[idx] === 0) {
    autoExpand(idx);
  }

  updateHUD();

  const allRevealed = revealed.every(Boolean);
  if (selectionCount <= 0 || allRevealed) {
    triggerGameOver();
  }
}

// ── Build Grid ────────────────────────────────────────────────────
function buildGrid(): void {
  const grid = getEl('mg01Grid');
  grid.innerHTML = '';

  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement('button');
    cell.className = 'mg01-cell';
    cell.type      = 'button';
    cell.setAttribute('aria-label', `${i + 1}번 칸`);
    const idx = i;
    cell.addEventListener('click', () => handleCellClick(idx));
    grid.appendChild(cell);
  }
}

// ── Game Start ────────────────────────────────────────────────────
function startGame(): void {
  mapData        = generateMap();
  revealed       = Array(GRID_SIZE).fill(false);
  hintNumbers    = computeHints(mapData);
  selectionCount = INITIAL_SELECTIONS;
  goldenPoopCount   = 0;
  foundDogIds       = [];
  newCharacterCount = 0;
  isGameOver        = false;

  const introEl  = document.getElementById('mg01Intro');
  const resultEl = document.getElementById('mg01Result');
  const gameEl   = document.getElementById('mg01Game');
  if (introEl)  introEl.style.display = 'none';
  if (resultEl) resultEl.classList.remove('mg01-result--open');
  if (gameEl)   gameEl.style.display   = '';

  buildGrid();
  updateHUD();
}

// ── Popup Controls ────────────────────────────────────────────────
function showIntro(): void {
  const introEl  = document.getElementById('mg01Intro');
  const gameEl   = document.getElementById('mg01Game');
  const resultEl = document.getElementById('mg01Result');
  if (introEl)  introEl.style.display  = '';
  if (gameEl)   gameEl.style.display   = 'none';
  if (resultEl) resultEl.classList.remove('mg01-result--open');
}

export function showMinigame01Popup(): void {
  const overlay = getEl('minigame01Overlay');
  overlay.removeAttribute('aria-hidden');
  // Reset to intro screen each time popup opens
  mapData     = [];
  isGameOver  = false;
  showIntro();
  loadOwnedCharacters().catch(() => {}); // 보유 캐릭터 캐시 갱신
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('mg01-open');
  }));
}

export function hideMinigame01Popup(): void {
  const overlay = getEl('minigame01Overlay');
  overlay.classList.remove('mg01-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 300);
}

export function initMinigame01(): void {
  getEl('mg01CloseBtn').addEventListener('click', () => { playClick(); hideMinigame01Popup(); });
  getEl('mg01StartBtn').addEventListener('click', startGame);

  const confirmBtn = document.getElementById('mg01ConfirmBtn');
  if (confirmBtn) confirmBtn.addEventListener('click', () => { playClick(); hideResultOverlay(); });

  const resultCloseBtn = document.getElementById('mg01ResultCloseBtn');
  if (resultCloseBtn) resultCloseBtn.addEventListener('click', () => { playClick(); hideResultOverlay(); });
}
