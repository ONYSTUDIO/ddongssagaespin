import '../styles/popup.css';
import { Grade } from './game';
import { FortuneResult } from './fortune';
import { playClick } from './sound';

// ── 이미지 에셋 임포트 ────────────────────────────────────────────────────────

import particleSrc    from '../assets/images/effects/particle_01.png';

import corgiSymSrc       from '../assets/images/symbols/symbol_corgi.png';
import poopGoldSrc       from '../assets/images/symbols/symbol_poop_gold.png';
import bellSymSrc        from '../assets/images/symbols/symbol_bell.png';
import talismanSymSrc    from '../assets/images/symbols/symbol_talisman.png';
import ghostSymSrc       from '../assets/images/symbols/symbol_ghost.png';
import sweetpotatoSymSrc from '../assets/images/symbols/symbol_sweetpotato.png';

const SYMBOL_SRCS: Record<string, string> = {
  corgi:       corgiSymSrc,
  poop_gold:   poopGoldSrc,
  bell:        bellSymSrc,
  talisman:    talismanSymSrc,
  ghost:       ghostSymSrc,
  sweetpotato: sweetpotatoSymSrc,
};

import corgiFrame1 from '../assets/images/popup/corgi/pop_corgi_frame_1.png';
import corgiFrame2 from '../assets/images/popup/corgi/pop_corgi_frame_2.png';
import corgiFrame3 from '../assets/images/popup/corgi/pop_corgi_frame_3.png';
import corgiFrame4 from '../assets/images/popup/corgi/pop_corgi_frame_4.png';
import corgiFrame5 from '../assets/images/popup/corgi/pop_corgi_frame_5.png';

import cardPurpleBack  from '../assets/images/popup/cards/card_purple_back.png';
import cardPurpleFront from '../assets/images/popup/cards/card_purple_front.png';
import cardRedBack     from '../assets/images/popup/cards/card_red_back.png';
import cardRedFront    from '../assets/images/popup/cards/card_red_front.png';
import cardOrangeBack  from '../assets/images/popup/cards/card_orange_back.png';
import cardOrangeFront from '../assets/images/popup/cards/card_orange_front.png';
import cardGreenBack   from '../assets/images/popup/cards/card_green_back.png';
import cardGreenFront  from '../assets/images/popup/cards/card_green_front.png';
import cardGrayBack    from '../assets/images/popup/cards/card_gray_back.png';
import cardGrayFront   from '../assets/images/popup/cards/card_gray_front.png';

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface CardAssets {
  back: string;
  front: string;
}

// 프레임 한 장: 표시할 이미지 src + 다음 프레임까지 유지할 시간(ms)
interface FrameStep {
  src: string;
  duration: number;
}

// ── 코기 프레임 시퀀스 ────────────────────────────────────────────────────────
// 추후 프레임 추가·순서 변경은 이 배열만 수정하면 됨
const CORGI_SEQUENCE: FrameStep[] = [
  { src: corgiFrame1, duration: 100 },
  { src: corgiFrame2, duration: 100 },
  { src: corgiFrame3, duration: 100 },
  { src: corgiFrame2, duration: 100 },
  { src: corgiFrame3, duration: 100 },
  { src: corgiFrame2, duration: 100 },
  { src: corgiFrame3, duration: 200 }, // 2↔3 반복 후 약간 길게 → 다음 동작 예고
  { src: corgiFrame4, duration: 200 }, // 최종 포즈 준비
  { src: corgiFrame5, duration: 700 }, // 최종 포즈 유지 후 카드 등장
];

// ── 등급별 카드 에셋 매핑 ──────────────────────────────────────────────────────

const CARD_ASSETS: Record<Grade, CardAssets> = {
  SUPER_LUCK: { back: cardPurpleBack,  front: cardPurpleFront  },
  GREAT_LUCK: { back: cardRedBack,     front: cardRedFront     },
  GOOD_LUCK:  { back: cardOrangeBack,  front: cardOrangeFront  },
  SMALL_LUCK: { back: cardGreenBack,   front: cardGreenFront   },
  MISS:       { back: cardGrayBack,    front: cardGrayFront    },
};

export function getCardAssetsByGrade(grade: Grade): CardAssets {
  return CARD_ASSETS[grade];
}

// ── 내부 유틸 ─────────────────────────────────────────────────────────────────

let pending: ReturnType<typeof setTimeout>[] = [];
let popupOnClose: (() => void) | null = null;

