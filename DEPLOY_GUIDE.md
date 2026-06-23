# 배포/운영 가이드 — 용하다 소문난 똥싸당

---

## 1. 현재 프로젝트 구조 확인

### 결론부터: 이 프로젝트엔 Node.js 서버가 없습니다

`backend` 폴더가 비어 있습니다. 별도 서버 없이 아래 구조로 동작합니다.

```
[사용자 브라우저]
    ↓ HTTPS
[프론트엔드 SPA - Vite 빌드 결과물]
    ↓ Supabase JS SDK
[Supabase - DB + 인증 + API 전부 처리]
```

이 구조는 배포가 매우 단순합니다. **정적 파일(HTML/JS/CSS) 호스팅 하나만 있으면 됩니다.**

---

### 프로젝트 구성 요약

| 항목 | 내용 |
|------|------|
| 프론트엔드 | Vite + TypeScript (SPA) |
| 백엔드 | **없음** — Supabase가 대신 처리 |
| DB | Supabase (PostgreSQL) |
| 빌드 명령어 | `cd frontend && npm run build` |
| 빌드 결과물 위치 | `dist/frontend/` |
| 환경변수 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| 실행 방식 | 정적 파일 서빙 (서버 프로세스 불필요) |

---

### 환경변수 정리

`frontend/.env.local`에 저장된 값:

```
VITE_SUPABASE_URL=https://xgawjylqp...supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciO...
```

> **이 값들은 공개해도 괜찮습니다.** Supabase의 `anon key`는 원래 프론트엔드에서 쓰도록 설계된 공개 키입니다. Supabase Row Level Security(RLS)가 보안을 담당합니다.

---

## 2. 배포 방식 비교

이 프로젝트는 "정적 사이트 + Supabase" 구조이므로, Node.js 서버가 필요한 플랫폼은 오히려 불필요하게 복잡합니다.

### 서비스별 비교표

| 서비스 | 정적 사이트 | Node.js 서버 | DB | 난이도 | 무료 플랜 | 월 최소 비용 |
|--------|------------|-------------|-----|--------|----------|------------|
| **Vercel** | 최적 | 서버리스만 | 없음 | 매우 쉬움 | 있음 | $0 ~ $20 |
| **Cloudflare Pages** | 최적 | Workers만 | 없음 | 매우 쉬움 | 있음 | $0 ~ $5 |
| **Railway** | 가능 | 가능 | PostgreSQL | 쉬움 | 없음 (5달러 크레딧) | $5~ |
| **Render** | 가능 | 가능 | PostgreSQL | 쉬움 | 있음 (제한적) | $0 ~ $7 |
| **Fly.io** | 가능 | 가능 | 가능 | 보통 | 있음 (소규모) | $0 ~ $10 |
| **AWS** | S3+CloudFront | EC2 | RDS | 매우 어려움 | 없음 | $10~ |
| **AWS Lightsail** | 가능 | 가능 | 가능 | 어려움 | 없음 | $3.50~ |
| **Supabase** | 없음 | 없음 | 이미 사용 중 | 매우 쉬움 | 있음 | $0 ~ $25 |

---

## 3. 지금 이 프로젝트에 맞는 추천

### 현재 아키텍처(정적 SPA + Supabase)에서 최적 선택: Vercel 또는 Cloudflare Pages

이유:
- Node.js 서버가 없으니 복잡한 서버 배포 불필요
- GitHub에 push하면 자동 배포 (CI/CD 자동 포함)
- 환경변수 설정이 웹 대시보드에서 클릭 몇 번이면 끝
- 무료 플랜으로 수십 개 프로젝트 운영 가능
- HTTPS 자동 설정, CDN 자동 적용, 커스텀 도메인 무료

---

### Vercel vs Cloudflare Pages 비교

| 항목 | Vercel | Cloudflare Pages |
|------|--------|-----------------|
| 무료 대역폭 | 100GB/월 | **무제한** |
| 배포 속도 | 빠름 | 빠름 |
| CDN 속도 | 빠름 | **매우 빠름** (엣지 네트워크) |
| 환경변수 | 웹 대시보드 | 웹 대시보드 |
| 여러 프로젝트 | 무제한 (무료) | 무제한 (무료) |
| 한국 속도 | 보통 | **빠름** (한국 PoP 있음) |
| 사용 편의성 | 최상 | 매우 좋음 |

**모바일 게임을 고려하면 Cloudflare Pages 우세** — 대역폭 무제한 + 한국 CDN 빠름 + 게임 이미지/에셋 캐싱 강점.

