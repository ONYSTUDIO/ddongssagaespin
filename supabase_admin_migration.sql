-- ============================================================
-- 똥싸당 운세 — 어드민 개선 마이그레이션 (7번)
-- 적용 전: supabase_setup ~ supabase_user_fortune_logs_migration 완료 상태
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================


-- ── 1. profiles에 is_admin 컬럼 추가 ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;


-- ── 2. spin_count 자동 동기화 트리거 ──────────────────────────
-- spin_transactions INSERT 시 profiles.spin_count를 자동으로 가감.
-- profiles.spin_count를 직접 UPDATE하지 말 것 — 이 트리거가 처리함.
CREATE OR REPLACE FUNCTION public.sync_spin_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount < 0 THEN
    UPDATE public.profiles
    SET spin_count = spin_count + NEW.amount
    WHERE id = NEW.user_id
      AND spin_count + NEW.amount >= 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient spin_count for user %', NEW.user_id;
    END IF;

    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET spin_count = spin_count + NEW.amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_spin_transaction_insert
  AFTER INSERT ON public.spin_transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_spin_count();


-- ── 3. spin_transactions INSERT 정책 강화 ─────────────────────
-- 기존 정책 삭제 후 재생성.
-- 클라이언트는 spin_use(차감)만 허용.
-- daily_reward 등 지급은 추후 Node.js 백엔드(service_role)에서만 처리.
DROP POLICY IF EXISTS "spin_tx_insert_own" ON public.spin_transactions;

CREATE POLICY "spin_tx_insert_spin_use_only" ON public.spin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND amount < 0
    AND reason = 'spin_use'
  );

-- ⚠️  주의: daily_reward 등 지급 트랜잭션은 현재 클라이언트에서 처리 중.
--    Node.js 백엔드 구축 후 service_role로 이전할 때까지
--    아래 임시 정책을 함께 적용해 현재 클라이언트 보상을 허용.
--    백엔드 완성 후 이 정책은 DROP할 것.
DROP POLICY IF EXISTS "spin_tx_insert_daily_reward_temp" ON public.spin_transactions;
DROP POLICY IF EXISTS "spin_tx_insert_client_reward_temp" ON public.spin_transactions;

CREATE POLICY "spin_tx_insert_client_reward_temp" ON public.spin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND amount > 0
    AND reason IN ('daily_reward', 'fortune_cookie', 'minigame')
  );


-- ── 4. daily_ranking_view LIMIT 10 추가 ──────────────────────
CREATE OR REPLACE VIEW public.daily_ranking_view AS
SELECT
  p.username,
  MAX(gs.luck_score) AS best_score
FROM   public.game_scores gs
JOIN   public.profiles    p ON p.id = gs.user_id
WHERE  (gs.played_at AT TIME ZONE 'Asia/Seoul')::date
         = (NOW() AT TIME ZONE 'Asia/Seoul')::date
GROUP  BY p.username
ORDER  BY best_score DESC
LIMIT  10;

GRANT SELECT ON public.daily_ranking_view TO anon, authenticated;


-- ── 5. 어드민용 통계 뷰 추가 ──────────────────────────────────

-- 일별 활성 유저 수 (DAU)
CREATE OR REPLACE VIEW public.admin_dau_view AS
SELECT
  (gs.played_at AT TIME ZONE 'Asia/Seoul')::date AS date,
  COUNT(DISTINCT gs.user_id)                      AS dau
FROM public.game_scores gs
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.admin_dau_view TO authenticated;

-- 일별 총 스핀 횟수
CREATE OR REPLACE VIEW public.admin_daily_spins_view AS
SELECT
  (gs.played_at AT TIME ZONE 'Asia/Seoul')::date AS date,
  COUNT(*)                                        AS spin_count
FROM public.game_scores gs
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.admin_daily_spins_view TO authenticated;

-- 카드 등급별 획득 수 및 비율
CREATE OR REPLACE VIEW public.admin_grade_stats_view AS
SELECT
  grade,
  COUNT(*)                                                          AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2)               AS percentage
FROM public.game_scores
GROUP BY grade
ORDER BY count DESC;

GRANT SELECT ON public.admin_grade_stats_view TO authenticated;

-- 전체 가입자 수 (어드민 대시보드 헤더용)
CREATE OR REPLACE VIEW public.admin_user_stats_view AS
SELECT
  COUNT(*)                                          AS total_users,
  COUNT(*) FILTER (WHERE created_at::date
    = (NOW() AT TIME ZONE 'Asia/Seoul')::date)      AS new_users_today
FROM public.profiles;

GRANT SELECT ON public.admin_user_stats_view TO authenticated;


-- ── 6. fortune_cookie_messages 어드민 관리 정책 ───────────────
-- is_admin = true 유저만 메시지 추가/수정/삭제 가능.

-- public 스키마 명시 (기존 파일 일관성 맞춤)
ALTER TABLE fortune_cookie_messages SET SCHEMA public;

CREATE POLICY "admin can insert fortune cookie messages"
  ON public.fortune_cookie_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admin can update fortune cookie messages"
  ON public.fortune_cookie_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admin can delete fortune cookie messages"
  ON public.fortune_cookie_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );


-- ── 7. 관리자 계정 설정 (실행 전 username 변경 후 사용) ──────────
-- 아래 주석을 해제하고 username을 실제 관리자 아이디로 변경 후 실행.
UPDATE public.profiles SET is_admin = true WHERE username = 'admin@ddongssagae.app';