function clearPending(): void {
  pending.forEach(clearTimeout);
  pending = [];
}

function after(ms: number, fn: () => void): void {
  pending.push(setTimeout(fn, ms));
}

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// fade-in: 두 번의 rAF로 transition이 확실히 발동되도록
function showEl(element: HTMLElement): void {
  element.classList.remove('popup-hiding');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    element.classList.add('popup-visible');
  }));
}

// fade-out: visible 제거 → hiding 추가 → transition 후 hiding 정리
function hideEl(element: HTMLElement): void {
  element.classList.remove('popup-visible');
  element.classList.add('popup-hiding');
  after(400, () => element.classList.remove('popup-hiding'));
}

// 배열 기반 프레임 애니메이션: 각 step의 src를 duration 간격으로 순서 재생
// 마지막 프레임 duration 경과 후 onComplete 호출
export function playCorgiAnimation(
  imgEl: HTMLImageElement,
  sequence: FrameStep[],
  onComplete: () => void,
): void {
  let elapsed = 0;
  for (const step of sequence) {
    const t   = elapsed;
    const src = step.src;
    after(t, () => { imgEl.src = src; });
    elapsed += step.duration;
  }
  after(elapsed, onComplete);
}

// 히트 심볼 이미지를 hitCount개 렌더링
function renderHitSymbols(el: HTMLElement, result: FortuneResult): void {
  el.innerHTML = '';
  const src = SYMBOL_SRCS[result.hitSymbol];
  if (!src || result.hitCount === 0) return;
  for (let i = 0; i < result.hitCount; i++) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'popup-hit-symbol';
    img.alt = '';
    el.appendChild(img);
  }
}

// 카드 콘텐츠가 Safe Area를 넘칠 경우 히트 심볼 크기를 단계적으로 축소
function fitContentToCard(contentEl: HTMLElement): void {
  const symbols = contentEl.querySelectorAll<HTMLImageElement>('.popup-hit-symbol');
  if (symbols.length === 0) return;
  let i = 0;
  while (contentEl.scrollHeight > contentEl.clientHeight && i < 8) {
    symbols.forEach(img => {
      const w = parseFloat(window.getComputedStyle(img).width);
      if (w > 22) img.style.width = `${w - 3}px`;
    });
    i++;
  }
}

// scaleX 0 → 이미지 교체 → scaleX 1 (카드 플립 효과)
// 300ms: CSS transition(260ms) 완료 후 발동 보장 — 모바일 setTimeout 지연 대응
// 이중 rAF: 새 이미지 디코딩 완료 후 역방향 전환 시작 — 모바일 뒷면 재노출 버그 방지
function flipImg(imgEl: HTMLImageElement, newSrc: string): void {
  imgEl.classList.add('popup-flipping');
  after(300, () => {
    imgEl.src = newSrc;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      imgEl.classList.remove('popup-flipping');
    }));
  });
}

// 파티클 + 황금똥 이펙트: 코기 애니메이션 직후 stage 위에 오버레이
// stageEl 기준 absolute 배치, 애니메이션 완료 후 resolve
// corgiImgEl: 황금똥 등장 시작과 동시에 서서히 페이드아웃 (코기가 싸고 사라지는 느낌)
function playSuperLuckPoopEffect(stageEl: HTMLElement, corgiImgEl: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    const particle = document.createElement('img');
    particle.src = particleSrc;
    particle.className = 'popup-effect-element popup-effect-particle';

    const poop = document.createElement('img');
    poop.src = poopGoldSrc;
    poop.className = 'popup-effect-element popup-effect-poop';

    stageEl.appendChild(particle);
    stageEl.appendChild(poop);

    // 파티클 먼저 + 코기 이미지 서서히 페이드아웃 (황금똥을 싸고 사라지는 느낌)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      particle.classList.add('playing');
      corgiImgEl.style.transition = 'opacity 0.5s ease-out';
      corgiImgEl.style.opacity = '0';
    }));

    // 황금똥은 살짝 딜레이 후 등장
    setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        poop.classList.add('playing');
      }));
    }, 150);

    // 파티클(900ms) + 황금똥 bounce(700ms) + hold(400ms) 뒤 resolve
    setTimeout(() => resolve(), 1250);
  });
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

