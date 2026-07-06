-- 일일 랭킹 뷰: KST 기준 오늘 날짜의 최고 luck_score 상위 10명
-- game_scores.played_at 컬럼 기준으로 오늘 날짜 필터
-- profiles 테이블에서 username 조회 (기존 ranking_view 구조와 동일)

CREATE OR REPLACE VIEW public.daily_ranking_view AS
SELECT
  p.username,
  MAX(gs.luck_score) AS best_score
FROM   public.game_scores gs
JOIN   public.profiles    p ON p.id = gs.user_id
WHERE  (gs.played_at AT TIME ZONE 'Asia/Seoul')::date
         = (NOW() AT TIME ZONE 'Asia/Seoul')::date
GROUP  BY p.username
ORDER  BY best_score DESC;

GRANT SELECT ON public.daily_ranking_view TO anon, authenticated;


-- ── 랭킹 팝업 프로필 아이콘 대응: profile_grade, profile_character_id 컬럼 추가 ──
-- profiles 테이블의 프로필 등급과 캐릭터 ID를 뷰에 포함시켜
-- 프론트엔드에서 랭킹 목록에 프로필 아이콘을 표시할 수 있도록 한다.

CREATE OR REPLACE VIEW public.daily_ranking_view AS
SELECT
  p.username,
  MAX(gs.luck_score) AS best_score,
  p.profile_grade,
  p.profile_character_id
FROM   public.game_scores gs
JOIN   public.profiles    p ON p.id = gs.user_id
WHERE  (gs.played_at AT TIME ZONE 'Asia/Seoul')::date
         = (NOW() AT TIME ZONE 'Asia/Seoul')::date
GROUP  BY p.username, p.profile_grade, p.profile_character_id
ORDER  BY best_score DESC;

GRANT SELECT ON public.daily_ranking_view TO anon, authenticated;
