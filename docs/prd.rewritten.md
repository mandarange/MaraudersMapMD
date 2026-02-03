# PRD (Final) — MaraudersMapMD

초고속 Markdown 프리뷰 · 간편 편집 · 이미지 · PDF Export · 이력관리 · AI Readability Support (Vendor-neutral)

## 요약

MaraudersMapMD는 Cursor/Antigravity용 확장으로, AI 시대의 문서 생산성을 최적화합니다. 핵심은 **AI를 제공하지 않고**, 대신 외부 AI 도구가 레포의 Markdown 문서를 읽을 때 더 정확하고 효율적으로 이해할 수 있도록 "파일 기반 산출물"을 생성하는 것입니다. 성능 최우선 설계로 프리뷰/편집 흐름에서 프리징을 최소화하고, 이미지/Export/History를 끊김 없는 워크플로우로 통합합니다.

## 문서 메타

- **제품명**: MaraudersMapMD
- **형태**: Cursor/Antigravity Extension (MIT License, GitHub 공개)
- **핵심 방향**: 가볍고 빠름 + AI-first 문서 워크플로우 최적화
- **중요한 원칙**: 우리는 AI(LLM)를 제공하지 않는다. 대신 Cursor/Claude/기타 AI 환경이 레포를 읽을 때 더 정확히/더 적은 토큰으로 이해하게 만드는 "파일 기반 산출물"을 제공한다.

![icon-source.png](./brand/icon-source.png)

## 배경 및 동기

### 동기

요즘 개발은 Cursor, Anthropic Claude, 기타 AI IDE/Agent 환경과 함께 진행되는 경우가 많고, 그 결과 PRD/ADR/RFC/운영 가이드 등 Markdown 문서 작성량이 폭증했습니다.

하지만 AI는 토큰 제한 때문에 큰 문서를 통째로 읽지 못하고, 검색/부분 조회를 반복하면서 시간이 늘고 정확도가 떨어지는 문제가 있습니다.

MaraudersMapMD는 AI 시대의 문서 생산성을 위해:
- 사람이 빠르게 쓰고 검토하며
- AI가 레포에서 문서를 읽을 때도 더 정확히 이해할 수 있게

문서를 구조화하고, 토큰 친화적 산출물(AI Map/Section Pack/Index)을 생성합니다.

### 핵심 가치 제안

- **Blazing-fast preview**: 긴 MD도 빠르게 렌더링
- **Quick edits**: 자주 쓰는 편집 작업을 단축키/커맨드로 즉시
- **Image workflow**: 넣고 정리하고(assets) 깨지지 않게
- **PDF export**: 공유를 위한 원클릭 출력(로컬 이미지 포함)
- **History**: 작업 중 버전 폭증(특히 AI) 상황에서 diff/restore
- **AI Readability Support**: 외부 AI가 읽기 쉬운 파일 산출물 생성 (벤더 중립)

## 목표 / 비목표

### 목표 (Goals)

1. 성능 최우선: 프리뷰/편집 흐름에서 프리징 최소화
2. 편집은 에디터가 주인공: 확장은 "보조 기능" 중심
3. 이미지/Export/History를 끊김 없는 흐름으로 통합
4. AI가 잘 읽는 문서 구조 제공: 문서가 커져도 정확도 유지
5. 벤더 중립: 특정 AI API/SDK 연동 없이 "파일/클립보드/규칙"만으로 AI 성능 개선

### 비목표 (Non-goals)

- 자체 LLM/클라우드/에이전트 제공
- 완전한 WYSIWYG(노션/타이포라급) 구현
- Mermaid/KaTeX/코드하이라이트 기본 ON (옵션으로만 제공)
- 서버 기반 동기화/협업 히스토리(초기 버전 제외)

## 타겟 사용자 / 페르소나

- PRD/설계/운영 문서를 Markdown으로 쓰는 개발자/기획자/CTO
- AI와 함께 문서를 생성/수정/비교/공유하는 워크플로우 사용자
- 긴 문서에서 기존 프리뷰 확장이 느려서 스트레스를 받는 사용자
- Git이 있더라도 "작업 중 스냅샷/복원"이 필요한 사용자

## 성공 지표 (SLO / KPI)

### 성능 SLO

- 프리뷰 첫 렌더(일반 문서): ≤ 150ms
- 타이핑 후 프리뷰 갱신(일반): 디바운스 200ms + 렌더 ≤ 80ms(목표)
- 대량 붙여넣기(예: 50KB~100KB)에서도:
  - 프리뷰 업데이트가 과도하게 반복되지 않음(최대 1~2회)
  - 에디터 입력 프리징 없음

### 기능 KPI(정성/정량)

