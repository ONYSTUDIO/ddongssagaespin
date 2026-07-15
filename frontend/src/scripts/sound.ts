import bgmMp3 from '../assets/audio/bgm/bgm_ingame.mp3';
import bgmOgg from '../assets/audio/bgm/bgm_ingame.ogg';
import reelStopMp3 from '../assets/audio/reel/reel_stop.mp3';
import reelStopOgg from '../assets/audio/reel/reel_stop.ogg';
import buttonMp3 from '../assets/audio/ui/button.mp3';
import buttonOgg from '../assets/audio/ui/button.ogg';
import minigameBgmOgg from '../assets/audio/minigame/bgm_minigame.ogg';

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

// ── 릴 스탑 효과음 ───────────────────────────────────────────────
let reelStopBuffer: AudioBuffer | null = null;

async function loadReelStopBuffer(): Promise<void> {
  if (reelStopBuffer) return;
  const ac = getCtx();
  const canOgg = new Audio().canPlayType('audio/ogg') !== '';
  const url = canOgg ? reelStopOgg : reelStopMp3;
  const res = await fetch(url);
  const raw = await res.arrayBuffer();
  reelStopBuffer = await ac.decodeAudioData(raw);
}

loadReelStopBuffer().catch(() => {});

// ── 버튼 클릭 효과음 ─────────────────────────────────────────────
let buttonBuffer: AudioBuffer | null = null;

async function loadButtonBuffer(): Promise<void> {
  if (buttonBuffer) return;
  const ac = getCtx();
  const canOgg = new Audio().canPlayType('audio/ogg') !== '';
  const url = canOgg ? buttonOgg : buttonMp3;
  const res = await fetch(url);
  const raw = await res.arrayBuffer();
  buttonBuffer = await ac.decodeAudioData(raw);
}

loadButtonBuffer().catch(() => {});

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
    playClick();
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

// 현재 ingame BGM이 재생 중인지 (= 사용자가 BGM ON 상태인지)
export function isBgmEnabled(): boolean {
  return isPlaying;
}

// ── 미니게임 BGM ─────────────────────────────────────────────────────────────

let mgBuffer: AudioBuffer | null = null;
let mgSource: AudioBufferSourceNode | null = null;
let isMgPlaying = false;

async function loadMgBuffer(): Promise<void> {
  if (mgBuffer) return;
  const ac = getCtx();
  const res = await fetch(minigameBgmOgg);
  const raw = await res.arrayBuffer();
  mgBuffer = await ac.decodeAudioData(raw);
}

loadMgBuffer().catch(() => {});

export async function startMinigameBgm(): Promise<void> {
  if (isMgPlaying) return;
  const ac = getCtx();
  if (ac.state === 'suspended') await ac.resume();
  await loadMgBuffer();
  if (!gainNode || !mgBuffer) return;
  mgSource = ac.createBufferSource();
  mgSource.buffer = mgBuffer;
  mgSource.loop = true;
  mgSource.connect(gainNode);
  mgSource.start(0);
  isMgPlaying = true;
}

export function stopMinigameBgm(): void {
  mgSource?.stop();
  mgSource?.disconnect();
  mgSource = null;
  isMgPlaying = false;
}

// ── 효과음 ───────────────────────────────────────────────────────────────────

export function playClick(): void {
  if (!ctx || !gainNode || !buttonBuffer) return;
  const s = ctx.createBufferSource();
  s.buffer = buttonBuffer;
  s.connect(gainNode);
  s.start();
}
export function playReelSpin(): void {}
export function playReelStop(): void {
  if (!ctx || !gainNode || !reelStopBuffer) return;
  const s = ctx.createBufferSource();
  s.buffer = reelStopBuffer;
  s.connect(gainNode);
  s.start();
}
export function playWin(): void {}
export function playJackpot(): void {}
