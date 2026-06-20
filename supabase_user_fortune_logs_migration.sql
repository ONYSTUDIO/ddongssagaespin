-- user_fortune_logs: 슬롯 결과 및 포춘쿠키 획득 기록 테이블
-- log_type: 'SLOT_RESULT' | 'FORTUNE_COOKIE'
-- luck_score: 슬롯 결과만 값, 포춘쿠키는 null

CREATE TABLE IF NOT EXISTS user_fortune_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_type     text        NOT NULL,
  fortune_type text        NOT NULL,
  luck_score   integer,
  message      text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_fortune_logs_user_id
  ON user_fortune_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_fortune_logs_created_at
  ON user_fortune_logs(created_at DESC);

ALTER TABLE user_fortune_logs ENABLE ROW LEVEL SECURITY;

-- 본인 기록 읽기
CREATE POLICY "users can read own fortune logs"
  ON user_fortune_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 본인 기록 생성
CREATE POLICY "users can insert own fortune logs"
  ON user_fortune_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
