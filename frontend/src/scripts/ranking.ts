import { supabase } from './supabase';

export interface RankEntry {
  username: string;
  best_score: number;
  profile_grade?: number;
  profile_character_id?: number;
}

export async function saveScore(grade: string, luckScore: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('game_scores').insert({
    user_id: user.id,
    grade,
    luck_score: luckScore,
  });
}

export async function fetchRanking(): Promise<RankEntry[]> {
  const { data, error } = await supabase
    .from('daily_ranking_view')
    .select('username, best_score, profile_grade, profile_character_id')
    .order('best_score', { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as RankEntry[];
}

export function subscribeToRanking(onUpdate: (rows: RankEntry[]) => void): () => void {
  const channel = supabase
    .channel('ranking-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'game_scores' },
      async () => {
        const rows = await fetchRanking();
        onUpdate(rows);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function renderRanking(rows: RankEntry[]): void {
  const listEl = document.getElementById('rankingList');
  if (!listEl) return;

  if (rows.length === 0) {
    listEl.innerHTML = '<li class="ranking-empty">아직 기록이 없어요</li>';
    return;
  }

  listEl.innerHTML = rows
    .map((row, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      return `<li class="ranking-item">
        <span class="ranking-rank">${medal}</span>
        <span class="ranking-name">${escapeHtml(row.username)}</span>
        <span class="ranking-score">${row.best_score}</span>
      </li>`;
    })
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  );
}