- PDF Export 성공률, 이미지 링크 깨짐률 감소
- History에서 restore/diff 사용 빈도
- AI artifacts 생성 후 AI 답변 정확도 체감 개선(사용자 피드백)

## 제품 원칙 (Must-have)

1. 우리는 AI를 제공하지 않는다.
2. Vendor-neutral / file-first: `.ai/` 산출물로 외부 AI 도구가 "읽기만 하면" 성능 개선
3. Token-aware: 섹션 분해/지도/인덱스/예산 기반 컨텍스트
4. 가벼움 우선: React/Monaco/Chromium 번들/네이티브 DB 등 무거운 선택 지양
5. 저장 시 생성(onSave) 기본: 타이핑 중 백그라운드 churn 최소화

## 기능 요구사항 (Feature Requirements)

### Preview (초고속 프리뷰)

**기능**
- 현재 Markdown 파일을 Side Preview(Webview)로 열기
- 문서 변경 시 디바운스로 렌더 갱신
- 헤딩/링크 렌더링(표준)
- (옵션) 간단 TOC

**성능 정책**
- 패널 재생성 금지(재사용)
- 렌더는 "마지막 상태만" 반영(out-of-order 방지: version 기반)

**Commands**
- `maraudersMapMd.openPreviewToSide`
- `maraudersMapMd.togglePreviewLock`
- `maraudersMapMd.toggleScrollSync` (v1 권장)

### Quick Edit (편집 보조)

편집은 에디터 본체, 확장은 "삽입/토글/정리"만.

**기능(필수)**
- Bold / Italic / Inline Code
- Link 삽입
- Heading 삽입
- Quote 삽입
- Task toggle

**Commands**
- `maraudersMapMd.format.bold`
- `maraudersMapMd.format.italic`
- `maraudersMapMd.format.inlineCode`
- `maraudersMapMd.insert.link`
- `maraudersMapMd.insert.heading`
- `maraudersMapMd.insert.quote`
- `maraudersMapMd.toggle.task`

### Preview에서 가능한 "초간단 편집"

**기능(필수)**
- 체크박스 클릭 시 원문 토글 (`- [ ]` ↔ `- [x]`)
- (옵션) 헤딩 클릭 시 에디터로 이동

**Acceptance**
- 클릭 토글 후 커서/선택 영역이 비정상적으로 깨지지 않아야 함

### 이미지 워크플로우 (Images)

**목표**
- 이미지가 깨지지 않고 (preview/pdf), 레포 구조가 정리되며, 사용이 즉시 가능해야 한다.

**기능(필수)**

**A) Insert Image from File**
- 파일 선택 → `${mdDir}/assets/`(기본)로 복사 → `![alt](./assets/...)` 삽입

**B) Drag & Drop into Preview**
- 프리뷰에 드롭 → assets 저장 → 링크 삽입

**C) Paste Image in Preview**
- 프리뷰 paste 이벤트로 이미지 blob 수신 → assets 저장 → 링크 삽입

**D) 원격 이미지(URL)**
- 기본 OFF(옵션 ON)

**Commands**
- `maraudersMapMd.images.insertFromFile`
- `maraudersMapMd.images.pasteToAssets`
- (옵션) 드롭은 enable 설정

### Export (HTML / PDF)

#### HTML Export (필수)
- 프리뷰 템플릿 재사용하여 HTML 출력

#### PDF Export (필수)

**핵심 원칙**: Chromium 번들 금지
- `puppeteer-core` + 시스템 Chrome/Chromium 재사용
- 로컬 이미지 포함 보장:
  - 기본 `file://` 절대 경로 변환 + 파일 접근 허용 플래그
  - 옵션: data-uri(작은 이미지용)

**Failure UX**
- 브라우저 탐지 실패 시:
  - 설정으로 경로 지정 안내
  - HTML Export + 브라우저 인쇄(PDF 저장) fallback

**Commands**
- `maraudersMapMd.export.html`
- `maraudersMapMd.export.pdf`

### History (이력관리)

#### 목표
- AI로 문서가 자주/크게 바뀌는 상황에서 diff/restore가 즉시 가능해야 함
- 가볍게(파일 기반), 로컬 우선

#### 저장 정책(필수)
- 기본: onSave 스냅샷
- 추가: 수동 Checkpoint(라벨/태그)
- 옵션: interval 스냅샷(대문서에서는 자동 완화/비활성)

#### UI/동작(필수)
- History: Open for Current File → QuickPick으로 최근 스냅샷 목록
- 액션:
  - View (읽기)
  - Diff with Current (diff)
  - Restore
  - Copy Snapshot Text
- restore 전 보호 옵션:
  - "복원 전 스냅샷 저장" (default true)

