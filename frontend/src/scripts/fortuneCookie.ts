import '../styles/fortuneCookie.css';

import cookie01 from '../assets/images/meta/fortune/fortune_cookie_break_01.png';
import cookie02 from '../assets/images/meta/fortune/fortune_cookie_break_02.png';
import cookie03 from '../assets/images/meta/fortune/fortune_cookie_break_03.png';
import cookie04 from '../assets/images/meta/fortune/fortune_cookie_break_04.png';
import cookie05 from '../assets/images/meta/fortune/fortune_cookie_break_05.png';
import hammerSrc from '../assets/images/meta/fortune/fortune_hammer.png';
import paperSrc  from '../assets/images/meta/fortune/fortune_paper_2.png';
import { getRandomFortuneCookieMessage, saveFortuneCookieMessage } from './fortuneCookieMessages';
import { markFortuneCookieChecked, markFortuneCookieMessageWritten } from './fortuneCookieDaily';
import { saveFortuneCookieLog } from './history';
import { grantSpinsWithResult } from './spinManager';
import { supabase } from './supabase';
import { playClick } from './sound';
import { updateFortuneCookieRedDot } from './redDot';

const BREAK_FRAMES = [cookie01, cookie02, cookie03, cookie04, cookie05];
const FRAME_DURATION = 250; // 4 transitions × 250ms = 1s
const MAX_FORTUNE_COOKIE_MESSAGE_LENGTH = 50;
const FORTUNE_COOKIE_SPIN_REWARD = 10;

// ── 가이드 콜백 훅 ────────────────────────────────────────────────────────────
let onPopupOpenCallback:    (() => void) | null = null;
let onResultActionsCallback: (() => void) | null = null;

export function setOnFortuneCookieOpenCallback(cb: () => void): void {
  onPopupOpenCallback = cb;
}

export function setOnFortuneCookieActionsCallback(cb: () => void): void {
  onResultActionsCallback = cb;
}

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── 폰트 크기 자동 조절 ──────────────────────────────────────────────────────
function adjustMsgFontSize(el: HTMLElement, text: string): void {
  const len = text.length;
  const rem = len <= 20 ? 0.75
            : len <= 40 ? 0.65
            : len <= 65 ? 0.56
            : 0.50;
  el.style.fontSize = `${rem}rem`;
}

// ── 로그인 사용자 정보 ────────────────────────────────────────────────────────
async function getCurrentUser(): Promise<{ id: string; author: string | null } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const email = user.email ?? '';
  const author = email.includes('@') ? email.split('@')[0] : null;
  return { id: user.id, author };
}

// ── 초기화 ────────────────────────────────────────────────────────────────────
export function initFortuneCookie(): void {
  getEl<HTMLImageElement>('fcCookieImg').src = cookie01;
  getEl<HTMLImageElement>('fcHammerImg').src = hammerSrc;
  getEl<HTMLImageElement>('fcPaperImg').src  = paperSrc;
  getEl<HTMLImageElement>('fcCreatePaperImg').src = paperSrc;

  getEl('fcCloseBtn').addEventListener('click', () => { playClick(); hideFortuneCookiePopup(); });
  getEl('fcHammerBtn').addEventListener('click', playCookieBreakAnimation);

  // 액션 버튼
  getEl('fcActionConfirm').addEventListener('click', () => { playClick(); hideFortuneCookiePopup(); });
  getEl('fcActionCreate').addEventListener('click', () => {
    playClick();
    hideFortuneCookiePopup();
    setTimeout(openFortuneCookieCreatePopup, 350);
  });

  // 작성 팝업
  initFortuneCookieCreate();

  // 제한 팝업
  getEl('fcLimitCloseBtn').addEventListener('click', () => { playClick(); hideFortuneCookieLimitPopup(); });
  getEl('fcLimitConfirmBtn').addEventListener('click', () => { playClick(); hideFortuneCookieLimitPopup(); });
}

// ── 메인 팝업 열기/닫기/리셋 ─────────────────────────────────────────────────
export function showFortuneCookiePopup(): void {
  resetFortuneCookiePopup();
  const overlay = getEl('fortuneCookieOverlay');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('fc-open');
  }));
  // 팝업 트랜지션(0.3s) 완료 후 가이드 콜백 실행
  const cb = onPopupOpenCallback;
  onPopupOpenCallback = null;
  if (cb) setTimeout(cb, 380);
}

