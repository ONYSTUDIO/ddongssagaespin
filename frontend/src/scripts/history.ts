import '../styles/history.css';
import { supabase } from './supabase';
import type { FortuneResult } from './fortune';

const PAGE_SIZE = 10;

export interface FortuneLog {
  id: string;
  log_type: string;
  fortune_type: string;
  luck_score: number | null;
  message: string;
  created_at: string;
}

function getEl<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function handleHistoryEsc(e: KeyboardEvent): void {
  if (e.key === 'Escape') hideHistoryPopup();
}

// ── 팝업 열기/닫기 ──────────────────────────────────────────────────
export function showHistoryPopup(): void {
  const overlay = getEl('historyOverlay');
  overlay.removeAttribute('aria-hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('history-popup-open');
  }));
  document.addEventListener('keydown', handleHistoryEsc);
  currentPage = 1;
  loadHistoryPage(currentPage);
}

export function hideHistoryPopup(): void {
  const overlay = getEl('historyOverlay');
  overlay.classList.remove('history-popup-open');
  setTimeout(() => overlay.setAttribute('aria-hidden', 'true'), 300);
  document.removeEventListener('keydown', handleHistoryEsc);
}

// ── DB 조회 ─────────────────────────────────────────────────────────
export async function fetchUserFortuneLogs(page: number): Promise<{ logs: FortuneLog[]; total: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { logs: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('user_fortune_logs')
    .select('id, log_type, fortune_type, luck_score, message, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) return { logs: [], total: 0 };
  return { logs: data as FortuneLog[], total: count ?? 0 };
}

// ── DB 저장 ─────────────────────────────────────────────────────────
export async function saveSlotFortuneLog(result: FortuneResult): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_fortune_logs').insert({
    user_id:      user.id,
    log_type:     'SLOT_RESULT',
    fortune_type: result.title,
    luck_score:   result.luckScore,
    message:      result.resultMessage,
  });
}

export async function saveFortuneCookieLog(message: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_fortune_logs').insert({
    user_id:      user.id,
    log_type:     'FORTUNE_COOKIE',
    fortune_type: '포춘쿠키',
    luck_score:   null,
    message,
  });
}

// ── 날짜 포맷 (KST YYYY-MM-DD HH:MM) ─────────────────────────────
function formatKstDate(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm   = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(kst.getUTCDate()).padStart(2, '0');
  const hh   = String(kst.getUTCHours()).padStart(2, '0');
  const min  = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  );
}

// ── 렌더링 ──────────────────────────────────────────────────────────
let currentPage = 1;
let totalCount  = 0;

export function renderHistoryList(logs: FortuneLog[]): void {
  const listEl = getEl('historyList');

  if (logs.length === 0) {
    listEl.innerHTML = '<li class="history-empty">아직 기록이 없습니다.</li>';
    return;
  }

  listEl.innerHTML = logs.map(log => {
    const luckStr = log.luck_score != null ? `행운지수 ${log.luck_score}` : '행운지수 -';
    return `<li class="history-item">
      <span class="history-date">${escapeHtml(formatKstDate(log.created_at))}</span>
      <span class="history-info">
        <span class="history-luck">${escapeHtml(luckStr)}</span>
        <span class="history-sep">|</span>
        <span class="history-type ${log.log_type === 'FORTUNE_COOKIE' ? 'history-type--cookie' : ''}">${escapeHtml(log.fortune_type)}</span>
        <span class="history-sep">|</span>
        <span class="history-msg">${escapeHtml(log.message)}</span>
      </span>
    </li>`;
  }).join('');
}

export function renderHistoryPagination(): void {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const prevBtn    = getEl<HTMLButtonElement>('historyPrevBtn');
  const nextBtn    = getEl<HTMLButtonElement>('historyNextBtn');
  const pageEl     = getEl('historyPageInfo');

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  pageEl.textContent = `${currentPage} / ${totalPages}`;
}

async function loadHistoryPage(page: number): Promise<void> {
  const listEl = getEl('historyList');
  listEl.innerHTML = '<li class="history-empty">불러오는 중...</li>';

  const { logs, total } = await fetchUserFortuneLogs(page);
  totalCount = total;
  renderHistoryList(logs);
  renderHistoryPagination();
}

// ── 초기화 ──────────────────────────────────────────────────────────
export function initHistory(): void {
  getEl('historyCloseBtn').addEventListener('click', hideHistoryPopup);
  getEl('historyOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideHistoryPopup();
  });
  getEl('historyPrevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadHistoryPage(currentPage);
    }
  });
  getEl('historyNextBtn').addEventListener('click', () => {
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      loadHistoryPage(currentPage);
    }
  });
}
