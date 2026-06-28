-- ============================================================
-- 똥싸당 운세 — fortune_messages 마이그레이션 (8번)
-- 운세 카드 메시지(심볼별 결과 문구 / 운세 문구)를 DB로 관리
-- 적용 전: supabase_admin_migration (7번) 완료 상태
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================


-- ── 1. 테이블 생성 ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fortune_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- symbol      : 1=corgi  2=poop_gold  3=talisman  4=bell  5=sweetpotato  6=ghost  7=_generic_miss
  symbol       smallint    NOT NULL,
  -- message_type: 1=triple_result(트리플)  2=pair_result(페어)  3=fortune(운세카드 본문)
  message_type smallint    NOT NULL,
  message      text        NOT NULL,
  is_active    boolean     NOT NULL DEFAULT true,
  sort_order   smallint    NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT fortune_messages_symbol_check
    CHECK (symbol BETWEEN 1 AND 7),
  CONSTRAINT fortune_messages_type_check
    CHECK (message_type BETWEEN 1 AND 3)
);

COMMENT ON COLUMN public.fortune_messages.symbol IS
  '1=corgi | 2=poop_gold | 3=talisman | 4=bell | 5=sweetpotato | 6=ghost | 7=_generic_miss';

COMMENT ON COLUMN public.fortune_messages.message_type IS
  '1=triple_result(트리플 결과 문구) | 2=pair_result(페어 결과 문구) | 3=fortune(운세카드 본문)';


-- ── 2. RLS ──────────────────────────────────────────────────────

ALTER TABLE public.fortune_messages ENABLE ROW LEVEL SECURITY;

-- 로그인한 사용자: 활성 메시지 읽기
CREATE POLICY "fortune_messages_select_active"
  ON public.fortune_messages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 관리자: 비활성 포함 전체 SELECT
CREATE POLICY "fortune_messages_admin_select_all"
  ON public.fortune_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자: INSERT
CREATE POLICY "fortune_messages_admin_insert"
  ON public.fortune_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자: UPDATE
CREATE POLICY "fortune_messages_admin_update"
  ON public.fortune_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 관리자: DELETE
CREATE POLICY "fortune_messages_admin_delete"
  ON public.fortune_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );


-- ── 3. updated_at 자동 갱신 트리거 ──────────────────────────────

CREATE OR REPLACE FUNCTION public.set_fortune_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fortune_messages_set_updated_at
  BEFORE UPDATE ON public.fortune_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_fortune_messages_updated_at();


-- ── 4. 인덱스 ────────────────────────────────────────────────────

-- 게임에서 심볼+타입으로 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_fortune_messages_symbol_type
  ON public.fortune_messages (symbol, message_type)
  WHERE is_active = true;

-- 관리자 페이지: 심볼별 필터링
CREATE INDEX IF NOT EXISTS idx_fortune_messages_symbol
  ON public.fortune_messages (symbol);


-- ── 5. 초기 데이터 INSERT ──────────────────────────────────────────
-- fortune.ts 의 FORTUNE_DATA 를 그대로 옮긴 데이터.
-- symbol      : 1=corgi  2=poop_gold  3=talisman  4=bell  5=sweetpotato  6=ghost  7=_generic_miss
-- message_type: 1=triple_result  2=pair_result  3=fortune


-- ─ corgi (symbol=1) ──────────────────────────────────────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (1, 1, 1, '웰시코기가 당신에게 초대길을 선물했습니다.'),
  (1, 1, 2, '코기 삼총사 출현! 오늘은 무엇이든 해낼 수 있어요.'),
  (1, 1, 3, '세 마리 코기의 특별한 축복이 쏟아집니다!'),
  (1, 1, 4, '코기의 특별한 기운이 하늘을 찌릅니다. 초대길!'),

  (1, 2, 1, '코기 두 마리가 소길을 물어다 줬어요.'),
  (1, 2, 2, '코기 듀오 등장! 소소하지만 기분 좋은 행운이에요.'),
  (1, 2, 3, '코기 두 마리가 꼬리를 흔들며 소길을 선물합니다.'),

  (1, 3, 1, '웰시코기처럼 사랑스럽고 활기찬 하루가 펼쳐집니다.'),
  (1, 3, 2, '코기의 귀여운 기운이 오늘 하루를 특별하게 만들어 줄 거예요.'),
  (1, 3, 3, '세 마리 코기의 에너지로 오늘은 무적입니다. 자신감을 가져요!'),
  (1, 3, 4, '코기가 행운을 물어다 줬어요. 오늘은 특별한 인연이 찾아올지도 몰라요.'),
  (1, 3, 5, '코기처럼 당신도 오늘 모든 이의 사랑을 받을 거예요.'),
  (1, 3, 6, '오늘 하루 코기의 밝은 에너지가 당신을 감싸줄 거예요.'),
  (1, 3, 7, '귀여움이 무기가 되는 날! 오늘은 당신의 매력이 빛을 발해요.');


