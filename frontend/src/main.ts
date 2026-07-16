import './styles/main.css';
import { initLogin } from './scripts/login';
import { supabase } from './scripts/supabase';
import { getRandomItem, SlotItem } from './scripts/game';
import { judgeResult } from './scripts/rules';
import { initReel, animateReel, nudgeReel, WIN_IDX } from './scripts/reel';
import { showResult } from './scripts/effects';
import { buildFortuneResult, loadFortuneMessages } from './scripts/fortune';
import { initPopup, showResultPopup, hideResultPopup } from './scripts/popup';
import { saveScore } from './scripts/ranking';
import { initMeta, setOnRankingPopupCloseCallback } from './scripts/meta';
import { initDailyReward, checkAndShowDailyReward } from './scripts/dailyReward';
import { getCurrentSpinCount, consumeSpin } from './scripts/spinManager';
import { saveSlotFortuneLog } from './scripts/history';
import { initStars } from './scripts/stars';
import { startBgm, stopBgm, initBgmBtn, playReelStop } from './scripts/sound';
import { initRedDots, markSpinRecordUpdated, updateProfileRedDot } from './scripts/redDot';
import { getCharacterSrc } from './scripts/characterCodex';
import { initProfilePopup } from './scripts/profile';
import { consumeSpinGuideConfirm, showSpinGuide, hideSpinGuide } from './scripts/spinGuide';
import { showFortuneCookieIconGuide, hideFortuneGuide, showMinigameIconGuide, showCodexGuide, showRankingGuide, showProfileGuide, setOnFortuneChainDoneCallback } from './scripts/fortuneGuide';
import { fetchGuideStep, saveGuideStep, GUIDE_STEP } from './scripts/onboardingGuide';
import { setOnMinigameCloseCallback } from './scripts/minigame01';

import spinOnSrc       from './assets/images/buttons/btn_spin_on.png';
import spinOffSrc      from './assets/images/buttons/btn_spin_off.png';
import spinFocusSrc    from './assets/images/buttons/btn_spin_focus.png';
import machineFrameSrc from './assets/images/machine/machine_frame.png';

const btn            = document.getElementById('spinBtn')        as HTMLButtonElement;
const btnImg         = document.getElementById('btnSpinImg')     as HTMLImageElement;
const machineFrameEl = document.getElementById('machineFrameImg') as HTMLImageElement;
const reel1          = document.getElementById('reel1')          as HTMLElement;
const reel2          = document.getElementById('reel2')          as HTMLElement;
const reel3          = document.getElementById('reel3')          as HTMLElement;
const resultEl       = document.getElementById('resultText')     as HTMLElement;
const spinCountEl    = document.getElementById('spinCountText')  as HTMLElement;
const hitLineEl      = document.getElementById('hitLine')        as HTMLElement;

let isSpinning     = false;  // 스핀 전체 진행 중 (릴 + 연출 포함)
let isReelAnimating = false;  // 릴 애니메이션 중에만 true (스킵 가능 구간)
let isSkipRequested = false;  // 스킵 중복 방지
let isInitializing  = false;  // 로그인 초기화 중 — 스핀 버튼 비활성화 차단
let noSpinMode      = false;  // 스핀 0개 상태 — 래퍼 클릭 시 안내 팝업 표시
let reelCancelFns: Array<() => void> = [];
let pendingPopupTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;    // 로그인 사용자 ID (가이드 step 저장용)
let pendingFortuneGuide = false;            // 다음 스핀 완료 시 포춘쿠키 가이드 실행 예약

// ── 스핀 부족 안내 팝업 ───────────────────────────────────────────
function showNoSpinPopup(): void {
  const overlay = document.getElementById('noSpinOverlay');
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('no-spin-open');
}

function hideNoSpinPopup(): void {
  const overlay = document.getElementById('noSpinOverlay');
  if (!overlay) return;
  overlay.classList.remove('no-spin-open');
  overlay.setAttribute('aria-hidden', 'true');
}

// ── 특수 연출 확률 (나중에 실제 확률로 조정) ──────────────────────
// 0 ~ SUSPENSE_THRESH: 서스펜스 / SUSPENSE_THRESH ~ NUDGE_THRESH: 넛지 / 나머지: 일반
const SUSPENSE_THRESH = 0.25;
const NUDGE_THRESH    = 0.50;

