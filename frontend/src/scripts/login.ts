import '../styles/login.css';

import bgMainSrc   from '../assets/images/background/bg_main.png';
import popupBgSrc  from '../assets/images/popup/login/pop_login_bg.png';
import inputBgSrc  from '../assets/images/popup/login/input_bg.png';
import loginBtnSrc from '../assets/images/popup/login/login_button.png';

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

export function showLoginScreen(): void {
  const screen = getEl('loginScreen');
  screen.style.display = '';
  screen.removeAttribute('aria-hidden');
  requestAnimationFrame(() => screen.classList.remove('login-screen--out'));
}

export function hideLoginScreen(): void {
  const screen = getEl('loginScreen');
  screen.classList.add('login-screen--out');
  screen.setAttribute('aria-hidden', 'true');
  screen.addEventListener('transitionend', () => {
    screen.style.display = 'none';
  }, { once: true });
}

// 추후 Node.js API 연동 시 이 함수만 수정
export async function handleLoginSubmit(_id: string, _pw: string): Promise<void> {
  // TODO: const res = await fetch('/api/login', { method: 'POST', ... });
  return Promise.resolve();
}

export function initLogin(): void {
  const screen   = getEl('loginScreen');
  const loginBtn = getEl<HTMLButtonElement>('loginBtn');
  const idInput  = getEl<HTMLInputElement>('loginId');
  const pwInput  = getEl<HTMLInputElement>('loginPw');

  // Vite 해시 URL 이미지 설정
  screen.style.backgroundImage = `url('${bgMainSrc}')`;
  getEl<HTMLImageElement>('loginPopupBg').src = popupBgSrc;
  document.querySelectorAll<HTMLImageElement>('.login-input-bg-img').forEach(el => {
    el.src = inputBgSrc;
  });
  getEl<HTMLImageElement>('loginBtnImg').src = loginBtnSrc;

  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    await handleLoginSubmit(idInput.value, pwInput.value);
    hideLoginScreen();
  });

  // Enter 키로도 로그인
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !screen.hasAttribute('aria-hidden')) {
      loginBtn.click();
    }
  });
}
