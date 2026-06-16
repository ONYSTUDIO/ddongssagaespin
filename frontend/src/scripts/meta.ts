import '../styles/meta.css';

import fortuneCookieSrc from '../assets/images/meta/icons/icon_fortune_cookie.png';
import rankingSrc        from '../assets/images/meta/icons/meta_ranking.png';
import supportSrc        from '../assets/images/meta/icons/meta_support_gift.png';
import { fetchRanking, RankEntry } from './ranking';
import { supabase } from './supabase';
import { showLoginScreen } from './login';

const MOCK_RANKING: RankEntry[] = [
  { username: 'testuser2', best_score: 95 },
  { username: 'hey',       best_score: 95 },
];

// ── Toast ──────────────────────────────────────────────────────────
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
  const el = document.getElementById('metaToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('meta-toast--visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('meta-toast--visible'), 2500);
}

// ── Ranking popup ──────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  );
}

function renderPopupList(rows: RankEntry[]): void {
  const listEl = document.getElementById('rankingPopupList');
  if (!listEl) return;

  if (rows.length === 0) {
    listEl.innerHTML = '<li class="ranking-popup-empty">아직 기록이 없어요</li>';
    return;
  }

  listEl.innerHTML = rows.map((row, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
    return `<li class="ranking-popup-item">
      <span class="ranking-popup-rank">${medal}</span>
      <span class="ranking-popup-name">${escapeHtml(row.username)}</span>
      <span class="ranking-popup-score">${row.best_score}</span>
    </li>`;
  }).join('');
}

function openRankingPopup(): void {
  const overlay = document.getElementById('rankingPopupOverlay');
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('ranking-popup-open');

  const listEl = document.getElementById('rankingPopupList');
  if (listEl) listEl.innerHTML = '<li class="ranking-popup-empty">불러오는 중...</li>';

  fetchRanking()
    .then(rows => renderPopupList(rows.length > 0 ? rows : MOCK_RANKING))
    .catch(() => renderPopupList(MOCK_RANKING));

  document.addEventListener('keydown', handleEsc);
}

function closeRankingPopup(): void {
  const overlay = document.getElementById('rankingPopupOverlay');
  if (!overlay) return;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('ranking-popup-open');
  document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeRankingPopup();
}

// ── 사이드바 상단을 슬롯 머신 상단에 정렬 ─────────────────────────
// 머신 이미지 상단 투명 여백 비율 (machine_frame.png 기준, 필요 시 조정)
const MACHINE_TOP_OFFSET_RATIO = 0.08;

function alignSidebarToMachine(): void {
  const machine = document.querySelector('.machine') as HTMLElement | null;
  const sidebar = document.querySelector('.meta-sidebar') as HTMLElement | null;
  if (!machine || !sidebar) return;

  // 모바일(세로 스택)에서는 정렬 불필요
  if (window.innerWidth <= 560) {
    sidebar.style.paddingTop = '';
    return;
  }

  sidebar.style.paddingTop = '0';
  const machineRect = machine.getBoundingClientRect();
  const sidebarRect = sidebar.getBoundingClientRect();

  // 머신 div 상단 + 이미지 상단 투명 여백 보정
  const imageTopOffset = machineRect.height * MACHINE_TOP_OFFSET_RATIO;
  const diff = machineRect.top + imageTopOffset - sidebarRect.top;
  if (diff > 0) sidebar.style.paddingTop = `${diff}px`;
}

// ── Public API ─────────────────────────────────────────────────────
export function initMeta(): void {
  (document.getElementById('metaIconFortune') as HTMLImageElement).src = fortuneCookieSrc;
  (document.getElementById('metaIconRanking') as HTMLImageElement).src = rankingSrc;
  (document.getElementById('metaIconSupport') as HTMLImageElement).src = supportSrc;

  document.getElementById('metaBtnFortune')?.addEventListener('click', () => {
    showToast('준비중입니다 🍪');
  });

  document.getElementById('metaBtnRanking')?.addEventListener('click', () => {
    openRankingPopup();
  });

  document.getElementById('metaBtnSupport')?.addEventListener('click', () => {
    showToast('후원 기능 준비중입니다 🎁');
  });

  document.getElementById('metaBtnLogout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoginScreen();
  });

  document.getElementById('rankingPopupClose')?.addEventListener('click', closeRankingPopup);
  document.getElementById('rankingPopupOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeRankingPopup();
  });

  // 머신 프레임 이미지 로드 완료 후 정렬 (이미지 높이가 확정된 이후 측정)
  const machineFrame = document.getElementById('machineFrameImg') as HTMLImageElement;
  const doAlign = () => requestAnimationFrame(alignSidebarToMachine);
  if (machineFrame.complete && machineFrame.naturalWidth > 0) {
    doAlign();
  } else {
    machineFrame.addEventListener('load', doAlign);
  }

  window.addEventListener('resize', alignSidebarToMachine);
}