// ── 스핀 카운트 UI 업데이트 ───────────────────────────────────────
function updateSpinCountUI(count: number): void {
  spinCountEl.innerHTML = `<span class="spin-count-num">${count}</span> SPIN`;
  if (count <= 10) {
    spinCountEl.classList.remove('spin-normal');
    spinCountEl.classList.add('spin-low');
  } else {
    spinCountEl.classList.remove('spin-low');
    spinCountEl.classList.add('spin-normal');
  }
  if (!isSpinning && !isInitializing) {
    noSpinMode = count <= 0;
    btn.disabled = false;  // 스핀 0이어도 클릭 허용 — spin()에서 팝업 처리
    if (count <= 0) setBtnState('off');
  }
}

// ── 버튼 이미지 상태 전환 ─────────────────────────────────────────
function setBtnState(state: 'on' | 'off' | 'focus'): void {
  const map = { on: spinOnSrc, off: spinOffSrc, focus: spinFocusSrc };
  btnImg.src = map[state];
}

// ── 머신 프레임 로드 후 릴 초기화 ────────────────────────────────
function initAllReels(): void {
  initReel(reel1);
  initReel(reel2);
  initReel(reel3);
}

machineFrameEl.onload = initAllReels;
machineFrameEl.src = machineFrameSrc;
if (machineFrameEl.complete && machineFrameEl.naturalWidth > 0) initAllReels();

setBtnState('on');

// ── HUD 유저 정보 설정 ───────────────────────────────────────────
async function setHudUser(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.email?.split('@')[0] ?? '--';
  const usernameEl = document.getElementById('hudUsername');
  const avatarEl   = document.getElementById('hudAvatarImg') as HTMLImageElement | null;
  if (usernameEl) usernameEl.textContent = username;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_character_id, nickname')
      .eq('id', user.id)
      .single();
    if (avatarEl) avatarEl.src = getCharacterSrc(profile?.profile_character_id ?? 1001);
    const nickname = (profile as { nickname?: string | null } | null)?.nickname;
    if (usernameEl && nickname) usernameEl.textContent = `${nickname} (${username})`;
    updateProfileRedDot(!!nickname);
  }
}

// ── 로그인 성공 후 처리 ───────────────────────────────────────────
async function onLoginSuccess(): Promise<void> {
  setHudUser();
  startBgm();
  isInitializing = true;

  // 운세 메시지 DB 로드 (실패 시 하드코딩 폴백 유지)
  await loadFortuneMessages();

  // 스핀 카운트 표시 (isInitializing=true 이므로 버튼 비활성화 차단)
  const count = await getCurrentSpinCount();
  updateSpinCountUI(count);

  // 사용자 ID 취득 및 가이드 step 조회
  const { data: { user: authUser } } = await supabase.auth.getUser();
  currentUserId = authUser?.id ?? null;

  let guideStep = GUIDE_STEP.DONE;
  if (currentUserId) {
    guideStep = await fetchGuideStep(currentUserId);
  }

  // step 재진입 시 해당 가이드를 직접 시작하는 헬퍼들
  const uid = currentUserId;
  const startFortuneGuide = () => {
    setOnFortuneChainDoneCallback(() => {
      if (uid) saveGuideStep(uid, GUIDE_STEP.MINIGAME).catch(() => {});
      startMinigameGuide();
    });
    setTimeout(() => showFortuneCookieIconGuide(), 450);
  };
  const startMinigameGuide = () => {
    // 미니게임 팝업 닫힐 때 신규 캐릭터 획득 여부로 다음 step 결정 후 다음 가이드 실행
    setOnMinigameCloseCallback((charObtained) => {
      const nextStep = charObtained ? GUIDE_STEP.CODEX : GUIDE_STEP.RANKING;
      if (uid) saveGuideStep(uid, nextStep).catch(() => {});
      if (charObtained) startCodexGuide();
      else startRankingGuide();
    });
    setTimeout(() => showMinigameIconGuide(), 450);
  };
  const startCodexGuide = () => {
    setTimeout(() => showCodexGuide(() => {
      if (uid) saveGuideStep(uid, GUIDE_STEP.RANKING).catch(() => {});
    }), 450);
  };
  const startRankingGuide = () => {
    setTimeout(() => showRankingGuide(() => {
      if (uid) saveGuideStep(uid, GUIDE_STEP.PROFILE).catch(() => {});
      setOnRankingPopupCloseCallback(() => startProfileGuide());
    }), 450);
  };
  const startProfileGuide = () => {
    setTimeout(() => showProfileGuide(() => {
      if (uid) saveGuideStep(uid, GUIDE_STEP.DONE).catch(() => {});
    }), 450);
  };

  // 일일 보상 팝업 초기화 — 게임 시작 버튼 확인 후 해당 step 가이드 실행
  initDailyReward((newCount) => {
    updateSpinCountUI(newCount);
    if      (guideStep === GUIDE_STEP.SPIN)     setTimeout(() => showSpinGuide(), 450);
    else if (guideStep === GUIDE_STEP.FORTUNE)  startFortuneGuide();
    else if (guideStep === GUIDE_STEP.MINIGAME) startMinigameGuide();
    else if (guideStep === GUIDE_STEP.CODEX)    startCodexGuide();
    else if (guideStep === GUIDE_STEP.RANKING)  startRankingGuide();
    else if (guideStep === GUIDE_STEP.PROFILE)  startProfileGuide();
  });
  await checkAndShowDailyReward();

  // 일일 보상 팝업이 없는 경우: 해당 step 가이드 즉시 진행
  const needsGuide = guideStep === GUIDE_STEP.FORTUNE
    || guideStep === GUIDE_STEP.MINIGAME
    || guideStep === GUIDE_STEP.CODEX
    || guideStep === GUIDE_STEP.RANKING
    || guideStep === GUIDE_STEP.PROFILE;
  if (needsGuide) {
    const rewardPopup = document.getElementById('dailyRewardPopup');
    if (!rewardPopup?.classList.contains('daily-reward-open')) {
      if      (guideStep === GUIDE_STEP.FORTUNE)  startFortuneGuide();
      else if (guideStep === GUIDE_STEP.MINIGAME) startMinigameGuide();
      else if (guideStep === GUIDE_STEP.CODEX)    startCodexGuide();
      else if (guideStep === GUIDE_STEP.RANKING)  startRankingGuide();
      else                                        startProfileGuide();
    }
  }

  // 레드닷 초기화
  if (authUser) initRedDots(authUser.id).catch(() => { /* silent */ });

  isInitializing = false;

  // 일일 보상 팝업이 떠 있으면 버튼 상태를 건드리지 않음 (팝업 수령 시 콜백이 처리)
  const rewardPopup = document.getElementById('dailyRewardPopup');
  if (!rewardPopup?.classList.contains('daily-reward-open')) {
    updateSpinCountUI(count);
  }
}

