import '../styles/dailyReward.css';

import popTodayBgSrc from '../assets/images/popup/login/pop_login_bg.png';
import poopGoldSrc   from '../assets/images/popup/poop_gold_particle.png';
import btnOnSrc      from '../assets/images/buttons/btn_today_play_on.png';
import btnFocusSrc   from '../assets/images/buttons/btn_today_play_focus.png';

import { checkDailyReward, grantDailySpinReward, DAILY_SPIN_REWARD } from './spinManager';

type OnGrantCallback = (newSpinCount: number) => void;

let onGrantCallback: OnGrantCallback | null = null;

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── 초기화: 이미지 세팅 + 버튼 이벤트 등록 ──────────────────────────
export function initDailyReward(onGrant: OnGrantCallback): void {
  onGrantCallback = onGrant;

  getEl<HTMLImageElement>('dailyRewardBg').src      = popTodayBgSrc;
  getEl<HTMLImageElement>('dailyRewardPoopImg').src  = poopGoldSrc;

  const btnImg = getEl<HTMLImageElement>('dailyRewardBtnImg');
  btnImg.src = btnOnSrc;

  const btn = getEl<HTMLButtonElement>('dailyRewardBtn');
  btn.addEventListener('mouseenter', () => { btnImg.src = btnFocusSrc; });
  btn.addEventListener('mouseleave', () => { btnImg.src = btnOnSrc; });

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const newCount = await grantDailySpinReward();
    hideDailyRewardPopup();
    onGrantCallback?.(newCount);
  });
}

// ── 오늘 첫 로그인이면 팝업 표시 ─────────────────────────────────────
export async function checkAndShowDailyReward(): Promise<void> {
  const shouldShow = await checkDailyReward();
  if (shouldShow) showDailyRewardPopup();
}

export function showDailyRewardPopup(): void {
  const overlay = getEl('dailyRewardPopup');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('daily-reward-open');
  }));
}

export function hideDailyRewardPopup(): void {
  const overlay = getEl('dailyRewardPopup');
  overlay.classList.remove('daily-reward-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 400);
}

export { DAILY_SPIN_REWARD };