---

## 4. 비용 상세

### Supabase (이미 사용 중)

| 플랜 | 비용 | 주요 한도 |
|------|------|----------|
| Free | $0/월 | DB 500MB, MAU 50,000, 7일 비활성 시 일시정지 |
| Pro | $25/월 | DB 8GB, MAU 100,000, 일시정지 없음 |

> 초기에는 Free로 충분. 유저가 늘면 Pro로 업그레이드.

### Cloudflare Pages

| 플랜 | 비용 | 주요 한도 |
|------|------|----------|
| Free | $0/월 | 빌드 500회/월, 프로젝트 무제한, 대역폭 무제한 |
| Pro | $20/월 | 빌드 5,000회/월 |

> 무료 플랜으로 게임 10개 이상 운영 가능.

### Vercel

| 플랜 | 비용 | 주요 한도 |
|------|------|----------|
| Hobby (무료) | $0/월 | 대역폭 100GB/월, 상업적 이용 불가 |
| Pro | $20/월 | 대역폭 1TB/월, 상업적 이용 가능 |

> 수익화 예정이면 Pro 필요. 개인 포트폴리오면 무료 가능.

---

## 5. 내 상황 기준 최종 추천 — 단계별 로드맵

### 1단계: 지금 당장 (현재 → 유저 수백 명)

```
프론트엔드: Cloudflare Pages (무료)
백엔드/DB:  Supabase Free (무료)
도메인:     Cloudflare 도메인 구매 ($8~12/년)
총 비용:    연 1~2만원
```

추천 이유: 빌드→배포 자동화, 대역폭 무제한, 한국 속도 빠름, 비용 0원.

---

### 2단계: 유저가 늘었을 때 (MAU 5만 명 이상)

```
프론트엔드: Cloudflare Pages (계속 무료)
백엔드/DB:  Supabase Pro ($25/월)
도메인:     그대로 유지
총 비용:    월 $25 (약 3만5천원)
```

Supabase Free는 비활성 프로젝트를 자동 일시정지하므로, 실서비스는 Pro 전환이 안정적.

---

### 3단계: 여러 게임을 운영할 때

```
프론트엔드: Cloudflare Pages 프로젝트 여러 개 (게임당 1개, 전부 무료)
백엔드/DB:  Supabase 1개 프로젝트에 테이블만 게임별로 분리 (or 게임별 프로젝트)
도메인:     game1.yourdomain.com, game2.yourdomain.com (서브도메인으로 분리)
총 비용:    월 $25 (Supabase Pro 1개로 전 게임 커버 가능)
```

---

### 4단계: 커스텀 Node.js 서버가 필요해질 때

> 실시간 멀티플레이, 결제 서버, 어드민 API 등이 필요해지는 시점

```
서버: Railway 또는 Render ($7~$20/월)
이유: GitHub 연동 자동배포, Node.js 지원, 복잡한 설정 불필요
AWS는 이 시점에도 아직 불필요
```

---

## 6. 실제 배포 순서 (초보자 기준)

### 0단계 — GitHub 정리

```bash
# 1. .env.local 이 .gitignore에 있는지 확인
cat frontend/.gitignore | grep env

# 없으면 추가
echo ".env.local" >> frontend/.gitignore
echo ".env" >> frontend/.gitignore

# 2. GitHub에 푸시
git add .
git commit -m "배포 준비"
git push origin main
```

> **중요**: `.env.local`은 절대 GitHub에 올리면 안 됩니다. 환경변수는 Cloudflare 대시보드에 따로 입력합니다.

---

### 1단계 — Cloudflare 계정 만들기

