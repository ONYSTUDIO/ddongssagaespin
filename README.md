# 똥싸개 슬롯머신

슬롯 + 운세 + 밈 감성의 짧고 중독성 있는 웹 게임

## 프로젝트 구조

```
project-root/
├── frontend/              ← 게임 클라이언트 (Vite + TypeScript)
│   ├── src/
│   │   ├── assets/        ← 오디오, 이미지, 이펙트 (STEP 2에서 채울 예정)
│   │   ├── scripts/       ← 게임 로직 모듈
│   │   │   ├── game.ts    ← 슬롯 아이템, 확률, 당첨 판정
│   │   │   ├── reel.ts    ← 릴 스핀 애니메이션
│   │   │   ├── effects.ts ← 결과 메시지 & 시각 효과
│   │   │   ├── fortune.ts ← 운세 데이터 & 카드 표시
│   │   │   ├── sound.ts   ← 사운드 (STEP 2 예정)
│   │   │   └── storage.ts ← LocalStorage 저장 (STEP 3 예정)
│   │   ├── styles/
│   │   │   └── main.css   ← 전체 스타일
│   │   └── main.ts        ← 진입점, spin() & 이벤트 연결
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/               ← Node.js + Express API (STEP 4 예정)
└── README.md
```

## 개발 시작

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

## 빌드

```bash
cd frontend
npm run build    # dist/frontend/ 생성
npm run preview  # 빌드 결과 미리보기
```

## 개발 단계

- [x] STEP 1 — 프로젝트 구조 개선 (TypeScript + Vite + 파일 분리)
- [ ] STEP 2 — 게임 느낌 강화 (사운드, 파티클, Near Miss, 화면 쉐이크)
- [ ] STEP 3 — 메타 시스템 (LocalStorage 저장, 출석, 운세 도감)
- [ ] STEP 4 — Node.js 백엔드 구축 (Express API, SQLite)
- [ ] STEP 5 — 공유 기능 (SNS 공유, OG 태그, 결과 이미지)
