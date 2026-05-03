# 온유네 Page

가족 주간 일정을 한눈에 볼 수 있는 로컬 대시보드입니다. 프론트엔드는 React + Vite + TypeScript, 백엔드는 Express + TypeScript, 데이터베이스는 PostgreSQL + Prisma로 구성되어 있습니다.

## 프로젝트 구조

```text
.
├─ frontend/               # React + Vite + TypeScript
├─ backend/                # Express + TypeScript + Prisma
├─ docker-compose.yml      # PostgreSQL 컨테이너
├─ .env.example            # 로컬 환경 변수 예시
└─ README.md
```

## 주요 기능

- `온유네 Page` 메인 대시보드
- 주간 전체 일정표와 사람별 주간 일정 카드
- `전체 / 필재 / 병현 / 온유` 필터
- 필재 일정용 Google Calendar 연동 구조
- 병현, 온유 일정은 PostgreSQL에서 조회
- 모바일 대응 반응형 레이아웃
- 모든 일정은 `Asia/Seoul` 기준으로 처리

## 기술 스택

- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma
- Infra: Docker Compose

## 환경 변수

루트에서 `.env.example`을 `.env`로 복사해 사용합니다.

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Set-Location "C:\Users\온유\Workspace\New project 2"
Copy-Item .env.example .env
```

Google Calendar 관련 값은 실제 사용 시에만 채우면 됩니다. `.gitignore`에 `.env`, 토큰 파일, credential 파일이 포함되어 있어 GitHub에 민감정보가 올라가지 않도록 했습니다.

## 실행 방법

### 1. PostgreSQL 실행

```bash
docker compose up -d
```

### 2. 백엔드 설치 및 DB 준비

```bash
cd backend
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
```

### 3. 백엔드 개발 서버 실행

```bash
cd backend
npm run dev
```

기본 주소: `http://localhost:4000`

### 4. 프론트엔드 설치 및 실행

새 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

기본 주소: `http://localhost:5173`

## 단계별 실행 명령어

1. 루트에서 환경 변수 파일 생성

```powershell
Copy-Item .env.example .env
```

2. PostgreSQL 컨테이너 실행

```powershell
Set-Location "C:\Users\온유\Workspace\New project 2"
docker compose up -d
```

3. 백엔드 의존성 설치

```powershell
Set-Location "C:\Users\온유\Workspace\New project 2\backend"
npm install
```

4. Prisma Client 생성

```powershell
npm run db:generate
```

5. 스키마 반영

```powershell
npm run db:deploy
```

6. 초기 데이터 입력

```powershell
npm run db:seed
```

7. 백엔드 실행

```powershell
npm run dev
```

8. 새 터미널에서 프론트엔드 실행

```powershell
Set-Location "C:\Users\온유\Workspace\New project 2\frontend"
npm install
npm run dev
```

## API 개요

- `GET /api/health`
- `GET /api/dashboard?person=all`
- `GET /api/dashboard?person=piljae`
- `GET /api/dashboard?person=byunghyun`
- `GET /api/dashboard?person=onyu`

## Google Calendar 연동 메모

- 현재는 필재 일정용 Google Calendar 조회 함수 구조만 만들어져 있습니다.
- 실제 연동을 위해 아래 환경 변수를 채워야 합니다.
  - `GOOGLE_CALENDAR_ID`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `GOOGLE_REFRESH_TOKEN`
- 값이 비어 있으면 필재 일정은 빈 배열로 처리됩니다.

## 참고 사항

- 초기 seed 데이터는 `필재`, `병현`, `온유` 3명을 생성합니다.
- 병현, 온유 샘플 일정은 2026년 4월 27일 주간 기준으로 들어가 있습니다.
- 로그인 기능 없이 로컬 전용으로 동작합니다.