#### 저장 위치
- 기본: 워크스페이스 `.maraudersmapmd/history/`
- 옵션: globalStorage

#### Retention(필수)
- max snapshots per file
- max total storage MB
- retention days
- manual checkpoint 보호(default true)

**Commands**
- `maraudersMapMd.history.open`
- `maraudersMapMd.history.createCheckpoint`
- `maraudersMapMd.history.diffWithCurrent`
- `maraudersMapMd.history.restoreSnapshot`
- `maraudersMapMd.history.pruneNow`

### AI Readability Support (Vendor-neutral / file-first)

**핵심**: 외부 AI 도구가 레포의 파일을 읽을 때, 토큰 제한에도 정확히 이해하도록 "AI용 파일 산출물"을 생성한다. 우리는 AI를 호출하거나 제공하지 않는다.

#### AI artifacts 출력 위치(표준)
- 기본: 워크스페이스 루트 `.ai/`
- 구조:

```
.ai/
  <docId>/
    ai-map.md
    index.json
    sections/
      01-....md
      02-....md
```

#### AI Map (필수)
- 문서 구조/섹션 범위/토큰 추정/핵심 요약(추출형)을 포함한 "지도"
- 목적: 외부 AI가 전체 문서 대신 AI Map만 먼저 읽고 필요한 섹션으로 점프

#### Section Pack (필수)
- 헤딩 단위로 문서를 분해해 섹션 파일 생성
- 목적: 외부 AI가 긴 파일을 통째로 읽지 않게 하고 정확도 상승

#### Search Index (권장)
- 섹션별 키워드/중요 문장/링크/토큰 추정이 들어간 로컬 인덱스
- 목적: 사람이든 AI든 "어디를 읽어야 하는지" 즉시 찾기

#### Token Budget Context Export (필수)
- 토큰 예산(1k/2k/4k/8k/custom)에 맞춰:
  - 헤딩 유지 + 섹션 경계 유지
  - 중요한 블록 우선 포함
  - 불필요한 길이는 추출형 축약
- 목적: Cursor/Claude 등에 붙여넣기 용이

#### AI Hint Blocks (필수)

AI가 놓치면 치명적인 정보를 표준화된 형태로 삽입:
- `[AI RULE]`, `[AI DECISION]`, `[AI TODO]`, `[AI CONTEXT]`

예시:
> [AI RULE] Section 4 schema is SSOT. Do not infer alternatives.

- context export 시 우선 포함(가중치)

#### 생성 타이밍
- 기본: onSave 생성
- 수동: "Generate AI Artifacts Now"
- 대문서 보호: 큰 문서는 map만 생성하거나 index/sections 생성을 완화(옵션)

**Commands**
- `maraudersMapMd.ai.generateMap`
- `maraudersMapMd.ai.exportSectionPack`
- `maraudersMapMd.ai.buildIndex`
- `maraudersMapMd.ai.copyContextBudgeted`
- `maraudersMapMd.ai.insertHintRule`
- `maraudersMapMd.ai.insertHintDecision`
- `maraudersMapMd.ai.insertHintNote`

## 설정(Settings) — 최종

### Preview/Render

| 설정 | 기본값 |
|------|--------|
| `maraudersMapMd.preview.updateDelayMs` | 200 |
| `maraudersMapMd.preview.largeDocThresholdKb` | 512 |
| `maraudersMapMd.preview.largeDocUpdateDelayMs` | 700 |
| `maraudersMapMd.preview.scrollSync` | true |
| `maraudersMapMd.render.allowHtml` | false |

### Images

| 설정 | 기본값 |
|------|--------|
| `maraudersMapMd.images.assetsDir` | assets |
| `maraudersMapMd.images.allowRemote` | false |
| `maraudersMapMd.images.filenamePattern` | `{basename}-{yyyyMMdd-HHmmss}` |
| `maraudersMapMd.images.altTextSource` | filename |

### PDF

| 설정 | 기본값 |
|------|--------|
| `maraudersMapMd.pdf.browserPath` | auto |
| `maraudersMapMd.pdf.format` | A4 |
| `maraudersMapMd.pdf.marginMm` | 12 |
| `maraudersMapMd.pdf.printBackground` | true |
| `maraudersMapMd.pdf.embedImages` | fileUrl |
| `maraudersMapMd.pdf.outputDirectory` | `${workspaceFolder}/exports` |
| `maraudersMapMd.pdf.openAfterExport` | true |

### History

