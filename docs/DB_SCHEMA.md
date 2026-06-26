# DB_SCHEMA.md

# 똥싸당 운세 - DB 스키마 문서

## 마이그레이션 파일 목록 (적용 순서)

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | supabase_setup.sql | profiles, game_scores, ranking_view, 신규가입 트리거 |
| 2 | supabase_spin_migration.sql | spin_transactions, profiles에 spin_count/last_login_date 추가 |
| 3 | supabase_daily_ranking_migration.sql | daily_ranking_view |
| 4 | supabase_fortune_cookie_migration.sql | fortune_cookie_messages |
| 5 | supabase_fortune_cookie_daily_migration.sql | user_fortune_cookie_daily |
| 6 | supabase_user_fortune_logs_migration.sql | user_fortune_logs |
| 7 | supabase_admin_migration.sql | 어드민 개선 (트리거, 정책, 뷰, is_admin) |

---

## 테이블 상세

### profiles

유저 프로필. `auth.users`에 대응하는 공개 프로필.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | auth.users.id 참조 |
| username | TEXT UNIQUE | 로그인 아이디 |
| spin_count | INT DEFAULT 0 | 현재 보유 스핀 수 (캐시) |
| last_login_date | DATE | 오늘 최초 로그인 여부 판단용 |
| is_admin | BOOLEAN DEFAULT false | 관리자 여부 (7번 마이그레이션에서 추가) |
| created_at | TIMESTAMPTZ | 가입일 |

RLS 정책: 본인만 SELECT/INSERT/UPDATE 가능

---

### game_scores

슬롯 스핀 결과 원장. 랭킹 집계 기준 테이블.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | - |
| user_id | UUID | auth.users 참조 |
| grade | TEXT | SUPER_LUCK / GREAT_LUCK / GOOD_LUCK / SMALL_LUCK / MISS |
| luck_score | INT (0~100) | 행운 점수 |
| played_at | TIMESTAMPTZ | 플레이 시각 |

RLS 정책: 본인만 SELECT/INSERT 가능

---

### spin_transactions

스핀 지급/차감 원장. `profiles.spin_count`는 이 테이블의 합산 캐시.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | - |
| user_id | UUID | auth.users 참조 |
| amount | INT | 양수: 지급 / 음수: 차감 |
| reason | TEXT | spin_use / daily_reward / ad_reward / event / admin / ranking |
| created_at | TIMESTAMPTZ | - |

RLS 정책:
- SELECT: 본인만 가능
- INSERT: 클라이언트는 `spin_use`(차감)만 허용. 지급(양수)은 서버/service_role만 가능.

> spin_transactions INSERT 시 트리거로 profiles.spin_count 자동 동기화됨 (7번 마이그레이션)

---

### fortune_cookie_messages

포춘쿠키 메시지 풀.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | - |
| author | TEXT | 작성자 |
| message | TEXT | 메시지 내용 |
| is_active | BOOLEAN DEFAULT true | 노출 여부 |
| created_at | TIMESTAMPTZ | - |

RLS 정책:
- SELECT: 인증 유저, is_active=true인 메시지만
- INSERT/UPDATE/DELETE: is_admin=true인 유저만 가능 (7번 마이그레이션에서 추가)

---

### user_fortune_cookie_daily

포춘쿠키 하루 1회 제한 관리.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | - |
| user_id | UUID | auth.users 참조 |
| date | TEXT | KST 기준 YYYY-MM-DD |
| checked_cookie | BOOLEAN | 오늘 쿠키 확인 여부 |
| wrote_message | BOOLEAN | 오늘 메시지 작성 여부 |
| checked_at | TIMESTAMPTZ | 쿠키 확인 시각 |
| wrote_at | TIMESTAMPTZ | 메시지 작성 시각 |
| created_at / updated_at | TIMESTAMPTZ | - |

UNIQUE: (user_id, date)

RLS 정책: 본인만 SELECT/INSERT/UPDATE 가능

---

### user_fortune_logs

슬롯 결과 및 포춘쿠키 획득 기록. 기록장(history) 기능에 사용.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | - |
| user_id | UUID | auth.users 참조 |
| log_type | TEXT | SLOT_RESULT / FORTUNE_COOKIE |
| fortune_type | TEXT | 카드 등급 또는 포춘쿠키 타입 |
| luck_score | INT (nullable) | 슬롯 결과만 값 존재, 포춘쿠키는 null |
| message | TEXT | 운세 메시지 |
| created_at | TIMESTAMPTZ | - |

인덱스: user_id, created_at DESC

RLS 정책: 본인만 SELECT/INSERT 가능

---

## 뷰(View) 목록

### ranking_view

전체 누적 기준 상위 100명. 유저별 최고 luck_score 기준.

```sql
SELECT p.username, MAX(gs.luck_score) AS best_score
FROM game_scores gs JOIN profiles p ON p.id = gs.user_id
GROUP BY p.username ORDER BY best_score DESC LIMIT 100;
```

접근: anon, authenticated 모두 가능

---

### daily_ranking_view

KST 기준 오늘 날짜 최고 luck_score 상위 10명.

```sql
WHERE (gs.played_at AT TIME ZONE 'Asia/Seoul')::date
    = (NOW() AT TIME ZONE 'Asia/Seoul')::date
... LIMIT 10
```

접근: anon, authenticated 모두 가능

---

### admin_dau_view (7번 마이그레이션 추가)

일별 활성 유저 수(DAU). 어드민 전용.

---

### admin_daily_spins_view (7번 마이그레이션 추가)

일별 스핀 횟수. 어드민 전용.

---

### admin_grade_stats_view (7번 마이그레이션 추가)

카드 등급별 획득 수 및 비율. 어드민 전용.

---

## 트리거 목록

### on_auth_user_created

신규 가입 시 profiles 자동 생성. email에서 username 추출.

### on_spin_transaction_insert (7번 마이그레이션 추가)

spin_transactions INSERT 시 profiles.spin_count 자동 동기화.

---

## 알려진 이슈 / 설계 결정

### game_scores vs user_fortune_logs 역할 분리

- `game_scores`: 랭킹 집계 전용 원장
- `user_fortune_logs`: 기록장(history) 전용. 카드 메시지 포함.
- 슬롯 결과는 두 테이블에 동시 저장하는 구조. 진실의 원천은 `game_scores`.

### spin_count 이중 구조

- `spin_transactions`: 원장 (모든 이력)
- `profiles.spin_count`: 캐시 (빠른 조회용)
- 트리거로 자동 동기화되므로 직접 수정 금지.

### user_fortune_cookie_daily.date가 TEXT인 이유

KST 기준 날짜를 클라이언트에서 생성하여 저장하는 방식. 타임존 처리를 단순화하기 위한 의도적 설계.

---

## 어드민 권한 구조

`profiles.is_admin = true`인 유저만 어드민 기능 접근 가능.

관리자 계정 설정 방법 (Supabase SQL Editor):
```sql
UPDATE public.profiles SET is_admin = true WHERE username = '관리자아이디';
```
