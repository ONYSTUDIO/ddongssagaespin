import bgmMp3 from '../assets/audio/bgm/bgm_ingame.mp3';
import bgmOgg from '../assets/audio/bgm/bgm_ingame.ogg';

// ── Web Audio API BGM ─────────────────────────────────────────────────────────
// HTML Audio의 loop=true는 파일 끝에서 처음으로 seek하는 방식이라
// 브라우저/포맷에 관계없이 미세한 공백이 생긴다.
// AudioBufferSourceNode.loop는 샘플 단위로 루프하므로 공백이 없다.

let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let buffer: AudioBuffer | null = null;
let isPlaying = false;
let pauseOffset = 0;  // 일시정지 시점의 재생 위치 (초)
let startedAt = 0;    // ctx.currentTime 기준 소스 시작 시각

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    gainNode = ctx.createGain();
    gainNode.gain.value = 0.7;
    gainNode.connect(ctx.destination);
  }
  return ctx;
}

async function loadBuffer(): Promise<void> {
  if (buffer) return;
  const ac = getCtx();
  const canOgg = new Audio().canPlayType('audio/ogg') !== '';
  const url = canOgg ? bgmOgg : bgmMp3;
  const res = await fetch(url);
  const raw = await res.arrayBuffer();
  buffer = await ac.decodeAudioData(raw);
}

// 모듈 로드 시 백그라운드 사전 로딩
loadBuffer().catch(() => {});

function startSource(fromOffset = 0): void {
  if (!ctx || !gainNode || !buffer) return;
  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gainNode);
  source.start(0, fromOffset % buffer.duration);
  startedAt = ctx.currentTime - fromOffset;
  isPlaying = true;
}

function stopSource(): void {
  source?.stop();
  source?.disconnect();
  source = null;
  isPlaying = false;
}

// ── 버튼 동기화 ───────────────────────────────────────────────────────────────

function getBgmBtn(): HTMLElement | null {
  return document.getElementById('bgmBtn');
}

function syncBtn(): void {
  getBgmBtn()?.classList.toggle('bgm-paused', !isPlaying);
}

// ── 공개 API ─────────────────────────────────────────────────────────────────

export async function startBgm(): Promise<void> {
  const ac = getCtx();
  if (ac.state === 'suspended') await ac.resume();
  await loadBuffer();
  if (!isPlaying) {
    startSource(pauseOffset);
    syncBtn();
  }
}

export function stopBgm(): void {
  stopSource();
  pauseOffset = 0;
  syncBtn();
}

export function setBgmVolume(v: number): void {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, v));
}

export function initBgmBtn(): void {
  const btn = getBgmBtn();
  if (!btn) return;

  btn.classList.add('bgm-paused');

  btn.addEventListener('click', () => {
    if (!isPlaying) {
      startBgm().catch(() => {});
    } else {
      // 현재 재생 위치 저장 후 일시정지
      if (ctx && buffer) {
        pauseOffset = (ctx.currentTime - startedAt) % buffer.duration;
      }
      stopSource();
      syncBtn();
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
