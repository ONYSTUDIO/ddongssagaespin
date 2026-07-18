import '../styles/support.css';
import { playClick } from './sound';
import { SUPPORT_PRODUCTS } from './supportService';
import { initiateTossPayment } from './paymentService';
import { supabase } from './supabase';

import gift1Src from '../assets/images/meta/support_gift/jjajang_1.png';
import gift2Src from '../assets/images/meta/support_gift/jjajang_2.png';

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function showSupportToast(msg: string): void {
  const el = document.getElementById('metaToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('meta-toast--visible');
  setTimeout(() => el.classList.remove('meta-toast--visible'), 2500);
}

function animateSupportIcon(): void {
  const icon = document.getElementById('metaIconSupport');
  if (!icon) return;
  icon.classList.remove('support-icon-pulse');
  void (icon as HTMLElement).offsetWidth;
  icon.classList.add('support-icon-pulse');
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function handleSend(amount: number, productName: string, btn: HTMLButtonElement): Promise<void> {
  btn.disabled = true;
  playClick();
  animateSupportIcon();
  try {
    const userId = await getCurrentUserId();
    await initiateTossPayment(amount, productName, userId);
  } catch (e) {
    btn.disabled = false;
    showSupportToast('결제 연결에 실패했습니다.');
    console.error('[Support] Toss error:', e);
  }
}

function renderProductGrid(): void {
  const grid = document.getElementById('supportProductGrid');
  if (!grid) return;

  const btnLabel = `황금똥 보내기 <img class="support-btn-icon" src="${gift1Src}" alt="">`;

  const presets = SUPPORT_PRODUCTS.map(p => `
    <div class="support-card" data-amount="${p.amount}" data-name="${p.name}">
      <div class="support-card-emoji">${p.emoji}</div>
      <div class="support-card-name">${p.name}</div>
      <div class="support-card-amount">${p.amount.toLocaleString()}원</div>
      <div class="support-card-desc">"${p.description}"</div>
      <button class="support-card-btn" type="button">${btnLabel}</button>
    </div>
  `).join('');

  const custom = `
    <div class="support-card support-card--custom">
      <div class="support-card-emoji">💛</div>
      <div class="support-card-name">직접 응원하기</div>
      <div class="support-card-input-wrap">
        <input class="support-card-input" id="supportCustomAmount" type="number" min="100" step="100" placeholder="금액 입력">
        <span class="support-card-input-unit">원</span>
      </div>
      <div class="support-card-desc">"마음껏 응원해주세요!"</div>
      <button class="support-card-btn" id="supportCustomBtn" type="button">${btnLabel}</button>
    </div>
  `;

  grid.innerHTML = presets + custom;

  grid.querySelectorAll<HTMLElement>('.support-card[data-amount]').forEach(card => {
    const btn = card.querySelector<HTMLButtonElement>('.support-card-btn')!;
    btn.addEventListener('click', () => {
      handleSend(Number(card.dataset.amount), card.dataset.name ?? '', btn);
    });
  });

  const customBtn = document.getElementById('supportCustomBtn') as HTMLButtonElement;
  customBtn.addEventListener('click', () => {
    const input  = document.getElementById('supportCustomAmount') as HTMLInputElement;
    const amount = parseInt(input.value, 10);
    if (!amount || amount < 100) { showSupportToast('금액을 입력해주세요!'); return; }
    handleSend(amount, '직접 응원하기', customBtn).then(() => { input.value = ''; });
  });
}

// ── 후원 완료 팝업 ─────────────────────────────────────────────────
export function showSupportCompletePopup(): void {
  const overlay = getEl('supportCompleteOverlay');
  (document.getElementById('supportCompleteImg1') as HTMLImageElement).src = gift1Src;
  (document.getElementById('supportCompleteImg2') as HTMLImageElement).src = gift2Src;
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('support-complete-open');
  }));
}

export function hideSupportCompletePopup(): void {
  const overlay = getEl('supportCompleteOverlay');
  overlay.classList.remove('support-complete-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 300);
}

export function initSupport(): void {
  renderProductGrid();

  getEl('supportPopupClose').addEventListener('click', () => {
    playClick();
    hideSupportPopup();
  });

  getEl('supportPopupOverlay').addEventListener('click', (e) => {
    if (e.target === getEl('supportPopupOverlay')) hideSupportPopup();
  });

  getEl('supportCompleteOk').addEventListener('click', () => {
    playClick();
    hideSupportCompletePopup();
  });

  getEl('supportCompleteOverlay').addEventListener('click', (e) => {
    if (e.target === getEl('supportCompleteOverlay')) hideSupportCompletePopup();
  });
}

export function showSupportPopup(): void {
  const overlay = getEl('supportPopupOverlay');
  overlay.removeAttribute('aria-hidden');
  renderProductGrid();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('support-popup-open');
  }));
}

export function hideSupportPopup(): void {
  const overlay = getEl('supportPopupOverlay');
  overlay.classList.remove('support-popup-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 300);
}
