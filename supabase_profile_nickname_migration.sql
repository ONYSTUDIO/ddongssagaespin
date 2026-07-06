-- ============================================================
-- 똥싸개 슬롯머신 — 프로필 닉네임 마이그레이션
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- ── profiles 테이블에 nickname 컬럼 추가 ──────────────────────────
-- nickname: 사용자가 직접 설정하는 표시 이름 (최대 10자, 초기값 NULL)
--           아이디(username)와 별개로 자유롭게 변경 가능
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT NULL
    CHECK (char_length(nickname) <= 10);
