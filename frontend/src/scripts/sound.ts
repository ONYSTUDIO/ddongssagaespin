import bgmMp3 from '../assets/audio/bgm/bgm_ingame.mp3';
import bgmOgg from '../assets/audio/bgm/bgm_ingame.ogg';

// ── BGM ───────────────────────────────────────────────────────────────────────

const bgm = new Audio();
bgm.loop   = true;
bgm.volume = 0.7;

const canOgg = bgm.canPlayType('audio/ogg') !== '';
bgm.src = canOgg ? bgmOgg : bgmMp3;

function getBgmBtn(): HTMLElement | null {
  return document.getElementById('bgmBtn');
}

function syncBtn(): void {
  getBgmBtn()?.classList.toggle('bgm-paused', bgm.paused);
}

export function startBgm(): void {
  bgm.play()
    .then(() => syncBtn())   // 재생 성공 → 일시정지 아이콘으로 전환
    .catch(() => syncBtn()); // 재생 차단 → 재생 아이콘으로 전환
}

export function stopBgm(): void {
  bgm.pause();
  bgm.currentTime = 0;
  syncBtn();
}

export function setBgmVolume(v: number): void {
  bgm.volume = Math.max(0, Math.min(1, v));
}

export function initBgmBtn(): void {
  const btn = getBgmBtn();
  if (!btn) return;

  // 초기 상태: 일시정지(▶ 아이콘) — 로그인 전엔 재생 안됨
  btn.classList.add('bgm-paused');

  btn.addEventListener('click', () => {
    if (bgm.paused) {
      bgm.play().catch(() => {});
      btn.classList.remove('bgm-paused');
    } else {
      bgm.pause();
      btn.classList.add('bgm-paused');
    }
  });
}

export function syncBgmBtn(): void {
  syncBtn();
}

// ── 효과음 (추후 구현) ────────────────────────────────────────────────────────

export function playClick(): void {}
export function playReelSpin(): void {}
export function playReelStop(): void {}
export function playWin(): void {}
export function playJackpot(): void {}