initStars();
initProfilePopup();
initLogin(
  onLoginSuccess,
  () => startBgm(),  // await 전 동기 구간 호출 → 웹/Android/iOS 모두 user gesture로 인정
  () => stopBgm(),   // 로그인 실패 시 BGM 중단
);
initPopup();
initMeta();
initBgmBtn();

// 포춘쿠키 보상 등 외부에서 스핀 지급 시 UI 갱신
document.addEventListener('spinCountUpdated', (e) => {
  updateSpinCountUI((e as CustomEvent<{ count: number }>).detail.count);
});

// ── 호버 이벤트 ──────────────────────────────────────────────────
btn.addEventListener('mouseenter', () => { if (!isSpinning && !noSpinMode) setBtnState('focus'); });
btn.addEventListener('mouseleave', () => { if (!isSpinning && !noSpinMode) setBtnState('on');    });

// ── 스핀 버튼 더블클릭/더블탭 → 즉시 결과 스킵 ─────────────────
function handleSkip(): void {
  if (!isReelAnimating || isSkipRequested) return;
  isSkipRequested = true;
  reelCancelFns.forEach(fn => fn());
  reelCancelFns = [];
}
btn.addEventListener('dblclick', handleSkip);
let lastTapTime = 0;
btn.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTapTime < 350) {
    handleSkip();
    e.preventDefault();
  }
  lastTapTime = now;
}, { passive: false });

