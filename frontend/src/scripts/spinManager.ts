import { supabase } from './supabase';

export const DAILY_SPIN_REWARD = 30;

export type SpinReason = 'daily_reward' | 'spin_use' | 'ad_reward' | 'event' | 'admin' | 'ranking' | 'fortune_cookie';

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

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data } = await supabase
    .from('profiles')
    .select('last_login_date')
    .eq('id', user.id)
    .single();

  return data?.last_login_date !== today;
}

// ── 일일 스핀 30개 지급 ───────────────────────────────────────────
export async function grantDailySpinReward(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const today = new Date().toISOString().split('T')[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('spin_count')
    .eq('id', user.id)
    .single();

  const current = profile?.spin_count ?? 0;
  const newCount = current + DAILY_SPIN_REWARD;

  await supabase
    .from('profiles')
    .update({ spin_count: newCount, last_login_date: today })
    .eq('id', user.id);

  await supabase
    .from('spin_transactions')
    .insert({ user_id: user.id, amount: DAILY_SPIN_REWARD, reason: 'daily_reward' });

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

  const newCount = current - 1;

  await supabase
    .from('profiles')
    .update({ spin_count: newCount })
    .eq('id', user.id);

  await supabase
    .from('spin_transactions')
    .insert({ user_id: user.id, amount: -1, reason: 'spin_use' });

  return { success: true, remaining: newCount };
}

// ── 향후 확장용: 외부에서 스핀 지급 (이벤트·관리자·광고 등) ──────────
export async function grantSpins(amount: number, reason: SpinReason): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: profile } = await supabase
    .from('profiles')
    .select('spin_count')
    .eq('id', user.id)
    .single();

  const newCount = (profile?.spin_count ?? 0) + amount;

  await supabase
    .from('profiles')
    .update({ spin_count: newCount })
    .eq('id', user.id);

  await supabase
    .from('spin_transactions')
    .insert({ user_id: user.id, amount, reason });

  return newCount;
}

// ── 에러 반환형 스핀 지급 (포춘쿠키 보상 등 성공/실패 분기가 필요한 경우) ──
export async function grantSpinsWithResult(
  amount: number,
  reason: SpinReason,
): Promise<{ newCount: number; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newCount: 0, error: '로그인이 필요합니다.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('spin_count')
    .eq('id', user.id)
    .single();

  const newCount = (profile?.spin_count ?? 0) + amount;

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ spin_count: newCount })
    .eq('id', user.id);

  if (updateErr) return { newCount: 0, error: '스핀 지급에 실패했습니다.' };

  await supabase
    .from('spin_transactions')
    .insert({ user_id: user.id, amount, reason });

  return { newCount, error: null };
}
