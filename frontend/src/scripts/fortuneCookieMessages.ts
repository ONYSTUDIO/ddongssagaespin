import { supabase } from './supabase';

export interface FortuneCookieMessage {
  id: string;
  author?: string | null;
  message: string;
  createdAt: string;
}

const FALLBACK: FortuneCookieMessage = {
  id: 'fallback',
  author: null,
  message: '오늘도 작은 행운이 당신을 기다리고 있어요.',
  createdAt: new Date().toISOString(),
};

export async function saveFortuneCookieMessage(
  author: string | null,
  message: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('fortune_cookie_messages')
    .insert({ author, message, is_active: true });

  if (error) return { error: '저장에 실패했습니다. 다시 시도해주세요.' };
  return { error: null };
}

export async function getRandomFortuneCookieMessage(): Promise<FortuneCookieMessage> {
  const { data, error } = await supabase
    .from('fortune_cookie_messages')
    .select('id, author, message, created_at')
    .eq('is_active', true);

  if (error || !data || data.length === 0) return FALLBACK;

  const row = data[Math.floor(Math.random() * data.length)];
  return {
    id: row.id as string,
    author: (row.author as string | null) ?? null,
    message: row.message as string,
    createdAt: row.created_at as string,
  };
}
