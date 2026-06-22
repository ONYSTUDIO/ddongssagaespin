import '../styles/popup.css';
import { Grade } from './game';
import { FortuneResult } from './fortune';

// ── 이미지 에셋 임포트 ────────────────────────────────────────────────────────

import fortuneBagSrc  from '../assets/images/popup/fortune_bag_idle.png';
import particleSrc    from '../assets/images/effects/particle_01.png';
import poopGoldSrc    from '../assets/images/symbols/symbol_poop_gold.png';

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

// 문장 부호(. ! ?) 뒤 공백 기준으로 문장을 분리해 각각 <span> 블록으로 렌더링
function renderSentences(el: HTMLElement, text: string): void {
  el.innerHTML = '';
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  sentences.forEach(sentence => {
    const span = document.createElement('span');
    span.className = 'popup-sentence';
    span.textContent = sentence.trim();
    el.appendChild(span);
  });
}

// 카드 콘텐츠가 Safe Area를 넘칠 경우 결과 메시지 폰트를 단계적으로 축소
function fitContentToCard(contentEl: HTMLElement): void {
  const resultEl = contentEl.querySelector<HTMLElement>('.popup-result-msg');
  if (!resultEl) return;
  let i = 0;
  while (contentEl.scrollHeight > contentEl.clientHeight && i < 15) {
    const px = parseFloat(window.getComputedStyle(resultEl).fontSize);
    if (px <= 9) break;
    resultEl.style.fontSize = `${px - 0.5}px`;
    i++;
  }
}

// scaleX 0 → 이미지 교체 → scaleX 1 (카드 플립 효과)
function flipImg(imgEl: HTMLImageElement, newSrc: string): void {
  imgEl.classList.add('popup-flipping');
  after(260, () => {
    imgEl.src = newSrc;
    imgEl.classList.remove('popup-flipping');
  });
}

// 파티클 + 황금똥 이펙트: 코기 애니메이션 직후 stage 위에 오버레이
// stageEl 기준 absolute 배치, 애니메이션 완료 후 resolve
function playSuperLuckPoopEffect(stageEl: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const particle = document.createElement('img');
    particle.src = particleSrc;
    particle.className = 'popup-effect-element popup-effect-particle';

    const poop = document.createElement('img');
    poop.src = poopGoldSrc;
    poop.className = 'popup-effect-element popup-effect-poop';

    stageEl.appendChild(particle);
    stageEl.appendChild(poop);

    // 파티클 먼저
    requestAnimationFrame(() => requestAnimationFrame(() => {
      particle.classList.add('playing');
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

export function showResultPopup(result: FortuneResult): void {
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
  cardImg.src  = '';
  resultMsgEl.style.fontSize = ''; // 이전 자동 축소 리셋

  // 결과 내용 채우기
  gradeBadge.textContent   = result.title;
  gradeBadge.dataset.grade = result.grade;
  renderSentences(resultMsgEl, result.resultMessage);
  luckScoreEl.textContent  = String(result.luckScore);
  fortuneEl.textContent    = result.fortuneMessage;

  // 오버레이 열기 (두 번의 rAF로 transition 보장)
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('popup-open');
  }));

  const cards = getCardAssetsByGrade(result.grade);

  if (result.grade === 'SUPER_LUCK') {
    // 1. 복주머니 등장
    after(300,  () => { stageImg.src = fortuneBagSrc; showEl(stage); });
    // 2. 복주머니 퇴장
    after(1100, () => hideEl(stage));
    // 3. 코기 프레임 애니메이션 시작
    //    playCorgiAnimation 내부가 pending 타임아웃을 관리하므로
    //    hideResultPopup() 시 clearPending()으로 일괄 취소됨
    after(1500, () => {
      showEl(stage);
      playCorgiAnimation(stageImg, CORGI_SEQUENCE, () => {
        // 코기 frame5 유지 종료 → 황금똥 이펙트
        playSuperLuckPoopEffect(stage).then(() => {
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
    // 1. 복주머니 등장
    after(300,  () => { stageImg.src = fortuneBagSrc; showEl(stage); });
    // 2. 복주머니 퇴장 → 카드 뒷면 등장
    after(1100, () => hideEl(stage));
    after(1400, () => { cardImg.src  = cards.back;    showEl(cardWrap); });
    // 3. 카드 앞면 flip → 텍스트 오버레이 등장
    after(2200, () => flipImg(cardImg, cards.front));
    after(2800, () => { fitContentToCard(cardContentEl); showEl(cardContentEl); });
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

  after(350, () => overlay.setAttribute('aria-hidden', 'true'));
}

// 한 번만 호출: 이벤트 리스너 등록
export function initPopup(): void {
  const overlay  = getEl('resultPopup');
  const closeBtn = getEl('popupCloseBtn');

  closeBtn.addEventListener('click', hideResultPopup);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideResultPopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hasAttribute('aria-hidden')) {
      hideResultPopup();
    }
  });
}
