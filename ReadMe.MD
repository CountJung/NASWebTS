
-----

# 📂 Project: Web NAS (Private Cloud Storage)

이 문서는 **OS에 독립적**으로 동작하는 웹 기반 NAS 시스템을 구축하기 위한 AI 코딩 지침서입니다.

## 0\. 🤖 Role Definition

  * **Role:** Senior Full-Stack Developer (Specialized in TypeScript)
  * **Goal:** Build a responsive, secure file management system using NestJS and Next.js.
  * **Target Environment:** Docker (Linux/Windows/macOS agnostic)

## 1\. 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Backend** | NestJS, TypeScript, Node.js `fs` module, Multer |
| **Frontend** | Next.js 14+ (App Router), TypeScript, Axios |
| **UI/Design** | **MUI (Material UI)** v5, Emotion |
| **State/Query**| React Query (TanStack Query) or SWR (for file caching) |
| **Infrastructure** | Docker, Docker Compose |

## 2\. 📜 Global Rules & Coding Standards

1.  **OS Independence:** 파일 경로 처리 시 반드시 Node.js의 `path.join()`, `path.sep` 등을 사용하여 윈도우(\\)와 유닉스(/) 경로 차이를 해결한다.
2.  **Security First:** `Path Traversal` 공격 방지를 위해, 요청된 경로가 반드시 지정된 `ROOT_DIR` 내부에 있는지 검증하는 로직을 필수적으로 포함한다.
3.  **Responsive Design:** MUI의 `Grid`, `Box`, `useMediaQuery`를 활용하여 모바일(햄버거 메뉴)과 데스크탑(사이드바) 뷰를 완벽히 지원한다.
4.  **Type Safety:** 프론트엔드와 백엔드 간에 공유할 수 있는 `FileDTO` 등의 인터페이스를 명확히 정의한다.

-----

## 3\. 📅 Phase-by-Phase Instruction Prompts

*(Copy and paste these prompts sequentially to the AI)*

### 🚀 Phase 1: Project Initialization & Layout

**Prompt:**

```markdown
[Phase 1 Task]
NestJS(Backend)와 Next.js(Frontend) 프로젝트의 기본 구조를 잡아줘.

1. **Backend (NestJS):**
   - Port: 4000
   - Global Prefix: `/api`
   - CORS: `http://localhost:3000` 허용
   - `.env`를 통해 `ROOT_PATH`(파일 저장 루트)를 설정 가능하게 해줘.

2. **Frontend (Next.js + MUI):**
   - Next.js 14 App Router 기반으로 설정.
   - MUI `ThemeRegistry`를 구성하여 SSR 스타일 깨짐 방지.
   - **Layout:**
     - Left: Sidebar (Navigation). 데스크탑에선 고정, 모바일에선 `Drawer`로 동작.
     - Top: Header (AppBar).
     - Center: Main Content.
   - 모바일 반응형 처리를 위한 `useMediaQuery` 훅 사용 예시 포함.
```

### 📂 Phase 2: Backend File System Core

**Prompt:**

```markdown
[Phase 2 Task]
NestJS에서 로컬 파일 시스템을 읽고 쓰는 `FileSystemService`를 구현해줘.

1. **API Endpoints:**
   - `GET /api/files?path=/`: 해당 경로의 파일/폴더 목록 반환 (이름, 타입, 크기, 수정일).
   - `GET /api/files/download?path=/...`: 파일 다운로드 (StreamableFile 사용).

2. **Security & OS Agnostic:**
   - `path.resolve`와 `path.normalize`를 사용하여 `Path Traversal` 공격을 막는 검증 로직(`validatePath`)을 반드시 구현해.
   - 윈도우와 리눅스 어디서든 경로가 깨지지 않게 `path` 모듈을 철저히 사용해.
```

### 🖥️ Phase 3: Frontend Explorer UI

**Prompt:**

```markdown
[Phase 3 Task]
Next.js와 MUI를 사용하여 파일 탐색기 UI를 구현해줘.

1. **Component Structure:**
   - `FileExplorer`: 메인 컴포넌트.
   - `FileGridItem`: 파일/폴더 아이콘과 이름을 보여주는 카드 형태 컴포넌트.
   - `BreadcrumbsNav`: 현재 경로를 표시하고 상위로 이동 가능한 내비게이션.

2. **Logic:**
   - `TanStack Query` (또는 SWR)를 사용하여 데이터를 페칭하고 캐싱해.
   - 폴더 클릭 시 Query Param(`?path=...`)을 업데이트하여 내용을 갱신.
   - 파일 클릭 시 다운로드 혹은 미리보기 트리거.
   - 데이터 로딩 중에는 `Skeleton` UI 표시, 에러 시 `Snackbar` 표시.
```

### 📤 Phase 4: File Operations (Upload & Manage)

**Prompt:**

```markdown
[Phase 4 Task]
파일 업로드 및 관리 기능을 추가해줘.

1. **Backend:**
   - `POST /api/files/upload`: `Multer`를 사용하여 파일 업로드. (동일 이름 존재 시 자동 리네임 처리).
   - `POST /api/files/mkdir`: 새 폴더 생성.
   - `DELETE /api/files`: 파일/폴더 삭제.

2. **Frontend:**
   - `React Dropzone`을 사용하여 드래그 앤 드롭 업로드 구현.
   - 업로드 진행 상태를 MUI `LinearProgress`로 표시.
   - 파일 아이템에 우클릭 혹은 메뉴 버튼을 달아서 '삭제', '이름 변경' 옵션 제공.
   - 삭제 시 `Dialog` 컴포넌트로 확인 팝업 띄우기.
```

### 🐳 Phase 5: Docker Deployment

**Prompt:**

```markdown
[Phase 5 Task]
이 프로젝트를 OS 상관없이 배포하기 위한 Docker 설정을 작성해줘.

1. **Requirements:**
   - `Dockerfile`: Frontend(Next.js), Backend(NestJS) 각각 작성 (Multi-stage build로 용량 최적화).
   - `docker-compose.yml`:
     - 두 컨테이너를 동시에 실행.
     - Host의 `./nas-storage` 폴더를 백엔드 컨테이너의 `/app/data`로 볼륨 마운트 (데이터 영속성 보장).
     - 네트워크 설정으로 컨테이너 간 통신 연결.
```

-----

## 4\. 📝 Tips for AI Interaction

  * 코드가 길어지면 \*\*"파일별로 나누어서 코드를 작성해줘"\*\*라고 요청하세요.
  * 에러가 발생하면 에러 로그를 그대로 복사해서 \*\*"이 에러의 원인과 해결 코드를 줘"\*\*라고 하세요.
  * 디자인이 마음에 안 들면 \*\*"MUI 스타일을 좀 더 모던하게, 그림자 효과를 주고 간격을 넓혀줘"\*\*라고 구체적으로 지시하세요.