import '../styles/popup.css';
import { Grade } from './game';
import { FortuneResult } from './fortune';

// ── 이미지 에셋 임포트 ────────────────────────────────────────────────────────

import fortuneBagSrc  from '../assets/images/popup/fortune_bag_idle.png';
import corgiBackSrc   from '../assets/images/popup/pop_corgi_back.png';
import corgiFrontSrc  from '../assets/images/popup/pop_corgi_front.png';

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

// scaleX 0 → 이미지 교체 → scaleX 1 (카드 플립 효과)
function flipImg(imgEl: HTMLImageElement, newSrc: string): void {
  imgEl.classList.add('popup-flipping');
  after(260, () => {
    imgEl.src = newSrc;
    imgEl.classList.remove('popup-flipping');
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
  [stage, cardWrap, cardContentEl].forEach(e => e.classList.remove('popup-visible', 'popup-hiding'));
  stageImg.classList.remove('popup-flipping');
  cardImg.classList.remove('popup-flipping');
  stageImg.src = '';
  cardImg.src  = '';

  // 결과 내용 채우기
  gradeBadge.textContent   = result.title;
  gradeBadge.dataset.grade = result.grade;
  resultMsgEl.textContent  = result.resultMessage;
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
    // 2. 복주머니 퇴장 → 코기 뒷면 등장
    after(1100, () => hideEl(stage));
    after(1500, () => { stageImg.src = corgiBackSrc;  showEl(stage); });
    // 3. 코기 앞면 flip
    after(2300, () => flipImg(stageImg, corgiFrontSrc));
    // 4. 코기 퇴장 → 카드 뒷면 등장
    after(3200, () => hideEl(stage));
    after(3600, () => { cardImg.src  = cards.back;    showEl(cardWrap); });
    // 5. 카드 앞면 flip → 텍스트 오버레이 등장
    after(4400, () => flipImg(cardImg, cards.front));
    after(5000, () => showEl(cardContentEl));
  } else {
    // 1. 복주머니 등장
    after(300,  () => { stageImg.src = fortuneBagSrc; showEl(stage); });
    // 2. 복주머니 퇴장 → 카드 뒷면 등장
    after(1100, () => hideEl(stage));
    after(1400, () => { cardImg.src  = cards.back;    showEl(cardWrap); });
    // 3. 카드 앞면 flip → 텍스트 오버레이 등장
    after(2200, () => flipImg(cardImg, cards.front));
    after(2800, () => showEl(cardContentEl));
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
    if (el) el.classList.remove('popup-visible', 'popup-hiding');
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
