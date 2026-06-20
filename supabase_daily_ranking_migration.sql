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