export function hideFortuneCookiePopup(): void {
  const overlay = getEl('fortuneCookieOverlay');
  overlay.classList.remove('fc-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 350);
}

export function resetFortuneCookiePopup(): void {
  getEl<HTMLImageElement>('fcCookieImg').src = cookie01;

  const intro = getEl('fcIntro');
  intro.style.visibility = '';

  const hammerBtn = getEl<HTMLButtonElement>('fcHammerBtn');
  hammerBtn.style.display = '';
  hammerBtn.disabled = false;

  getEl('fcHammerImg').classList.remove('fc-hammer-strike');

  const paperWrap = getEl('fcPaperWrap');
  paperWrap.classList.remove('fc-paper-appear');
  paperWrap.style.display = 'none';

  const msgEl   = getEl('fcMsg');
  const msgText = getEl('fcMsgText');
  msgEl.classList.remove('fc-msg-visible');
  msgText.textContent = '';
  (msgText as HTMLElement).style.fontSize = '';

  getEl('fcCookieWrap').classList.remove('fc-zoomed');
  getEl('fcActions').classList.remove('fc-actions--visible');
}

// ── 쿠키 깨짐 애니메이션 ─────────────────────────────────────────────────────
export function playCookieBreakAnimation(): void {
  const hammerBtn = getEl<HTMLButtonElement>('fcHammerBtn');
  const hammerImg = getEl('fcHammerImg');
  const intro     = getEl('fcIntro');
  const cookieImg = getEl<HTMLImageElement>('fcCookieImg');

  hammerBtn.disabled = true;
  intro.style.visibility = 'hidden';

  getEl('fcCookieWrap').classList.add('fc-zoomed');
  hammerImg.classList.add('fc-hammer-strike');

  setTimeout(() => {
    hammerBtn.style.display = 'none';

    let frameIndex = 1;
    const interval = setInterval(() => {
      cookieImg.src = BREAK_FRAMES[frameIndex];
      frameIndex++;
      if (frameIndex >= BREAK_FRAMES.length) {
        clearInterval(interval);
        showFortunePaper();
      }
    }, FRAME_DURATION);
  }, 500);
}

// ── 종이 등장 + 메시지 표시 ──────────────────────────────────────────────────
export function showFortunePaper(): void {
  const paperWrap = getEl('fcPaperWrap');
  const msgEl     = getEl('fcMsg');
  const msgText   = getEl('fcMsgText');

  paperWrap.style.display = 'block';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    paperWrap.classList.add('fc-paper-appear');
  }));

  const fetchPromise = getRandomFortuneCookieMessage();

  setTimeout(async () => {
    msgText.textContent = '행운 메시지를 꺼내는 중...';
    (msgText as HTMLElement).style.fontSize = '0.58rem';
    msgEl.classList.add('fc-msg-visible');

    const msg = await fetchPromise;
    adjustMsgFontSize(msgText as HTMLElement, msg.message);
    msgText.textContent = msg.message;

    // 오늘 쿠키 확인 완료 기록 + 로그 저장
    const user = await getCurrentUser();
    if (user) {
      try { await markFortuneCookieChecked(user.id); } catch (_) { /* silent */ }
      try { await saveFortuneCookieLog(msg.message); } catch (_) { /* silent */ }
      updateFortuneCookieRedDot(user.id).catch(() => { /* silent */ });
    }

    // 메시지 표시 후 액션 버튼 등장
    setTimeout(showFortuneCookieResultActions, 500);
  }, 1000);
}

// ── 결과 액션 버튼 표시 ──────────────────────────────────────────────────────
function showFortuneCookieResultActions(): void {
  getEl('fcActions').classList.add('fc-actions--visible');
  // 액션 등장 애니메이션(0.4s) 후 가이드 콜백 실행
  const cb = onResultActionsCallback;
  onResultActionsCallback = null;
  if (cb) setTimeout(cb, 450);
}

// ── 제한 팝업 열기/닫기 ──────────────────────────────────────────────────────
export function showFortuneCookieLimitPopup(): void {
  const overlay = getEl('fcLimitOverlay');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('fc-open');
  }));
}

