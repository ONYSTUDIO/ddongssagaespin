-- ============================================================
-- 똥싸개 슬롯머신 — 캐릭터 수집 시스템 마이그레이션
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- ── 1. profiles 테이블 컬럼 추가 ────────────────────────────────
-- profile_grade       : 프로필 테두리 등급 (1~5단계, 기본 1)
--                       캐릭터 조각 10개 달성 시 1단계씩 증가
-- profile_character_id: 현재 프로필 사진으로 설정된 캐릭터 ID
--                       NULL = 기본 아바타 (코기)
--                       1001~1005 = 수집한 캐릭터 중 유저가 선택한 값
--                       앱 레벨에서 user_characters 소유 여부 검증 후 저장
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_grade        INT  NOT NULL DEFAULT 1
    CHECK (profile_grade BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS profile_character_id INT  DEFAULT NULL;


-- ── 2. user_characters 테이블 신설 ──────────────────────────────
-- 설계 근거:
--   캐릭터 수가 늘어날수록 profiles 에 컬럼을 추가하는 방식은
--   관리·확장이 불가능하다. 유저-캐릭터 조합을 1행으로 표현하면
--   캐릭터 추가 시 테이블 스키마 변경 없이 데이터만 늘어난다.
--   UNIQUE(user_id, character_id) 로 동일 캐릭터의 중복 행을 방지하고,
--   fragment_count 로 조각 수를 관리한다.
--
-- character_id 값 정의 (frontend/src/scripts/minigame01.ts 기준):
--   1001 = DOG_01 / 1002 = DOG_02 / 1003 = DOG_03
--   1004 = DOG_04 / 1005 = DOG_05
--   (추후 캐릭터 추가 시 1006~ 으로 확장)
--
-- fragment_count 규칙:
--   최초 수집 시 0 으로 INSERT
--   이후 중복 수집 때마다 +1
--   10 달성 시 profiles.profile_grade +1 (앱 레벨에서 처리)
CREATE TABLE IF NOT EXISTS public.user_characters (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id        INT         NOT NULL,
  fragment_count      INT         NOT NULL DEFAULT 0,
  first_collected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, character_id)
);

ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

-- 본인 캐릭터 데이터만 조회 가능
CREATE POLICY "characters_select_own" ON public.user_characters
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 데이터만 INSERT 가능
CREATE POLICY "characters_insert_own" ON public.user_characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 UPDATE 가능 (조각 수 증가, 등)
CREATE POLICY "characters_update_own" ON public.user_characters
  FOR UPDATE USING (auth.uid() = user_id);


-- ── 3. 인덱스 ────────────────────────────────────────────────────
-- user_id 기준 전체 캐릭터 조회 (도감 메뉴 등)에 사용
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id
  ON public.user_characters (user_id);


-- ── 4. profile_character_id 기본값 설정 및 기존 데이터 초기화 ──────
-- 배경:
--   섹션 1 에서 profile_character_id 는 DEFAULT NULL 로 추가됐으나,
--   회원가입 시 기본 프로필 이미지로 DOG_01(character_id=1001)을 제공하므로
--   DEFAULT 를 1001 로 변경한다.
--   handle_new_user() 트리거는 profiles(id, username) 만 INSERT 하고
--   나머지 컬럼은 DEFAULT 값을 그대로 사용하므로 트리거 수정은 불필요하다.
--
-- character_id 1001 = DOG_01 = dog_01.png
--   (frontend/src/scripts/minigame01.ts > DOG_CHARACTER_ID.DOG_01 확인)

-- 4-1. 신규 가입 기본값 변경 (NULL → 1001)
ALTER TABLE public.profiles
  ALTER COLUMN profile_character_id SET DEFAULT 1001;

-- 4-2. 기존 유저 데이터 일괄 업데이트 (NULL인 행만)
UPDATE public.profiles
  SET profile_character_id = 1001
  WHERE profile_character_id IS NULL;
