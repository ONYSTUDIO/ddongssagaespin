import '../styles/minigame01.css';

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function buildGrid(): void {
  const grid = getEl('mg01Grid');
  grid.innerHTML = '';
  for (let i = 0; i < 36; i++) {
    const cell = document.createElement('button');
    cell.className = 'mg01-cell';
    cell.type = 'button';
    cell.setAttribute('aria-label', `${i + 1}번 칸`);
    cell.addEventListener('click', () => {
      if (cell.classList.contains('mg01-cell--revealed')) return;
      cell.classList.add('mg01-cell--revealed');
    });
    grid.appendChild(cell);
  }
}

function showIntro(): void {
  getEl('mg01Intro').style.display = '';
  getEl('mg01Game').style.display = 'none';
}

function showGame(): void {
  getEl('mg01Intro').style.display = 'none';
  getEl('mg01Game').style.display = '';
  buildGrid();
}

export function showMinigame01Popup(): void {
  const overlay = getEl('minigame01Overlay');
  overlay.removeAttribute('aria-hidden');
  showIntro();
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
  getEl('mg01CloseBtn').addEventListener('click', hideMinigame01Popup);
  getEl('mg01StartBtn').addEventListener('click', showGame);
}
