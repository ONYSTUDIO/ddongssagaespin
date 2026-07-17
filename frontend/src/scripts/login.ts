import '../styles/login.css';

import popupBgSrc  from '../assets/images/popup/login/pop_login_bg_2.png';
import inputBgSrc  from '../assets/images/popup/login/input_bg.png';
import loginBtnSrc from '../assets/images/popup/login/login_button.png';
import corgiSrc    from '../assets/images/popup/login/main_corgi.png';
import { supabase } from './supabase';
import { playClick, startLoginBgm, stopLoginBgm } from './sound';

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

let pendingHideHandler: (() => void) | null = null;

export function showLoginScreen(): void {
  const screen = getEl('loginScreen');
  if (pendingHideHandler) {
    screen.removeEventListener('transitionend', pendingHideHandler);
    pendingHideHandler = null;
  }
  screen.style.display = '';
  screen.removeAttribute('aria-hidden');
  // 로그아웃 후 재진입 시 버튼 비활성 상태 초기화
  const btn = document.getElementById('loginBtn') as HTMLButtonElement | null;
  if (btn) btn.disabled = false;
  requestAnimationFrame(() => screen.classList.remove('login-screen--out'));
  startLoginBgm().catch(() => {});
}

export function hideLoginScreen(): void {
  stopLoginBgm();
  const screen = getEl('loginScreen');
  screen.classList.add('login-screen--out');
  screen.setAttribute('aria-hidden', 'true');
  pendingHideHandler = () => {
    screen.style.display = 'none';
    pendingHideHandler = null;
  };
  screen.addEventListener('transitionend', pendingHideHandler, { once: true });
}

export async function handleLoginSubmit(id: string, pw: string): Promise<string | null> {
  const email = `${id.trim()}@ddongssagae.app`;

  // 로그인 시도 (Rule 2: 기존 아이디 비밀번호 체크)
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pw });
  if (!signInErr) return null;

  // 로그인 실패 → 신규 유저면 자동 회원가입 (Rule 1)
  // signUp 성공 시 신규 유저는 session 반환, 기존 유저는 session null
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password: pw });
  if (!signUpErr && signUpData.session) return null;

  // 기존 아이디인데 비밀번호 불일치
  return '비밀번호가 올바르지 않습니다.';
}

const MIN_PW_LENGTH = 6;

export function initLogin(
  onLoginSuccess?: () => void,
  onLoginAttempt?: () => void,
  onLoginFail?: () => void,
): void {
  const screen   = getEl('loginScreen');
  const loginBtn = getEl<HTMLButtonElement>('loginBtn');
  const idInput  = getEl<HTMLInputElement>('loginId');
  const pwInput  = getEl<HTMLInputElement>('loginPw');
  const errorEl  = document.getElementById('loginError');

  // Vite 해시 URL 이미지 설정
  getEl<HTMLImageElement>('loginPopupBg').src = popupBgSrc;
  getEl<HTMLImageElement>('loginCorgiImg').src = corgiSrc;
  document.querySelectorAll<HTMLImageElement>('.login-input-bg-img').forEach(el => {
    el.src = inputBgSrc;
  });
  getEl<HTMLImageElement>('loginBtnImg').src = loginBtnSrc;

  // 자동재생 정책 대응: getSession보다 먼저 동기 등록
  // 로그인 버튼 클릭은 스킵 — 어차피 직후 stopLoginBgm()으로 취소됨
  const unlockLoginBgm = (e: Event) => {
    if ((e.target as Node) === loginBtn || loginBtn.contains(e.target as Node)) return;
    screen.removeEventListener('pointerdown', unlockLoginBgm);
    startLoginBgm().catch(() => {});
  };
  screen.addEventListener('pointerdown', unlockLoginBgm);

  // 기존 세션 확인 → 있으면 바로 게임 화면으로
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      screen.removeEventListener('pointerdown', unlockLoginBgm);
      hideLoginScreen();
      onLoginSuccess?.();
    } else {
      startLoginBgm().catch(() => {}); // 즉시 시도 (일부 데스크톱 브라우저 허용)
    }
  });

  loginBtn.addEventListener('click', async () => {
    const id = idInput.value.trim();
    const pw = pwInput.value;

    // Rule 3: 미입력 체크
    if (!id || !pw) {
      if (errorEl) errorEl.textContent = !id ? '아이디를 입력해주세요.' : '비밀번호를 입력해주세요.';
      return;
    }

    // 비밀번호 최소 길이 체크
    if (pw.length < MIN_PW_LENGTH) {
      if (errorEl) errorEl.textContent = `비밀번호는 ${MIN_PW_LENGTH}자 이상이어야 합니다.`;
      return;
    }

    playClick();
    loginBtn.disabled = true;
    if (errorEl) errorEl.textContent = '';

    // 로그인 시도 시 로그인 BGM 정지
    stopLoginBgm();

    // await 전 동기 구간에서 호출 → 모든 브라우저/iOS에서 user gesture로 인정
    onLoginAttempt?.();

    const err = await handleLoginSubmit(id, pw);
    if (err) {
      if (errorEl) errorEl.textContent = err;
      loginBtn.disabled = false;
      onLoginFail?.();
      startLoginBgm().catch(() => {});  // 로그인 실패 시 로그인 BGM 재시작
      return;
    }
    hideLoginScreen();
    onLoginSuccess?.();
  });

  // Enter 키로도 로그인
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !screen.hasAttribute('aria-hidden')) {
      loginBtn.click();
    }
  });
}
