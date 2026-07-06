import { supabase } from './supabase';
import { markNewCharacterAcquired } from './redDot';

// 세션 내 캐시: 팝업 열릴 때 DB에서 로드
let ownedCharacterIds: Set<number> = new Set();

// ── 보유 캐릭터 로드 (팝업 열릴 때 호출) ──────────────────────────
export async function loadOwnedCharacters(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { ownedCharacterIds = new Set(); return; }

  const { data } = await supabase
    .from('user_characters')
    .select('character_id')
    .eq('user_id', user.id);

  ownedCharacterIds = new Set(
    (data ?? []).map((r: { character_id: number }) => r.character_id),
  );
}

// ── 보유 여부 확인 (캐시 기반, 동기) ──────────────────────────────
export function isCharacterOwned(characterId: number): boolean {
  return ownedCharacterIds.has(characterId);
}

// ── 캐릭터 수집 처리 ────────────────────────────────────────────────
// 최초 수집 → user_characters INSERT (fragment_count=0)
// 중복 수집 → fragment_count +1, 10개 달성 시 profile_grade +1 (최대 5)
export async function collectCharacter(characterId: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!ownedCharacterIds.has(characterId)) {
    // 최초 수집
    const { error } = await supabase
      .from('user_characters')
      .insert({ user_id: user.id, character_id: characterId, fragment_count: 0 });

    if (!error) {
      ownedCharacterIds.add(characterId);
      markNewCharacterAcquired();
    }
    return;
  }

  // 중복 수집: 조각 +1
  const { data: existing } = await supabase
    .from('user_characters')
    .select('id, fragment_count')
    .eq('user_id', user.id)
    .eq('character_id', characterId)
    .single();

  if (!existing) return;

  const newCount = existing.fragment_count + 1;

  await supabase
    .from('user_characters')
    .update({ fragment_count: newCount })
    .eq('id', existing.id);

  // 조각 10개마다 프로필 등급 업
  if (newCount % 10 === 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_grade')
      .eq('id', user.id)
      .single();

    const grade = profile?.profile_grade ?? 1;
    if (grade < 5) {
      await supabase
        .from('profiles')
        .update({ profile_grade: grade + 1 })
        .eq('id', user.id);
    }
  }
}
