import { supabase } from './supabase';

export interface FortuneCookieDailyState {
  checked_cookie: boolean;
  wrote_message: boolean;
}

export function getTodayKstDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function ensureFortuneCookieDailyState(userId: string): Promise<FortuneCookieDailyState> {
  const date = getTodayKstDate();
  await supabase
    .from('user_fortune_cookie_daily')
    .upsert({ user_id: userId, date }, { onConflict: 'user_id,date', ignoreDuplicates: true });

  const { data, error } = await supabase
    .from('user_fortune_cookie_daily')
    .select('checked_cookie, wrote_message')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error || !data) return { checked_cookie: false, wrote_message: false };
  return {
    checked_cookie: Boolean(data.checked_cookie),
    wrote_message:  Boolean(data.wrote_message),
  };
}

export async function markFortuneCookieChecked(userId: string): Promise<void> {
  const date = getTodayKstDate();
  const now  = new Date().toISOString();
  const { error } = await supabase
    .from('user_fortune_cookie_daily')
    .upsert(
      { user_id: userId, date, checked_cookie: true, checked_at: now, updated_at: now },
      { onConflict: 'user_id,date' },
    );
  if (error) throw error;
}

export async function markFortuneCookieMessageWritten(userId: string): Promise<void> {
  const date = getTodayKstDate();
  const now  = new Date().toISOString();
  const { error } = await supabase
    .from('user_fortune_cookie_daily')
    .upsert(
      { user_id: userId, date, wrote_message: true, wrote_at: now, updated_at: now },
      { onConflict: 'user_id,date' },
    );
  if (error) throw error;
}
