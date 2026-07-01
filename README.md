# 똥싸당 운세 🎰

> 슬롯 + 운세 + 밈 감성의 짧고 중독성 있는 웹 캐주얼 게임  
> 매일 스핀을 돌려 운세 카드를 수집하고 랭킹에 도전하세요

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React + TypeScript + Vite |
| DB / Auth | Supabase (PostgreSQL) |
| 배포 | Cloudflare Workers |
| 사운드 | Web Audio API |

## 프로젝트 구조

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── scripts/           ← 게임 로직 모듈
│   │   │   ├── game.ts        ← 슬롯 아이템, 확률, 당첨 판정
│   │   │   ├── reel.ts        ← 릴 스핀 애니메이션 (서스펜스릴, 넛지릴)
│   │   │   ├── spinManager.ts ← 스핀 횟수 관리 / 무료 스핀 지급
│   │   │   ├── effects.ts     ← 히트 연출 & 시각 효과
│   │   │   ├── fortune.ts     ← 운세 카드 데이터 & 표시
│   │   │   ├── fortuneCookie.ts        ← 포춘쿠키 시스템
│   │   │   ├── fortuneCookieDaily.ts   ← 일일 포춘쿠키
│   │   │   ├── fortuneCookieMessages.ts← 포춘쿠키 메시지 관리
│   │   │   ├── characterCodex.ts  ← 캐릭터 도감
│   │   │   ├── characterManager.ts← 캐릭터 데이터 연동
│   │   │   ├── minigame01.ts  ← 미니게임 '황금똥 찾기'
│   │   │   ├── ranking.ts     ← 일일 랭킹
│   │   │   ├── history.ts     ← 스핀 기록장
│   │   │   ├── dailyReward.ts ← 출석 보상
│   │   │   ├── meta.ts        ← 메타 HUD 영역
│   │   │   ├── popup.ts       ← 팝업 공통 컴포넌트
│   │   │   ├── login.ts       ← 로그인 / 회원가입
│   │   │   ├── sound.ts       ← BGM / 효과음 (Web Audio API)
│   │   │   ├── stars.ts       ← 배경 별 이펙트
│   │   │   ├── storage.ts     ← LocalStorage 유틸
│   │   │   ├── supabase.ts    ← Supabase 클라이언트
│   │   │   └── rules.ts       ← 당첨 룰 정의
│   │   ├── styles/            ← 화면별 CSS
│   │   └── assets/            ← 이미지, 오디오, 이펙트
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                   ← 예정 (Node.js)
├── docs/                      ← 기획 문서 (TODO, GAME_RULES 등)
└── supabase_*.sql             ← DB 마이그레이션 파일
```

## 로컬 개발

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

## 빌드 & 배포

```bash
cd frontend
npm run build    # dist/ 생성
npm run preview  # 빌드 결과 미리보기
```

Cloudflare Workers 배포는 `wrangler.toml` 참고

## DB 마이그레이션

Supabase 대시보드 SQL 에디터에서 순서대로 실행:

```
supabase_setup.sql
supabase_spin_migration.sql
supabase_daily_ranking_migration.sql
supabase_fortune_cookie_migration.sql
supabase_fortune_cookie_daily_migration.sql
supabase_fortune_messages_migration.sql
supabase_user_fortune_logs_migration.sql
supabase_character_migration.sql
supabase_admin_migration.sql
```

## 구현 현황

### 완료

- [x] 회원가입 / 로그인 / 로그아웃 (Supabase Auth)
- [x] 슬롯 머신 — 릴 스핀, 확률 판정, 히트 연출 (서스펜스릴·넛지릴 포함)
- [x] 빠른 결과 보기 (스핀 중 탭으로 즉시 결과)
- [x] 운세 카드 팝업 — 등급별 카드 + 메시지 DB 연동
- [x] 포춘쿠키 — 일일 메시지 (DB 관리)
- [x] 랭킹 — 일일 랭킹 / 내 순위
- [x] 기록장 — 최근 스핀 기록
- [x] 캐릭터 도감 — 조각 수집 & 데이터 연동
- [x] 미니게임 — 황금똥 찾기 (HOT)
- [x] 출석 보상 — 일일 무료 스핀 지급
- [x] BGM / 효과음 (Web Audio API, 로그인 화면 무음 처리)
- [x] 메타 HUD (랭킹·기록·포춘쿠키·도감·미니게임 아이콘)
- [x] 모바일 최적화 (히트 연출, 스크롤, 스핀 버튼 이슈 수정)
- [x] Cloudflare Workers 정적 배포

### 진행 예정

- [ ] 연속 출석 보상 (3일·7일·30일)
- [ ] 업적 / 칭호 시스템
- [ ] SNS 공유 / OG 태그
- [ ] 광고 수익화 (Google AdSense, 보상형 광고)
- [ ] 관리자 페이지 (회원·스핀·공지 관리)
- [ ] 통계 페이지 (DAU, 카드 획득 비율)

## 라이선스

개인 프로젝트 — 무단 복제 및 상업적 이용 금지
