-- support_transactions 테이블에 order_id 컬럼 추가
-- upsert(onConflict: 'order_id') 와 Kakao ready/approve 플로우를 위해 필요

alter table public.support_transactions
  add column if not exists order_id text unique;

-- 기존 RLS 정책은 유지 (supabase_support_migration.sql 에서 생성된 정책 그대로 사용)