export function hideFortuneCookieLimitPopup(): void {
  const overlay = getEl('fcLimitOverlay');
  overlay.classList.remove('fc-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 350);
}

// ── 작성 팝업 초기화 ─────────────────────────────────────────────────────────
function initFortuneCookieCreate(): void {
  const textarea  = getEl<HTMLTextAreaElement>('fcCreateTextarea');
  const countEl   = getEl('fcCreateCount');
  const maxEl     = getEl('fcCreateMax');

  // maxlength 상수 적용
  textarea.setAttribute('maxlength', String(MAX_FORTUNE_COOKIE_MESSAGE_LENGTH));
  maxEl.textContent = String(MAX_FORTUNE_COOKIE_MESSAGE_LENGTH);

  // 글자 수 카운터
  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    countEl.textContent = String(len);
    getEl('fcCreateError').textContent = '';
  });

  getEl('fcCreateCloseBtn').addEventListener('click', () => { playClick(); closeFortuneCookieCreatePopup(); });
  getEl('fcCreateSubmitBtn').addEventListener('click', submitFortuneCookieMessage);
}

// ── 작성 팝업 열기/닫기 ──────────────────────────────────────────────────────
export function openFortuneCookieCreatePopup(): void {
  const overlay  = getEl('fcCreateOverlay');
  const textarea = getEl<HTMLTextAreaElement>('fcCreateTextarea');
  const countEl  = getEl('fcCreateCount');

  // 상태 초기화
  textarea.value = '';
  countEl.textContent = '0';
  getEl('fcCreateError').textContent = '';
  getEl<HTMLButtonElement>('fcCreateSubmitBtn').disabled = false;

  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('fc-create-open');
  }));
  setTimeout(() => textarea.focus(), 350);
}

export function closeFortuneCookieCreatePopup(): void {
  const overlay = getEl('fcCreateOverlay');
  overlay.classList.remove('fc-create-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 350);
}

// ── 메시지 유효성 검사 ────────────────────────────────────────────────────────
function validateFortuneCookieMessage(text: string): string | null {
  if (!text.trim()) return '메세지를 입력해주세요.';
  if (text.length > MAX_FORTUNE_COOKIE_MESSAGE_LENGTH) {
    return `${MAX_FORTUNE_COOKIE_MESSAGE_LENGTH}자 이내로 입력해주세요.`;
  }
  return null;
}

// ── 저장 및 제출 ──────────────────────────────────────────────────────────────
async function submitFortuneCookieMessage(): Promise<void> {
  const textarea  = getEl<HTMLTextAreaElement>('fcCreateTextarea');
  const errorEl   = getEl('fcCreateError');
  const submitBtn = getEl<HTMLButtonElement>('fcCreateSubmitBtn');
  const text = textarea.value;

  const validationErr = validateFortuneCookieMessage(text);
  if (validationErr) {
    errorEl.textContent = validationErr;
    return;
  }

  submitBtn.disabled = true;
  errorEl.textContent = '저장 중...';
  errorEl.style.color = '#e0b0ff';

  // 1. 메시지 DB 저장
  const user   = await getCurrentUser();
  const author = user?.author ?? null;
  const { error: saveErr } = await saveFortuneCookieMessage(author, text.trim());

  if (saveErr) {
    errorEl.textContent = saveErr;
    errorEl.style.color = '#ff7070';
    submitBtn.disabled = false;
    return;
  }

  // 2. 스핀 +10 지급
  const { newCount, error: spinErr } = await grantSpinsWithResult(
    FORTUNE_COOKIE_SPIN_REWARD,
    'fortune_cookie',
  );

  if (spinErr) {
    errorEl.textContent = spinErr;
    errorEl.style.color = '#ff7070';
    // 메시지는 이미 저장됐으므로 버튼 재활성화 안 함 (중복 저장 방지)
    return;
  }

  // 3. wrote_message 처리
  if (user) {
    try { await markFortuneCookieMessageWritten(user.id); } catch (_) { /* silent */ }
    updateFortuneCookieRedDot(user.id).catch(() => { /* silent */ });
  }

  // 4. 인게임 스핀 UI 갱신
  document.dispatchEvent(
    new CustomEvent('spinCountUpdated', { detail: { count: newCount } }),
  );

  errorEl.textContent = `✓ 등록 완료! +${FORTUNE_COOKIE_SPIN_REWARD} SPIN 지급!`;
  errorEl.style.color = '#88ffbb';
  setTimeout(closeFortuneCookieCreatePopup, 1400);
}