| 설정 | 기본값 |
|------|--------|
| `maraudersMapMd.history.enabled` | true |
| `maraudersMapMd.history.storageLocation` | workspace |
| `maraudersMapMd.history.mode` | onSave |
| `maraudersMapMd.history.intervalMinutes` | 10 |
| `maraudersMapMd.history.maxSnapshotsPerFile` | 100 |
| `maraudersMapMd.history.maxTotalStorageMb` | 200 |
| `maraudersMapMd.history.retentionDays` | 30 |
| `maraudersMapMd.history.protectManualCheckpoints` | true |
| `maraudersMapMd.history.snapshotCompression` | gzip |
| `maraudersMapMd.history.createPreRestoreSnapshot` | true |

### AI Artifacts

| 설정 | 기본값 |
|------|--------|
| `maraudersMapMd.ai.enabled` | true |
| `maraudersMapMd.ai.outputDir` | .ai |
| `maraudersMapMd.ai.buildOnSave` | true |
| `maraudersMapMd.ai.generate.map` | true |
| `maraudersMapMd.ai.generate.sections` | true |
| `maraudersMapMd.ai.generate.index` | true |
| `maraudersMapMd.ai.tokenEstimateMode` | koreanWeighted |
| `maraudersMapMd.ai.gitPolicy` | ignoreAll (옵션: commitMapOnly, commitAll) |

## 기술 아키텍처 (경량/고성능)

### 스택
- Extension Host: TypeScript + VS Code Extension API
- Bundler: esbuild (단일 번들)
- Preview: Webview + Vanilla JS
- Markdown renderer: markdown-it (플러그인 최소)
- PDF: puppeteer-core + 시스템 Chrome/Chromium
- History/AI artifacts: file-based + JSON/MD outputs

### "3-Plane Architecture"

1. **Editor Plane**
   - native 편집 + WorkspaceEdit로 조작

2. **Preview Plane**
   - Webview 렌더링 + 클릭/드롭/붙여넣기 이벤트 처리

3. **Storage Plane**
   - History 스냅샷 저장/인덱스
   - AI artifacts 생성(맵/섹션/인덱스)

### 대량 변경(특히 AI paste) 최적화
- 변경량이 큰 경우 bulk mode:
  - 업데이트 coalesce(마지막만 렌더)
  - 디바운스 증가
  - onSave 기반 산출물 생성 유지

## Acceptance Criteria (핵심)

### Preview/성능
- 대량 붙여넣기에서도 에디터 프리징 없음
- 프리뷰 업데이트가 과도 반복되지 않음(최대 1~2회)

### 이미지
- Insert/Drop/Paste로 assets 저장 + 링크 삽입 + preview 표시
- PDF Export에도 로컬 이미지 포함되어 출력

### Export
- PDF 생성 성공(시스템 브라우저 자동 탐지 또는 사용자 지정)
- 실패 시 HTML Export fallback 안내

### History
- onSave 스냅샷 생성
- diff/restore 동작
- retention 정책대로 정리됨
- checkpoint 라벨/태그가 검색 가능

### AI Readability Support
- `.ai/<docId>/ai-map.md`만 읽어도 문서 구조/섹션 범위/토큰 추정이 파악 가능
- Section pack이 헤딩 단위로 안정적으로 생성됨
- Token budget copy가 예산 범위 내로 컨텍스트를 구성(대략)
- AI Hint 블록이 컨텍스트 구성에서 우선 포함됨

## 릴리즈 계획

### v0.1 (MVP)
- Fast preview + quick edit commands
- 이미지 InsertFromFile + Drop + Paste(프리뷰)
- HTML/PDF export
- History: onSave snapshots + checkpoint + diff/restore + retention
- AI artifacts: AI map + section pack + budgeted copy + hint blocks

### v1.0
- History 타임라인 Webview(검색/태그/필터)
- Scroll sync(대문서 auto-off)
- 스타일 프리셋(프리뷰/프린트)
- AI index 기반 "섹션 선택 조합 UI"
- 선택적 코드 하이라이트(기본 OFF)

## 리스크 & 대응

1. **PDF가 시스템 브라우저에 의존**
   - 대응: auto-detect + 경로 설정 + HTML fallback

2. **대문서에서 생성물/히스토리 용량 증가**
   - 대응: gzip + retention + max storage + checkpoint 보호

3. **특정 AI 도구 특화 요구 증가**
   - 대응: 벤더 중립 원칙 유지(파일/클립보드/규칙만), 특정 SDK 연동은 제외

4. **네이밍/브랜딩 리스크**
   - 대응: 원작 자산/로고 사용 금지, "fan-inspired" 고지(필요 시)

## GitHub/오픈소스 운영 가이드(권장)

**기본 .gitignore 추천:**
- `.ai/`
- `.maraudersmapmd/` (history 저장 위치를 workspace로 할 경우)

**팀 공유가 필요하면:**
- `ai-map.md`만 커밋(옵션 정책 `commitMapOnly`)
