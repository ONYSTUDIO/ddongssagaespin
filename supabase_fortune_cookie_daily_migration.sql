-- user_fortune_cookie_daily: 포춘쿠키 하루 제한 관리 테이블
-- date 컬럼은 KST 기준 YYYY-MM-DD 문자열로 저장
-- 향후 확인/작성 기록, 보상 지급, 연속 참여 통계 등 확장 가능

CREATE TABLE IF NOT EXISTS user_fortune_cookie_daily (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           text        NOT NULL,
  checked_cookie boolean     NOT NULL DEFAULT false,
  wrote_message  boolean     NOT NULL DEFAULT false,
  checked_at     timestamptz,
  wrote_at       timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE user_fortune_cookie_daily ENABLE ROW LEVEL SECURITY;

-- 본인 레코드 읽기
CREATE POLICY "users can read own fortune cookie daily"
  ON user_fortune_cookie_daily FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 본인 레코드 생성
CREATE POLICY "users can insert own fortune cookie daily"
  ON user_fortune_cookie_daily FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 본인 레코드 업데이트
CREATE POLICY "users can update own fortune cookie daily"
  ON user_fortune_cookie_daily FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