// ── SPIN 함수 ─────────────────────────────────────────────────────
async function spin(): Promise<void> {
  // 스핀 가이드에서 진입하는 경우: step 1 저장 + 포춘쿠키 가이드 예약
  if (consumeSpinGuideConfirm()) {
    pendingFortuneGuide = true;
    if (currentUserId) saveGuideStep(currentUserId, GUIDE_STEP.FORTUNE).catch(() => {});
  }
  hideSpinGuide();
  hideFortuneGuide();
  if (isSpinning) return;
  if (noSpinMode) { showNoSpinPopup(); return; }
  isSpinning = true;

  // 이전 스핀의 지연 팝업 타이머가 살아 있으면 취소
  if (pendingPopupTimer !== null) {
    clearTimeout(pendingPopupTimer);
    pendingPopupTimer = null;
  }

  setBtnState('off');
  resultEl.className = 'result-text';
  resultEl.textContent = '두근두근... 🎰';
  hideResultPopup();

  // 이전 히트 클론 제거 + 숨겨진 원본 심볼 복구
  const hitOverlay = document.getElementById('hitSymbolOverlay');
  if (hitOverlay) hitOverlay.innerHTML = '';
  hitLineEl.classList.remove('active');
  [reel1, reel2, reel3].forEach(r => {
    r.classList.remove('winner', 'jackpot');
    r.querySelectorAll<HTMLElement>('.reel-symbol').forEach(s => { s.style.opacity = ''; });
  });

  const final0 = getRandomItem();
  const final1 = getRandomItem();
  const final2 = getRandomItem();

  // 특수 연출 롤 — 셋 중 하나만 발생
  const roll        = Math.random();
  const isSuspense  = roll < SUSPENSE_THRESH;
  const isNudge     = roll >= SUSPENSE_THRESH && roll < NUDGE_THRESH;
  const suspenseMs  = isSuspense ? 1500 : 0;

  const results: Record<number, SlotItem> = {};
  const reelCenterIdx = [WIN_IDX, WIN_IDX, WIN_IDX];
  let stoppedCount = 0;

  const reelEls = [reel1, reel2, reel3];

  // consumeSpin() 완료 후 채워짐 — enableSpinBtn 클로저가 참조
  let remaining = 0;

  // 연출 종료 후 버튼 활성화
  function enableSpinBtn(): void {
    isSpinning = false;
    noSpinMode = remaining <= 0;
    btn.disabled = false;
    if (remaining > 0) setBtnState('on');
    else setBtnState('off');
  }

  function enableSpinBtnAndGuide(): void {
    enableSpinBtn();
    if (!pendingFortuneGuide) return;
    pendingFortuneGuide = false;
    const uid = currentUserId;
    setOnFortuneChainDoneCallback(() => {
      if (uid) saveGuideStep(uid, GUIDE_STEP.MINIGAME).catch(() => {});
      setOnMinigameCloseCallback((charObtained) => {
        const nextStep = charObtained ? GUIDE_STEP.CODEX : GUIDE_STEP.RANKING;
        if (uid) saveGuideStep(uid, nextStep).catch(() => {});
        if (charObtained) {
          setTimeout(() => showCodexGuide(() => {
            if (uid) saveGuideStep(uid, GUIDE_STEP.RANKING).catch(() => {});
            setTimeout(() => showRankingGuide(() => {
              if (uid) saveGuideStep(uid, GUIDE_STEP.PROFILE).catch(() => {});
              setOnRankingPopupCloseCallback(() => {
                setTimeout(() => showProfileGuide(() => {
                  if (uid) saveGuideStep(uid, GUIDE_STEP.DONE).catch(() => {});
                }), 450);
              });
            }), 450);
          }), 450);
        } else {
          setTimeout(() => showRankingGuide(() => {
            if (uid) saveGuideStep(uid, GUIDE_STEP.PROFILE).catch(() => {});
            setOnRankingPopupCloseCallback(() => {
              setTimeout(() => showProfileGuide(() => {
                if (uid) saveGuideStep(uid, GUIDE_STEP.DONE).catch(() => {});
              }), 450);
            });
          }), 450);
        }
      });
      setTimeout(() => showMinigameIconGuide(), 450);
    });
    setTimeout(() => showFortuneCookieIconGuide(), 300);
  }

  function runJudgment(): void {
    const judgment      = judgeResult(results[0].id, results[1].id, results[2].id);
    const fortuneResult = buildFortuneResult(judgment.grade, results[0].id, results[1].id, results[2].id);

    markSpinRecordUpdated();
    saveScore(judgment.grade, fortuneResult.luckScore);
    saveSlotFortuneLog(fortuneResult).catch(() => { /* silent */ });

    // 일반 꽝: 연출 없음 → 즉시 버튼 활성화 + 가이드 트리거
    if (!judgment.shouldShowResultPopup) {
      resultEl.className = 'result-text lose';
      resultEl.textContent = '꽝... 다음 스핀을 기대해보세요!';
      enableSpinBtnAndGuide();
      return;
    }

    // 히트 연출이 있는 경우: 팝업 닫힐 때 버튼 활성화 (릴 종료 시점에 명시적 비활성화)
    btn.disabled = true;
    hitLineEl.classList.add('active');
    showResult(fortuneResult);

    const ids = [results[0].id, results[1].id, results[2].id];
    const countMap: Record<string, number[]> = {};
    ids.forEach((id, i) => {
      if (!countMap[id]) countMap[id] = [];
      countMap[id].push(i);
    });
    const hitIndices = Object.values(countMap)
      .filter(arr => arr.length >= 2)
      .flat();

    if (judgment.shouldPlayHitEffect && hitIndices.length > 0) {
      const overlay = document.getElementById('hitSymbolOverlay');
      hitIndices.forEach(i => {
        const strip  = reelEls[i].querySelector('.reel-strip');
        const symbol = strip?.children[reelCenterIdx[i]] as HTMLImageElement | undefined;
        if (!symbol || !overlay) return;

        const rect  = symbol.getBoundingClientRect();
        const clone = document.createElement('img');
        clone.src   = symbol.src;
        clone.className    = 'hit-symbol-clone';
        // 문서 기준 좌표: getBoundingClientRect(뷰포트 상대) + 스크롤 오프셋
        clone.style.left   = `${rect.left + window.scrollX}px`;
        clone.style.top    = `${rect.top  + window.scrollY}px`;
        clone.style.width  = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        overlay.appendChild(clone);

        symbol.style.opacity = '0';
        setTimeout(() => {
          clone.remove();
          symbol.style.opacity = '';
        }, 1500);
      });
      pendingPopupTimer = setTimeout(() => {
        pendingPopupTimer = null;
        showResultPopup(fortuneResult, enableSpinBtnAndGuide);
      }, 1600);
    } else {
      showResultPopup(fortuneResult, enableSpinBtnAndGuide);
    }
  }

  function onReelStop(index: number, item: SlotItem): void {
    results[index] = item;
    stoppedCount++;
    playReelStop();  // 릴 하나 멈출 때마다 사운드
    if (stoppedCount < 3) return;

    // 릴 애니메이션 구간 종료
    isReelAnimating = false;
    reelCancelFns = [];

    if (isNudge) {
      setTimeout(() => {
        const nudgeIdx = Math.floor(Math.random() * 3);
        const dir: 'up' | 'down' = Math.random() < 0.5 ? 'up' : 'down';
        nudgeReel(reelEls[nudgeIdx], dir, (newItem, newIdx) => {
          results[nudgeIdx]       = newItem;
          reelCenterIdx[nudgeIdx] = newIdx;
          playReelStop();  // 넛지 릴 정착 시 사운드
          runJudgment();
        });
      }, 400);
    } else {
      runJudgment();
    }
  }

  // 릴 즉시 시작 — consumeSpin()과 병렬 실행
  isReelAnimating = true;
  isSkipRequested = false;
  reelCancelFns = [
    animateReel(reel1,  700,  final0, (item) => onReelStop(0, item)),
    animateReel(reel2, 1100,  final1, (item) => onReelStop(1, item)),
    animateReel(reel3, 1550,  final2, (item) => onReelStop(2, item), suspenseMs),
  ];

  // 스핀 차감 — 릴 애니메이션(최소 1550ms)과 병렬 실행
  const { success, remaining: rem } = await consumeSpin();
  if (!success) {
    // 차감 실패(스핀 부족 또는 오류): 릴 즉시 중단
    reelCancelFns.forEach(fn => fn());
    reelCancelFns = [];
    isReelAnimating = false;
    isSpinning = false;
    updateSpinCountUI(0);
    return;
  }
  remaining = rem;
  updateSpinCountUI(remaining);
  // 네트워크 지연으로 애니메이션이 이미 끝난 경우 버튼 상태 보정
  if (!isSpinning) {
    noSpinMode = remaining <= 0;
    btn.disabled = false;
    if (remaining > 0) setBtnState('on');
  }
}

btn.addEventListener('click', spin);

document.getElementById('noSpinClose')?.addEventListener('click', hideNoSpinPopup);
document.getElementById('noSpinConfirm')?.addEventListener('click', hideNoSpinPopup);
document.getElementById('noSpinOverlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) hideNoSpinPopup();
});
document.getElementById('noSpinGotoFortune')?.addEventListener('click', () => {
  hideNoSpinPopup();
  document.getElementById('metaBtnFortune')?.click();
});
document.getElementById('noSpinGotoMinigame')?.addEventListener('click', () => {
  hideNoSpinPopup();
  document.getElementById('metaBtnMinigame')?.click();
});