1. [cloudflare.com](https://cloudflare.com) 접속 → 회원가입
2. 왼쪽 메뉴 `Workers & Pages` → `Pages` → `Create a project`
3. `Connect to Git` 선택 → GitHub 계정 연결

---

### 2단계 — 프로젝트 연결 및 환경변수 설정

Cloudflare Pages 빌드 설정 화면:

```
Framework preset:  None (또는 Vite)
Root directory:    frontend
Build command:     npm run build
Build output dir:  dist/frontend
```

환경변수 추가 (같은 화면 하단):

```
VITE_SUPABASE_URL       = https://xgawjylqp...supabase.co
VITE_SUPABASE_ANON_KEY  = eyJhbGciO...
```

→ `Save and Deploy` 클릭 → 1~2분 후 자동 배포 완료

배포 후 임시 URL 생성: `프로젝트명.pages.dev`

---

### 3단계 — 도메인 구매 및 연결

Cloudflare에서 직접 도메인 구매 추천 (DNS 설정 자동):

1. Cloudflare 대시보드 → `Domain Registration` → 원하는 도메인 검색
2. 구매 ($8~12/년)
3. Pages 프로젝트 → `Custom domains` → 구매한 도메인 입력
4. HTTPS는 자동 설정 (무료 SSL 인증서 자동 발급)

---

### 4단계 — 로컬 빌드 확인

```bash
cd frontend
npm run build
# 오류 없이 dist/frontend/ 폴더가 생겨야 함
```

---

### 5단계 — Supabase 허용 URL 추가

Supabase 대시보드 → `Authentication` → `URL Configuration`

```
Site URL:           https://yourdomain.com
Redirect URLs 추가: https://yourdomain.com/**
                    https://프로젝트명.pages.dev/**
```

---

### 6단계 — 배포 후 기능 테스트 (실기기 필수)

```
□ 사이트 URL 접속 → 화면이 뜨는가?
□ 로그인 → 정상 동작하는가?
□ 스핀 → 결과가 나오는가?
□ 일일 보상 팝업 → 정상 동작하는가?
□ 포춘쿠키 → 정상 동작하는가?
□ 랭킹 → 정상 동작하는가?
□ 모바일(실기기)에서 접속 → 레이아웃 정상인가?
□ Network 탭에서 빨간 에러(4xx, 5xx)가 없는가?
□ Supabase 대시보드 → Table Editor → 데이터가 정상 저장되는가?
```

---

## 7. 추천 아키텍처

```
[사용자 스마트폰/PC]
        │
        ▼ HTTPS (자동)
[Cloudflare Pages CDN]  ←── GitHub push → 자동 빌드/배포
  HTML + JS + 이미지
        │
        ▼ HTTPS (Supabase JS SDK)
[Supabase]
  ├─ PostgreSQL DB (유저, 스핀, 랭킹, 포춘쿠키)
  ├─ Auth (로그인)
  ├─ Row Level Security (보안)
  └─ Storage (이미지 필요 시)

※ 별도 서버 없음 = 관리할 인프라 없음 = 유지비 최소
```

여러 게임 운영 시 구조:

```
yourdomain.com           → Cloudflare Pages (프로젝트 A)
game2.yourdomain.com     → Cloudflare Pages (프로젝트 B)
game3.yourdomain.com     → Cloudflare Pages (프로젝트 C)
         │
         ▼ 공통
    [Supabase Pro 1개]
  게임별 테이블로 분리
```

---

## 8. 최종 배포 전 체크리스트

### GitHub

```
□ .env.local 이 .gitignore 에 포함되어 있음
□ main 브랜치에 최신 코드가 push 되어 있음
□ node_modules/ 가 .gitignore 에 포함되어 있음
```

### 빌드

```
□ 로컬에서 npm run build 오류 없이 성공
□ dist/frontend/ 폴더가 생성됨
□ dist/frontend/index.html 이 존재함
```

### 환경변수

```
□ VITE_SUPABASE_URL 을 Cloudflare 대시보드에 입력함
□ VITE_SUPABASE_ANON_KEY 를 Cloudflare 대시보드에 입력함
□ .env.local 파일은 로컬에만 있음 (GitHub에 없음)
```

### Supabase

```
□ 테이블 마이그레이션 SQL 전부 실행됨
   - supabase_setup.sql
   - supabase_spin_migration.sql
   - supabase_daily_ranking_migration.sql
   - supabase_fortune_cookie_migration.sql
   - supabase_fortune_cookie_daily_migration.sql
   - supabase_user_fortune_logs_migration.sql
□ Row Level Security(RLS) 정책이 설정되어 있음
□ Supabase → Authentication → URL Configuration 에 배포 URL 추가됨
```

### 도메인 / HTTPS

```
□ 커스텀 도메인이 연결되어 있음 (또는 .pages.dev 임시 URL 사용)
□ HTTPS 접속이 됨 (자물쇠 아이콘 확인)
```

### 기능 테스트 (실기기 모바일로 확인)

```
□ 로그인 동작
□ 스핀 + 결과 팝업
□ 일일 보상 팝업
□ 포춘쿠키
□ 랭킹
□ 나의 기록
□ 로그아웃
□ 첫 화면 로딩 5초 이내
```

---

## 한 줄 요약

> **지금 당장: Cloudflare Pages (무료) + Supabase Free → GitHub push만 하면 자동 배포. 도메인만 사면 연 1~2만원에 운영 가능. Node.js 서버는 지금 필요 없습니다.**