export function showResultPopup(result: FortuneResult, onClose?: () => void): void {
  popupOnClose = onClose ?? null;
  clearPending();

  const overlay        = getEl('resultPopup');
  const stage          = getEl('popupStage');
  const stageImg       = getEl<HTMLImageElement>('popupStageImg');
  const cardWrap       = getEl('popupCardWrap');
  const cardImg        = getEl<HTMLImageElement>('popupCardImg');
  const cardContentEl  = getEl('popupCardContent');
  const gradeBadge     = getEl('popupGradeBadge');
  const resultMsgEl    = getEl('popupResultMsg');
  const luckScoreEl    = getEl('popupLuckScore');
  const fortuneEl      = getEl('popupFortuneMsg');

  // 이전 상태 완전 초기화
  stage.querySelectorAll('.popup-effect-element').forEach(el => el.remove());
  [stage, cardWrap, cardContentEl].forEach(e => e.classList.remove('popup-visible', 'popup-hiding'));
  stageImg.classList.remove('popup-flipping');
  cardImg.classList.remove('popup-flipping');
  stageImg.src = '';
  stageImg.style.opacity = '';
  stageImg.style.transition = '';
  cardImg.src  = '';

  // 결과 내용 채우기
  gradeBadge.textContent   = result.title;
  gradeBadge.dataset.grade = result.grade;
  renderHitSymbols(resultMsgEl, result);
  luckScoreEl.textContent  = String(result.luckScore);
  // 마침표·느낌표·물음표 뒤 줄바꿈 (문장 끝이 아닌 경우에만)
  fortuneEl.innerHTML = result.fortuneMessage
    .replace(/([.!?])\s*(?!\s*$)/g, '$1<br>');

  // 오버레이 열기 (두 번의 rAF로 transition 보장)
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('popup-open');
  }));

  const cards = getCardAssetsByGrade(result.grade);

  if (result.grade === 'SUPER_LUCK') {
    // [복주머니 연출 비활성화 — 추후 복원 가능]
    // // 1. 복주머니 등장
    // after(300,  () => { stageImg.src = fortuneBagSrc; showEl(stage); });
    // // 2. 복주머니 퇴장
    // after(1100, () => hideEl(stage));

    // 1. 코기 프레임 애니메이션 시작
    //    playCorgiAnimation 내부가 pending 타임아웃을 관리하므로
    //    hideResultPopup() 시 clearPending()으로 일괄 취소됨
    after(300, () => {
      showEl(stage);
      playCorgiAnimation(stageImg, CORGI_SEQUENCE, () => {
        // 코기 frame5 유지 종료 → 황금똥 이펙트
        playSuperLuckPoopEffect(stage, stageImg).then(() => {
          hideEl(stage);
          // 카드 뒷면 등장
          after(400,  () => { cardImg.src = cards.back; showEl(cardWrap); });
          // 카드 앞면 flip → 텍스트 오버레이 등장
          after(1200, () => flipImg(cardImg, cards.front));
          after(1800, () => { fitContentToCard(cardContentEl); showEl(cardContentEl); });
        });
      });
    });
  } else {
    // [복주머니 연출 비활성화 — 추후 복원 가능]
    // // 1. 복주머니 등장
    // after(300,  () => { stageImg.src = fortuneBagSrc; showEl(stage); });
    // // 2. 복주머니 퇴장 → 카드 뒷면 등장
    // after(1100, () => hideEl(stage));

    // 1. 카드 뒷면 등장
    after(300,  () => { cardImg.src = cards.back; showEl(cardWrap); });
    // 2. 카드 앞면 flip → 텍스트 오버레이 등장
    after(1100, () => flipImg(cardImg, cards.front));
    after(1700, () => { fitContentToCard(cardContentEl); showEl(cardContentEl); });
  }
}

export function hideResultPopup(): void {
  clearPending();
  const overlay = getEl('resultPopup');
  overlay.classList.remove('popup-open');

  // 자식 요소의 popup-visible 클래스를 즉시 제거:
  // 오버레이의 pointer-events:none이 자식의 auto를 막지 못하기 때문에
  // 클래스를 직접 지워 이벤트 차단 요소가 남지 않도록 한다.
  ['popupStage', 'popupCardWrap', 'popupCardContent'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('popup-visible', 'popup-hiding');
      el.querySelectorAll('.popup-effect-element').forEach(child => child.remove());
    }
  });

  after(350, () => {
    overlay.setAttribute('aria-hidden', 'true');
    const cb = popupOnClose;
    popupOnClose = null;
    cb?.();
  });
}

// 한 번만 호출: 이벤트 리스너 등록
export function initPopup(): void {
  getEl('popupCloseBtn').addEventListener('click', () => { playClick(); hideResultPopup(); });
}
