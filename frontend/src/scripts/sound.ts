import bgmMp3 from '../assets/audio/bgm/bgm_ingame.mp3';
import bgmOgg from '../assets/audio/bgm/bgm_ingame.ogg';

// ── BGM ───────────────────────────────────────────────────────────────────────

const bgm = new Audio();
bgm.loop   = true;
bgm.volume = 0.7;

// ogg 지원 시 ogg 우선, 아니면 mp3
const canOgg = bgm.canPlayType('audio/ogg') !== '';
bgm.src = canOgg ? bgmOgg : bgmMp3;

let bgmStarted = false;

export function startBgm(): void {
  if (bgmStarted) return;
  bgmStarted = true;
  bgm.play().catch(() => {
    // 자동재생 정책으로 막혔을 때 → 첫 터치/클릭 시 재생
    const resume = () => {
      bgm.play().catch(() => {});
      document.removeEventListener('click',     resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('click',      resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true, passive: true });
  });
}

export function stopBgm(): void {
  bgm.pause();
  bgm.currentTime = 0;
  bgmStarted = false;
}

export function setBgmVolume(v: number): void {
  bgm.volume = Math.max(0, Math.min(1, v));
}

// ── 효과음 (추후 구현) ────────────────────────────────────────────────────────

export function playClick(): void {}
export function playReelSpin(): void {}
export function playReelStop(): void {}
export function playWin(): void {}
export function playJackpot(): void {}
