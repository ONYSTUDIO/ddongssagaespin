-- 후원 내역 테이블
-- payment_status: pending → paid | failed (PG 연동 후 Webhook에서 업데이트)

create table if not exists public.support_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  amount           integer not null check (amount >= 100),
  payment_provider text    not null default 'mock',
  payment_status   text    not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  payment_id       text,
  created_at       timestamptz not null default now()
);

-- 인덱스
create index if not exists support_transactions_user_id_idx  on public.support_transactions (user_id);
create index if not exists support_transactions_created_at_idx on public.support_transactions (created_at desc);

-- RLS: 본인 기록만 조회 가능 / insert는 로그인 여부 무관 허용 (비로그인 후원 대비)
alter table public.support_transactions enable row level security;

create policy "support_select_own"
  on public.support_transactions
  for select
  using (auth.uid() = user_id);

create policy "support_insert_any"
  on public.support_transactions
  for insert
  with check (true);