-- ─ poop_gold (symbol=2) ──────────────────────────────────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (2, 1, 1, '황금똥이 떨어졌습니다. 재물운 상승!'),
  (2, 1, 2, '세 개의 황금똥! 오늘은 돈과 관련된 좋은 일이 생길 거예요.'),
  (2, 1, 3, '황금의 기운이 넘칩니다. 대박 재물운이에요!'),
  (2, 1, 4, '황금똥 트리플! 재물이 쏟아지는 날이에요.'),

  (2, 2, 1, '황금똥 두 개! 소소한 재물운이 찾아왔어요.'),
  (2, 2, 2, '황금 기운이 살짝 스쳤습니다. 작은 재물운 소길!'),
  (2, 2, 3, '황금 기운 2배! 소길이지만 재물운은 분명히 있어요.'),

  (2, 3, 1, '오늘은 예상치 못한 재물이 들어올 수 있는 날이에요.'),
  (2, 3, 2, '황금빛 기운이 당신을 감싸고 있어요. 투자나 구매 결정에 좋은 날입니다.'),
  (2, 3, 3, '재물운이 최상입니다. 오늘 주머니 사정이 나아질 조짐이 보여요.'),
  (2, 3, 4, '황금똥처럼 빛나는 하루가 될 거예요. 경제적인 행운이 찾아옵니다.'),
  (2, 3, 5, '황금 기운이 가득! 오늘 지출보다 수입이 늘어나는 즐거운 하루예요.'),
  (2, 3, 6, '뜻밖의 금전적 행운이 찾아올 수 있어요. 눈을 크게 뜨고 기회를 잡으세요.'),
  (2, 3, 7, '오늘 산 것들이 특별한 가치를 지니게 될 거예요. 좋은 소비의 날!');


-- ─ talisman (symbol=3) ───────────────────────────────────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (3, 1, 1, '부적 삼형제가 당신을 지켜줍니다. 중길!'),
  (3, 1, 2, '신비로운 부적의 힘이 모였습니다. 오늘은 보호받는 날이에요.'),
  (3, 1, 3, '세 개의 부적이 모든 액운을 막아줍니다!'),
  (3, 1, 4, '부적 트리플! 강력한 수호의 기운이 감쌉니다.'),

  (3, 2, 1, '부적 두 장이 작은 행운을 선물합니다. 소길!'),
  (3, 2, 2, '부적 듀오의 가호가 오늘 하루를 지켜줍니다.'),
  (3, 2, 3, '두 장의 부적이 나쁜 기운을 살짝 막아줬어요. 소길!'),

  (3, 3, 1, '오늘은 보이지 않는 힘이 당신을 지켜주고 있어요. 두려움 없이 나아가세요.'),
  (3, 3, 2, '부적의 신비로운 기운이 하루 종일 당신 곁에 있습니다.'),
  (3, 3, 3, '나쁜 기운은 멀리, 좋은 기운은 가까이! 오늘은 평화로운 하루예요.'),
  (3, 3, 4, '부적처럼 든든한 존재가 당신 곁에 나타날 거예요.'),
  (3, 3, 5, '신비로운 힘이 당신의 소원을 이뤄줄 준비를 하고 있습니다.'),
  (3, 3, 6, '오늘 하루 어떤 어려움도 당신을 쓰러뜨리지 못할 거예요.'),
  (3, 3, 7, '보이지 않는 손이 당신을 올바른 길로 안내하고 있어요.');


