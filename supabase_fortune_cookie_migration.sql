-- fortune_cookie_messages 테이블 생성
CREATE TABLE IF NOT EXISTS fortune_cookie_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  author      text,
  message     text        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE fortune_cookie_messages ENABLE ROW LEVEL SECURITY;

-- 로그인한 사용자가 활성 메시지를 읽을 수 있음
CREATE POLICY "active messages readable by authenticated"
  ON fortune_cookie_messages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 초기 샘플 메시지
INSERT INTO fortune_cookie_messages (message, author) VALUES
  ('오늘도 작은 행운이 당신을 기다리고 있어요.', '운영자'),
  ('웃는 얼굴에 복이 따릅니다.', '운영자'),
  ('오늘 하루도 빛나게 보내세요!', '운영자'),
  ('좋은 일이 곧 찾아올 거예요.', '운영자'),
  ('당신의 노력은 반드시 결실을 맺습니다.', '운영자'),
  ('오늘의 작은 도전이 내일의 큰 성장이 됩니다.', '운영자'),
  ('행운은 준비된 자에게 찾아옵니다.', '운영자'),
  ('당신은 오늘도 충분히 잘하고 있어요.', '운영자'),
  ('기쁜 소식이 곧 들려올 거예요.', '운영자'),
  ('별이 빛나는 밤처럼 당신의 미래도 밝습니다.', '운영자'),
  ('오늘의 똥운은 최강입니다. 나가도 됩니다.', '운영자'),
  ('황금똥이 굴러올 예정입니다. 잠시 기다려주세요.', '운영자');
