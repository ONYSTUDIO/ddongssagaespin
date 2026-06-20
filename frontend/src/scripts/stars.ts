const STAR_COUNT = 140;
const MEGA_COUNT = 12;

const NEON_COLORS: Array<{ color: string; glow: string }> = [
  { color: '#ffffff', glow: 'rgba(200,220,255,0.45)' },
  { color: '#70d4ff', glow: 'rgba(80,190,255,0.45)' },
  { color: '#b87fff', glow: 'rgba(160,90,255,0.45)' },
  { color: '#ff70d0', glow: 'rgba(255,80,190,0.45)' },
  { color: '#70ffea', glow: 'rgba(60,255,210,0.40)' },
  { color: '#ffe870', glow: 'rgba(255,220,60,0.40)'  },
];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeStar(size: number, isBright: boolean, isMega: boolean): HTMLDivElement {
  const star = document.createElement('div');
  const neon = pick(NEON_COLORS);

  star.className = 'star';
  if (isMega)        star.classList.add('star--mega');
  else if (isBright) star.classList.add('star--bright');

  star.style.width  = `${size}px`;
  star.style.height = `${size}px`;
  star.style.left   = `${rand(0, 100)}vw`;
  star.style.top    = `${rand(0, 100)}vh`;

  star.style.setProperty('--color', neon.color);
  star.style.setProperty('--glow',  neon.glow);
  star.style.setProperty('--dur',   `${rand(1.8, 5.0).toFixed(2)}s`);
  star.style.setProperty('--delay', `-${rand(0, 7).toFixed(2)}s`);
  star.style.setProperty('--peak',  `${rand(0.65, 1.0).toFixed(2)}`);

  return star;
}

export function initStars(): void {
  const layer = document.createElement('div');
  layer.className = 'star-layer';
  document.body.appendChild(layer);

  // 일반 + 밝은 별
  for (let i = 0; i < STAR_COUNT; i++) {
    const size     = rand(1, 3.0);
    const isBright = size > 2.0 || Math.random() < 0.28;
    layer.appendChild(makeStar(size, isBright, false));
  }

  // 메가 네온 별 (크고 강한 글로우)
  for (let i = 0; i < MEGA_COUNT; i++) {
    const size = rand(2.8, 4.5);
    layer.appendChild(makeStar(size, false, true));
  }
}