-- ─ bell (symbol=4) ───────────────────────────────────────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (4, 1, 1, '종소리 세 번, 행운이 깨어났습니다. 중길!'),
  (4, 1, 2, '딩동댕! 세 개의 방울이 기쁜 소식을 알립니다.'),
  (4, 1, 3, '방울 세 개가 당신의 행운을 울려 퍼뜨립니다!'),
  (4, 1, 4, '벨 트리플! 기쁜 소식이 세 배로 들려옵니다.'),

  (4, 2, 1, '방울 두 개가 딸랑딸랑, 소길이 찾아왔어요.'),
  (4, 2, 2, '딩동! 작은 행운의 소리가 들립니다. 소길!'),
  (4, 2, 3, '방울 두 개가 소소한 기쁨을 울려 퍼뜨립니다.'),

  (4, 3, 1, '기쁜 소식이 종소리처럼 울려 퍼질 거예요. 오늘 연락을 기다려보세요.'),
  (4, 3, 2, '딸랑딸랑, 행운의 방울이 당신 곁에서 울립니다.'),
  (4, 3, 3, '오늘은 좋은 소식이 잇따라 들어올 하루예요. 기대해도 좋아요.'),
  (4, 3, 4, '방울처럼 명랑하고 기분 좋은 하루가 될 거예요.'),
  (4, 3, 5, '종소리가 행운의 시작을 알립니다. 오늘 하루 기분 좋은 일이 가득해요.'),
  (4, 3, 6, '누군가에게 기쁜 소식을 전하거나 받게 될 거예요.'),
  (4, 3, 7, '오늘은 소통이 잘 되는 날! 하고 싶은 말을 편하게 꺼내보세요.');


-- ─ sweetpotato (symbol=5) ────────────────────────────────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (5, 1, 1, '고구마처럼 답답한 하루가 예상됩니다.'),
  (5, 1, 2, '고구마 세 개가 뭉쳤습니다. 오늘은 막히는 일이 많을 수 있어요.'),
  (5, 1, 3, '꽝! 고구마가 가득 쌓였습니다. 물이라도 마셔요.'),
  (5, 1, 4, '고구마 트리플... 답답한 하루지만 끝은 달콤할 수 있어요.'),

  (5, 2, 1, '고구마 두 개... 그나마 소길이 왔네요!'),
  (5, 2, 2, '고구마 듀오 등장. 답답하지만 소소한 행운은 있어요. 소길!'),
  (5, 2, 3, '고구마 두 개! 조금 답답해도 행운은 따라와요. 소길.'),

  (5, 3, 1, '답답한 상황도 결국 풀릴 거예요. 조금만 더 기다려봐요.'),
  (5, 3, 2, '고구마처럼 오래 찌다 보면 달콤해질 거예요. 인내심을 가져보세요.'),
  (5, 3, 3, '막힌 것 같아도 의외의 구멍이 보일 거예요. 시야를 넓혀봐요.'),
  (5, 3, 4, '오늘 답답한 일이 있더라도 저녁엔 풀릴 조짐이 있어요.'),
  (5, 3, 5, '고구마도 잘 익으면 맛있듯이, 오늘의 인내가 내일의 기쁨이 될 거예요.');


-- ─ ghost (symbol=6) ──────────────────────────────────────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (6, 1, 1, '귀신이 오늘의 운세를 훔쳐갔습니다.'),
  (6, 1, 2, '으스스한 유령 세 마리가 행운을 가져가 버렸어요.'),
  (6, 1, 3, '귀신 삼형제 출현! 오늘은 조심하는 것이 좋겠어요.'),
  (6, 1, 4, '유령 트리플... 행운이 어디론가 사라져 버렸어요.'),

  (6, 2, 1, '유령 두 마리가 슬쩍 지나갔습니다. 그래도 소길이에요!'),
  (6, 2, 2, '귀신 듀오가 나타났지만 소소한 행운은 남겨두고 갔네요. 소길!'),
  (6, 2, 3, '유령 두 마리... 스산하지만 소길은 챙겼어요!'),

  (6, 3, 1, '스산한 기운이 있지만 작은 행운이 함께해요. 긍정적으로 생각해봐요.'),
  (6, 3, 2, '귀신도 당신의 강한 기운에 놀라 도망갈 거예요. 자신감을 가져요.'),
  (6, 3, 3, '으스스하지만 그 속에 소소한 즐거움이 숨어 있어요.'),
  (6, 3, 4, '오늘은 평소보다 조심스럽게, 하지만 용기 있게 나아가봐요.'),
  (6, 3, 5, '귀신이 건드리지 못할 만큼 오늘 하루 단단하게 버텨봐요.');


-- ─ _generic_miss (symbol=7) — 3개 모두 다른 꽝, 폴백용 ──────────────
INSERT INTO public.fortune_messages (symbol, message_type, sort_order, message) VALUES
  (7, 1, 1, '꽝... 다음엔 더 큰 행운이 기다리고 있어요!'),
  (7, 1, 2, '이번엔 아쉽지만, 행운은 반드시 돌아옵니다.'),
  (7, 1, 3, '꽝! 하지만 포기하지 마세요. 다음 스핀을 기대해봐요.'),
  (7, 1, 4, '아무것도 맞지 않았어요... 하지만 도전은 계속돼요!');
-- _generic_miss 는 pair_result(2) / fortune(3) 없음 (fortune.ts 원본과 동일)
