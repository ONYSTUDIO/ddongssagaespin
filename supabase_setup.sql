-- ============================================================
-- 똥싸개 슬롯머신 — Supabase 초기 설정 SQL
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- ── 1. 유저 프로필 테이블 ──────────────────────────────────────
-- auth.users 에 대응하는 공개 프로필 (username 저장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 읽기/수정 가능, 전체 username 목록은 ranking 뷰로 노출
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ── 2. 게임 점수 테이블 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_scores (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade      TEXT NOT NULL,          -- SUPER_LUCK / GREAT_LUCK / GOOD_LUCK / SMALL_LUCK / MISS
  luck_score INT  NOT NULL CHECK (luck_score BETWEEN 0 AND 100),
  played_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- 본인 점수 INSERT/SELECT, 랭킹 집계는 뷰(ranking_view)로 처리
CREATE POLICY "scores_select_own" ON public.game_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scores_insert_own" ON public.game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── 3. 실시간 랭킹 뷰 ─────────────────────────────────────────
-- 유저별 최고 luck_score 를 집계 → 클라이언트가 이 뷰를 SELECT
CREATE OR REPLACE VIEW public.ranking_view AS
SELECT
  p.username,
  MAX(gs.luck_score) AS best_score
FROM public.game_scores gs
JOIN public.profiles p ON p.id = gs.user_id
GROUP BY p.username
ORDER BY best_score DESC
LIMIT 100;

-- 뷰는 RLS 가 아닌 권한(GRANT)으로 제어
GRANT SELECT ON public.ranking_view TO anon, authenticated;


-- ── 4. 신규 가입 시 프로필 자동 생성 트리거 ──────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    -- email 형식 "username@ddongssagae.app" 에서 username 추출
    SPLIT_PART(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 5. Realtime 활성화 ────────────────────────────────────────
-- Supabase Dashboard > Database > Replication 에서
-- game_scores 테이블의 Realtime 을 활성화하거나 아래 실행:
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;
