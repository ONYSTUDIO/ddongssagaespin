-- ============================================================
-- 똥싸개 슬롯머신 — 스핀 시스템 마이그레이션
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- ── 1. profiles 테이블 컬럼 추가 ────────────────────────────────
-- spin_count : 현재 보유 스핀 (빠른 조회용)
-- last_login_date : 오늘 최초 로그인 여부 판단용
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spin_count      INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date DATE;


-- ── 2. spin_transactions 테이블 신설 ────────────────────────────
-- 설계 근거:
--   단순 spin_count 컬럼만으로는 "어떤 경로로 얼마나 지급/차감됐는지"
--   추적이 불가능하다. 향후 광고 시청, 이벤트, 관리자 보상, 랭킹 보상 등
--   다양한 출처가 추가될 예정이므로 트랜잭션 로그 테이블을 분리하여
--   reason 필드로 출처를 구분한다.
--   profiles.spin_count 는 합산 캐시(빠른 조회), 이 테이블은 원장(이력)이다.
CREATE TABLE IF NOT EXISTS public.spin_transactions (
  id         BIGSERIAL    PRIMARY KEY,
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INT          NOT NULL,   -- 양수: 지급, 음수: 차감
  reason     TEXT         NOT NULL,   -- 'daily_reward' | 'spin_use' | 'ad_reward' | 'event' | 'admin' | 'ranking'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.spin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spin_tx_select_own" ON public.spin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "spin_tx_insert_own" ON public.spin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── 3. 신규 가입 트리거 수정 ─────────────────────────────────────
-- 기존 handle_new_user() 는 profiles(id, username) 만 INSERT 했으므로
-- spin_count / last_login_date 는 DEFAULT 값으로 자동 설정됨 → 별도 수정 불필요
