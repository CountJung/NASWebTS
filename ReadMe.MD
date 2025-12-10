# NASWebTS Project

이 프로젝트는 Next.js(Frontend)와 NestJS(Backend)를 기반으로 구축된 웹 기반 NAS(Network Attached Storage) 파일 관리 시스템입니다.
사용자 인증, 파일 탐색, 시스템 설정 및 로그 관리 기능을 제공합니다.

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: Material UI (MUI) v6
- **State Management**: React Context API (AuthContext)
- **HTTP Client**: Axios
- **Styling**: Emotion (MUI Default)

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Authentication**: Passport (Google OAuth 2.0, JWT Strategy)
- **Logging**: Winston (Daily Rotate File)
- **Task Scheduling**: @nestjs/schedule (로그 정리 등)
- **Configuration**: dotenv, env-cmd

## ✨ 주요 기능 (Key Features)

### 1. 사용자 인증 및 권한 관리 (Authentication & RBAC)
- **Google OAuth 로그인**: 구글 계정을 연동한 로그인 지원.
- **JWT 인증**: Access Token 기반의 API 보안 처리.
- **사용자 역할(Role)**:
  - `ADMIN`: 모든 기능 접근 가능 (사용자 관리, 시스템 설정 포함).
  - `USER`: 파일 탐색 및 기본 기능 사용 가능.
  - `GUEST`: 제한된 접근 권한.
  - `BANNED`: 접속 차단.
- **관리자 보호**: 환경 변수(`ADMIN_EMAILS`)에 등록된 이메일은 관리자 권한이 고정되어 삭제나 권한 변경이 불가능합니다.

### 2. 파일 관리 (File Management)
- **파일 탐색기**: 디렉토리 구조 탐색, 파일 목록 조회 (Grid/List 뷰 지원).
- **파일 작업**:
  - 파일/폴더 생성
  - 파일 업로드 및 다운로드
  - 파일 삭제 (휴지통 이동 기능 포함)
  - 최근 사용한 파일 조회 (`/recent`)
  - 휴지통 관리 (`/trash`)

### 3. 시스템 설정 (System Configuration)
- **포트 설정**: 관리자 페이지에서 프론트엔드 및 백엔드 서버 포트를 변경 가능.
  - 변경 시 `.env` 및 `.env.local` 파일이 자동으로 업데이트됩니다.
- **사용자 관리**: 관리자는 등록된 사용자의 목록을 조회하고, 역할을 변경하거나 삭제할 수 있습니다.

### 4. 로깅 시스템 (Logging System)
- **백엔드 로그**: `logs/` 디렉토리에 날짜별로 애플리케이션 로그 저장.
- **프론트엔드 로그**: 클라이언트 측 에러 및 정보를 백엔드로 전송하여 통합 관리.
- **로그 자동 정리**: 오래된 로그 파일을 주기적으로 정리하는 스케줄러 동작.

## 📂 프로젝트 구조 (Project Structure)

```
NASWebTS/
├── backend/                 # NestJS Backend Server
│   ├── src/
│   │   ├── auth/           # 인증 모듈 (Google, JWT)
│   │   ├── files/          # 파일 시스템 관리 모듈
│   │   ├── logs/           # 로그 처리 모듈
│   │   ├── system/         # 시스템 설정 관리 모듈
│   │   ├── tasks/          # 스케줄링 작업 (로그 정리)
│   │   ├── users/          # 사용자 관리 모듈
│   │   └── main.ts         # 앱 진입점
│   ├── logs/               # 서버 로그 저장소
│   └── .env                # 백엔드 환경 변수
│
├── frontend/                # Next.js Frontend Client
│   ├── app/                # App Router 페이지 (login, settings, recent 등)
│   ├── components/         # 재사용 가능한 UI 컴포넌트 (FileExplorer, ThemeRegistry 등)
│   ├── context/            # 전역 상태 관리 (AuthContext)
│   ├── lib/                # 유틸리티 (api, logger)
│   └── .env.local          # 프론트엔드 환경 변수
```

## 🚀 설치 및 실행 (Setup & Run)

### 1. 환경 변수 설정
각 폴더(`backend`, `frontend`)에 필요한 환경 변수 파일을 생성해야 합니다.

**Backend (`backend/.env`)**
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
JWT_SECRET=your_jwt_secret
ADMIN_EMAILS=admin@example.com
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
PORT=3000
```

### 2. 의존성 설치
루트 디렉토리에서 각 프로젝트의 의존성을 설치합니다.

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. 실행

**Backend 실행**
```bash
cd backend
npm run start:dev
```

**Frontend 실행**
```bash
cd frontend
npm run dev
```

## 📝 라이선스
This project is licensed under the UNLICENSED license.
