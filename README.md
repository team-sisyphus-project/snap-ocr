# SnapOCR

스샷 OCR 정리 — 화면·문서 캡처 이미지에서 텍스트를 추출(OCR)하고 정리해주는 웹 툴.

- 스택: Next.js (App Router, TypeScript) 단일 코드베이스 (프론트엔드 + API Route 백엔드)
- OCR 엔진: 리스트 기반 다중 공급자 — Gemini (`gemini-2.5-flash`, REST SSE) / Claude (`claude-opus-5`, 공식 SDK). 추출 + 정리(문단 복원, 표 구조화, 오탈자 보정)를 한 번에 수행

## 사용법

브라우저에서 앱(로컬 기본 `http://localhost:3000`)에 접속한 뒤:

1. **공급자 선택 + API 키 입력** — 상단에서 Gemini(기본) 또는 Claude를 고르고 본인
   API 키를 입력한다. 입력 필드는 마스킹되며, 키는 이 브라우저(localStorage)에만
   공급자별로 저장되고 서버에는 저장되지 않는다. 추출 요청 시에만 서버로 전달돼
   사용되며, "키 삭제" 버튼으로 언제든 지울 수 있다.
   - Claude는 키를 비워두면 서버 환경변수 `ANTHROPIC_API_KEY`가 있을 경우 그 키를
     폴백으로 사용한다. Gemini는 화면 입력 전용.
2. **이미지 넣기** — 드래그&드롭, `Ctrl/Cmd + V` 붙여넣기, 클릭해서 파일 선택.
   한 번에 1~10장, 여러 장은 순서대로 이어 붙여 하나의 결과로 정리된다.
   썸네일 클릭 시 확대 보기, ✕ 버튼으로 개별 삭제.
   - 지원 형식: PNG · JPEG · WebP · GIF, 장당 최대 5MB.
   - 개수·크기·형식을 벗어나면 즉시 안내가 표시되고 추출로 넘어가지 않는다.
3. **출력 형식 고르기** — 자동(기본) / 플레인 텍스트 / 마크다운 / 표(CSV).
4. **텍스트 추출** — 결과가 실시간(스트리밍)으로 표시된다. "이미지와 대조" 버튼을
   누르면 같은 화면에서 좌(원본 이미지)/우(추출 결과) 2단으로 나란히 비교할 수 있다.
5. **복사·다운로드** — 복사 버튼, 또는 `snapocr-result-YYYYMMDD-HHMMSS.txt|md|csv`
   형식으로 다운로드.

오류 안내: 키 미입력/잘못된 키(401), Gemini 무료 사용량 한도(429), 일시적 오류(5xx)
는 각각 한국어 안내로 표시되며 같은 입력으로 재실행할 수 있다.

## Green-field 로컬 실행 절차

데이터베이스·시드 없음(무상태 앱). 다음만으로 기동된다:

```bash
npm install
npm run dev        # PORT 환경변수를 따르며 기본 3000
```

- 선택 사항: Claude 공급자의 서버 폴백 키를 쓰려면 `.env.example`을 `.env.local`로
  복사해 `ANTHROPIC_API_KEY`를 채운다. UI에서 키를 입력한다면 필요 없다.
- 더미 계정 없음(로그인 없는 단일 화면 도구).

## 테스트 / 빌드

```bash
npm test           # Vitest — 외부 API는 전부 목(mock) 처리, 키 불필요
npm run build
npm start          # PORT 환경변수를 따름
```

## 구조

| 경로 | 역할 |
|---|---|
| `lib/providers.ts` | 공급자 레지스트리(공용 메타). 공급자 추가 = 항목 추가 |
| `lib/ocr-engines.ts` | 서버 전용 스트리밍 엔진 (Claude SDK / Gemini REST SSE) + 에러→한국어 매핑 |
| `lib/prompts.ts` | 출력 포맷별 시스템 프롬프트 빌더 |
| `lib/validate.ts` | 이미지 개수·크기·형식 검증 (클라이언트·서버 이중 방어) |
| `app/api/ocr/route.ts` | 검증 → 엔진 디스패치 → text/plain 스트리밍 응답 |
| `components/` | ApiKeyPanel · ImageDropzone · FormatSelector · ResultPanel(대조 뷰) |
