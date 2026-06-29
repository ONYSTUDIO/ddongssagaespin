import { supabase } from './supabase';

export const DAILY_SPIN_REWARD = 10;

export type SpinReason = 'daily_reward' | 'spin_use' | 'ad_reward' | 'event' | 'admin' | 'ranking' | 'fortune_cookie' | 'minigame';

function getTodayKstDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// ── 현재 보유 스핀 조회 ────────────────────────────────────────────
export async function getCurrentSpinCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from('profiles')
    .select('spin_count')
    .eq('id', user.id)
    .single();

  return data?.spin_count ?? 0;
}

// ── 오늘 첫 로그인 여부 확인 ──────────────────────────────────────
export async function checkDailyReward(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const today = getTodayKstDate(); // YYYY-MM-DD

  const { data } = await supabase
    .from('profiles')
    .select('last_login_date')
    .eq('id', user.id)
    .single();

  return data?.last_login_date !== today;
}

async function insertSpinTransactionAndGetCount(
  amount: number,
  reason: SpinReason,
): Promise<{ newCount: number; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newCount: 0, error: '로그인이 필요합니다.' };

  const { error: insertErr } = await supabase
    .from('spin_transactions')
    .insert({ user_id: user.id, amount, reason });

  if (insertErr) return { newCount: 0, error: insertErr.message };

  const newCount = await getCurrentSpinCount();
  return { newCount, error: null };
}

// ── 일일 스핀 10개 지급 ───────────────────────────────────────────
export async function grantDailySpinReward(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const today = getTodayKstDate();

  const { newCount, error } = await insertSpinTransactionAndGetCount(
    DAILY_SPIN_REWARD,
    'daily_reward',
  );
  if (error) return getCurrentSpinCount();

  await supabase
    .from('profiles')
    .update({ last_login_date: today })
    .eq('id', user.id);

  return newCount;
}

// ── 스핀 1개 차감 ─────────────────────────────────────────────────
export async function consumeSpin(): Promise<{ success: boolean; remaining: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, remaining: 0 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('spin_count')
    .eq('id', user.id)
    .single();

  const current = profile?.spin_count ?? 0;
  if (current <= 0) return { success: false, remaining: 0 };

  const { newCount, error } = await insertSpinTransactionAndGetCount(-1, 'spin_use');
  if (error) return { success: false, remaining: current };

  return { success: true, remaining: newCount };
}

// ── 향후 확장용: 외부에서 스핀 지급 (이벤트·관리자·광고 등) ──────────
export async function grantSpins(amount: number, reason: SpinReason): Promise<number> {
  const { newCount, error } = await insertSpinTransactionAndGetCount(amount, reason);
  if (error) return getCurrentSpinCount();

  return newCount;
}

// ── 에러 반환형 스핀 지급 (포춘쿠키 보상 등 성공/실패 분기가 필요한 경우) ──
export async function grantSpinsWithResult(
  amount: number,
  reason: SpinReason,
): Promise<{ newCount: number; error: string | null }> {
  const result = await insertSpinTransactionAndGetCount(amount, reason);
  if (result.error) return { newCount: 0, error: '스핀 지급에 실패했습니다.' };
  return result;
}
