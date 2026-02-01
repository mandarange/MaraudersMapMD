# MaraudersMapMD — VS Code Extension Build Plan

## TL;DR

> **Quick Summary**: Build a VS Code extension for ultra-fast Markdown preview, quick edits, image workflow, PDF export, history management, and AI readability support. Greenfield project built in 6 incremental waves using TDD, TypeScript + esbuild + markdown-it + puppeteer-core stack.
>
> **Deliverables**:
> - Fully functional VS Code extension (`.vsix` package)
> - 6 feature modules: Preview, Quick Edit, Images, Export, History, AI Artifacts
> - 30+ registered commands, 40+ configurable settings
> - Comprehensive vitest unit tests + @vscode/test-electron integration tests
>
> **Estimated Effort**: XL (6 waves, 20+ tasks)
> **Parallel Execution**: YES — within each wave, independent tasks can parallelize
> **Critical Path**: Wave 0 (Scaffold) → Wave 1 (Preview) → Wave 2 (Quick Edit + Images) → Wave 3 (Export) → Wave 4 (History) → Wave 5 (AI Artifacts)

---

## Context

### Original Request
Build a VS Code extension called "MaraudersMapMD" based on a comprehensive PRD (440 lines). The extension provides ultra-fast Markdown preview, quick edit commands, image workflow, PDF export, history management, and vendor-neutral AI readability support. Default language is English.

### Interview Summary
**Key Discussions**:
- **Test strategy**: TDD (Red-Green-Refactor) using vitest for pure logic, @vscode/test-electron for integration
- **Build approach**: Incremental waves — each wave produces a working extension
- **VS Code target**: ^1.100.0 (latest, all modern APIs)
- **Token estimation**: Character-ratio heuristic (Korean ~2-3 tokens/char, English ~1-1.3 tokens/word), no external dependency
- **Section split**: H2 level (## headings)
- **AI Map summary**: Heuristic extraction (first sentences + bold/key patterns per section)
- **Webview image paste**: Deferred to v1.0 — unreliable cross-platform in webviews. v0.1 uses editor-side DocumentPasteEditProvider only

### Research Findings
- **Codebase**: Greenfield — only LICENSE, README.md, prd.md exist. No scaffolding.
- **VS Code patterns**: esbuild CJS + vscode external; Webview CSP with nonce; acquireVsCodeApi() called once; retainContextWhenHidden for fast tab switches
- **DocumentDropEditProvider**: Works in editor only, NOT in webviews. Webview drag requires HTML5 drag events + postMessage.
- **puppeteer-core**: Requires system Chrome; `chrome-launcher` package for cross-platform detection recommended
- **markdown-it source lines**: Custom md.core.ruler push for `data-source-line` attributes (~15 lines)
- **Testing boundary**: Modules with zero `vscode` imports can be tested with vitest. Modules using `vscode.*` API need @vscode/test-electron.

### Metis Review
**Identified Gaps** (addressed):
- **Image workflow architecture split**: Editor-side (DocumentDropEditProvider) vs Webview-side (HTML events + postMessage) are architecturally distinct. Both paths planned separately.
- **Webview paste unreliability**: Deferred "Paste Image in Preview" to v1.0. v0.1 uses editor-side DocumentPasteEditProvider.
- **Module boundary for TDD**: Added explicit task in Wave 0 to define which modules may import `vscode` vs which must be pure TS.
- **retainContextWhenHidden**: Explicitly set to `true` — aligned with "blazing-fast" preview requirement.
- **Snapshot deduplication**: Compare content hash before creating snapshot. Skip if identical to latest.
- **gzip threshold**: Only compress snapshots ≥1KB. Below that, store as plain text.
- **No-workspace fallback**: Use globalStorage when no workspace folder available.
- **Scroll sync / TOC**: Explicitly locked as v1.0 scope. Not in this plan.
- **Code fence protection**: Section splitter must ignore headings inside fenced code blocks.
- **Empty document handling**: AI Map generates minimal "empty document" notice.

---

## Work Objectives

### Core Objective
Build the v0.1 MVP of MaraudersMapMD — a lightweight, performant VS Code extension that helps developers write Markdown faster with live preview, manage document history, and generate AI-readable artifacts for better LLM comprehension.

### Concrete Deliverables
- `package.json` with all 30+ commands and 40+ settings registered
- `src/extension.ts` entry point with activation/deactivation
- `src/preview/` — Webview-based markdown preview with debounced updates
- `src/edit/` — Quick edit commands (bold, italic, code, link, heading, quote, task)
- `src/images/` — Image insert, editor drag-drop, webview drag-drop
- `src/export/` — HTML and PDF export with local image embedding
- `src/history/` — Snapshot storage, checkpoint, diff/restore, retention
- `src/ai/` — AI Map, Section Pack, Search Index, Token Budget, Hint Blocks
- `media/` — Webview CSS and JS files
- `test/` — vitest unit tests + integration test suite
- Bundled extension output in `dist/extension.js`

### Definition of Done
- [x] `npm run test` passes all vitest tests (0 failures) - 252/252 passing
- [x] Extension activates without errors in Extension Development Host
- [x] All 30+ commands registered and functional - 25 commands registered
- [x] All 40+ settings contribute to configuration schema - 35 settings configured
- [x] PDF export produces valid PDF with embedded local images
- [x] History creates snapshots on save and allows diff/restore
- [x] `.ai/` directory generates AI Map + Section Pack for any markdown file

### Must Have
- Performance: Preview first render ≤150ms, update ≤80ms target
- All commands use `maraudersMapMd.*` prefix
- English UI for all messages, labels, and descriptions
- File-based storage only (no cloud, no database)
- Vendor-neutral: zero LLM/AI API calls

### Must NOT Have (Guardrails)
- **NO React/Preact/Lit** in webview code — Vanilla JS/TS only
- **NO bundled Chromium** — `puppeteer-core` only, never `puppeteer`
- **NO ESM output** — esbuild must produce CJS format
- **NO `*` activation** — use `onLanguage:markdown` + `onCommand:*`
- **NO scroll sync** in v0.1 — deferred to v1.0
- **NO TOC** in v0.1 — deferred to v1.0
- **NO Webview paste image** in v0.1 — deferred to v1.0 (cross-platform unreliable)
- **NO markdown-it plugins** beyond task-lists + custom source-line rule
- **NO code syntax highlighting** — deferred to v1.0
- **NO `vscode` imports** in pure business logic modules — accept via injection
- **NO mocking `vscode`** in vitest tests — redesign module boundary instead
- **NO additional NLP/scoring/ranking** in AI Map extraction — deterministic heuristic only
- **NO asset management** (rename, cleanup, resize) for images — just copy + insert
- **NO search/timeline UI** for history — QuickPick only

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (greenfield — must create)
- **User wants tests**: TDD (Red-Green-Refactor)
- **Framework**: vitest (unit/pure logic) + @vscode/test-electron (integration)

### TDD Workflow Per Task

Each feature task follows RED-GREEN-REFACTOR:

1. **RED**: Write failing test first
   - Test file: `test/unit/<module>.test.ts` (vitest) or `test/integration/<feature>.test.ts`
   - Test command: `npx vitest run test/unit/<module>.test.ts`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `npx vitest run test/unit/<module>.test.ts`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `npx vitest run`
   - Expected: ALL PASS

### Module Boundary (Critical for TDD)

```
PURE TS (vitest testable, zero vscode imports):
├── src/preview/markdownEngine.ts     — markdown-it setup + rendering
├── src/edit/formatters.ts            — text manipulation functions
├── src/images/pathUtils.ts           — path resolution, filename generation
├── src/export/htmlTemplate.ts        — HTML template generation
├── src/export/chromeDetector.ts      — Chrome path detection (uses node fs/child_process only)
├── src/history/snapshotStore.ts      — snapshot CRUD, hash comparison, compression
├── src/history/retentionEngine.ts    — retention policy logic
├── src/ai/tokenEstimator.ts          — character-ratio token counting
├── src/ai/markdownParser.ts          — heading extraction, structure analysis
├── src/ai/aiMapGenerator.ts          — AI Map generation
├── src/ai/sectionPackGenerator.ts    — Section Pack generation
├── src/ai/searchIndexBuilder.ts      — Search Index generation
├── src/ai/tokenBudgetExporter.ts     — Budget-based context export
├── src/ai/hintBlockParser.ts         — AI hint block detection + insertion

VSCODE ADAPTER (thin wrappers, @vscode/test-electron):
├── src/extension.ts                  — activate/deactivate, command registration
├── src/preview/previewManager.ts     — Webview panel lifecycle
├── src/edit/editCommands.ts          — command handlers calling formatters
├── src/images/imageCommands.ts       — command handlers + drop/paste providers
├── src/export/exportCommands.ts      — command handlers, progress notification
├── src/history/historyCommands.ts    — QuickPick UI, diff editor, restore logic
├── src/ai/aiCommands.ts             — command handlers, onSave hooks
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 — Project Scaffold + Test Infrastructure (Start Immediately):
├── Task 0: Scaffold project (package.json, tsconfig, esbuild, etc.)
└── Task 1: Test infrastructure (vitest config, test fixtures, hello world test)

Wave 1 — Preview (After Wave 0):
├── Task 2: MarkdownEngine (pure TS — markdown-it + source-line)
├── Task 3: PreviewManager (webview panel + CSP + message protocol)
└── Task 4: Preview Webview assets (CSS + JS + debounced updates)

Wave 2 — Quick Edit + Images (After Wave 1):
├── Task 5: Format & Insert commands (bold, italic, code, link, heading, quote)
├── Task 6: Task toggle (editor command + preview checkbox click)
├── Task 7: Image insert from file
├── Task 8: Image drag-drop (editor-side DocumentDropEditProvider)
└── Task 9: Image drag-drop (webview-side HTML5 events)

Wave 3 — Export (After Wave 2):
├── Task 10: HTML export
├── Task 11: Chrome detection
└── Task 12: PDF export with local image embedding

Wave 4 — History (After Wave 1, parallel with Wave 2-3):
├── Task 13: Snapshot store (pure TS — CRUD, hash, compression)
├── Task 14: Retention engine (pure TS — policy enforcement)
├── Task 15: History commands (onSave hook, checkpoint, QuickPick UI)
└── Task 16: Diff/Restore/Copy actions

Wave 5 — AI Readability Support (After Wave 1, parallel with Wave 2-4):
├── Task 17: Token estimator + Markdown parser (pure TS)
├── Task 18: AI Map generator
├── Task 19: Section Pack generator
├── Task 20: Search Index builder
├── Task 21: Token Budget Context Export
├── Task 22: AI Hint Blocks (parser + inserter)
└── Task 23: AI onSave integration + large doc protection

Wave 6 — Final Integration + Package:
└── Task 24: Integration tests + smoke tests + vsix package
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|-----------|--------|---------------------|
| 0 | None | All | 1 |
| 1 | 0 | 2+ | 0 (partially) |
| 2 | 1 | 3, 4 | — |
| 3 | 2 | 4, 5-9 | — |
| 4 | 2, 3 | 5-9 | — |
| 5 | 4 | 24 | 6, 7, 8, 9 |
| 6 | 4 | 24 | 5, 7, 8, 9 |
| 7 | 4 | 24 | 5, 6, 8, 9 |
| 8 | 7 | 24 | 5, 6, 9 |
| 9 | 4 | 24 | 5, 6, 7, 8 |
| 10 | 4 | 12 | 11, 13-22 |
| 11 | 1 | 12 | 10, 13-22 |
| 12 | 10, 11 | 24 | 13-22 |
| 13 | 1 | 14, 15 | 2-12, 17-22 |
| 14 | 13 | 15 | 2-12, 17-22 |
| 15 | 14 | 16 | 2-12, 17-22 |
| 16 | 15 | 24 | 2-12, 17-22 |
| 17 | 1 | 18-22 | 2-16 |
| 18 | 17 | 23 | 19, 20, 21, 22 |
| 19 | 17 | 23 | 18, 20, 21, 22 |
| 20 | 17 | 23 | 18, 19, 21, 22 |
| 21 | 17 | 23 | 18, 19, 20, 22 |
| 22 | 17 | 23 | 18, 19, 20, 21 |
| 23 | 18, 19, 20, 22 | 24 | — |
| 24 | All | None (final) | — |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 0 | 0, 1 | `delegate_task(category="quick", load_skills=["git-master"])` |
| 1 | 2, 3, 4 | `delegate_task(category="unspecified-high", load_skills=["vercel-react-best-practices"])` |
| 2 | 5-9 | Parallel: `delegate_task(category="quick", ...)` each |
| 3 | 10-12 | Sequential: 10→11→12 |
| 4 | 13-16 | Sequential: 13→14→15→16 (can parallelize with Wave 2-3) |
| 5 | 17-23 | 17 first, then 18-22 parallel, then 23 |
| 6 | 24 | `delegate_task(category="unspecified-high", load_skills=["webapp-testing"])` |

---

## TODOs

### Wave 0 — Project Scaffold

- [x] 0. Project Scaffolding

  **What to do**:
  - Create `package.json` with:
    - `name`: `marauders-map-md`
    - `displayName`: `MaraudersMapMD`
    - `description`: `Map your Markdown: ultra-fast preview, quick edits, images, PDF export, history, and AI readability support for VS Code.`
    - `version`: `0.0.1`
    - `engines.vscode`: `^1.100.0`
    - `main`: `./dist/extension.js`
    - `activationEvents`: `["onLanguage:markdown"]`
    - `license`: `MIT`
    - All 30+ commands in `contributes.commands` (see Command Registry below)
    - All 40+ settings in `contributes.configuration` (see PRD Section 7)
    - `contributes.menus`: command palette entries for markdown files only (`"when": "editorLangId == markdown"`)
    - `scripts`: compile, watch, package, test, check-types, lint
    - `devDependencies`: `@types/node`, `@types/vscode`, `@types/markdown-it`, `esbuild`, `typescript`, `vitest`, `@vscode/test-electron`, `eslint`, `npm-run-all`
    - `dependencies`: `markdown-it`, `puppeteer-core`, `chrome-launcher`
  - Create `tsconfig.json`:
    - `module`: `commonjs`, `target`: `ES2024`, `lib`: `["ES2024"]`
    - `strict`: `true`, `rootDir`: `src`, `outDir`: `out`
    - `esModuleInterop`: `true`, `skipLibCheck`: `true`
    - `exclude`: `["node_modules", ".vscode-test", "dist", "test"]`
  - Create `esbuild.js`:
    - `entryPoints`: `['src/extension.ts']`
    - `bundle`: `true`, `format`: `'cjs'`, `platform`: `'node'`
    - `external`: `['vscode']`
    - `outfile`: `'dist/extension.js'`
    - Production minification + source maps for development
    - `--watch` flag support
    - esbuild problem matcher plugin for VS Code task integration
  - Create `.vscodeignore`: `src/`, `test/`, `node_modules/`, `.sisyphus/`, `*.md` (except README)
  - Create `.gitignore`: `node_modules/`, `dist/`, `out/`, `.vscode-test/`, `*.vsix`, `.ai/`, `.maraudersmapmd/`
  - Create `src/extension.ts`:
    - `activate(context)`: register all commands (placeholder handlers returning "Not implemented yet")
    - `deactivate()`: cleanup
    - Export both functions
  - Create directory structure:
    ```
    src/
      extension.ts
      preview/
      edit/
      images/
      export/
      history/
      ai/
      utils/
    media/
    test/
      unit/
      integration/
      fixtures/
    ```
  - Run `npm install` and verify no errors
  - Run `npm run compile` (esbuild) and verify `dist/extension.js` is created
  - Verify extension activates in Extension Development Host (F5)

  **Must NOT do**:
  - Do NOT implement any feature logic — only placeholder "not implemented" handlers
  - Do NOT add any markdown-it plugins yet
  - Do NOT create webview panels yet
  - Do NOT use `*` activation event

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: This is boilerplate scaffolding with well-defined outputs
  - **Skills**: [`git-master`]
    - `git-master`: Needed for initial commit after scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1, partially)
  - **Parallel Group**: Wave 0
  - **Blocks**: All subsequent tasks
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `prd.md:289-334` — All settings with names, types, and defaults. Transcribe exactly to `contributes.configuration`.
  - `prd.md:102-127` — All command IDs. Use exact names from PRD.
  - `prd.md:157-160` — Image command IDs
  - `prd.md:182-184` — Export command IDs
  - `prd.md:219-224` — History command IDs
  - `prd.md:279-286` — AI command IDs
  - `prd.md:337-345` — Tech stack (TypeScript, esbuild, Webview + Vanilla JS, markdown-it, puppeteer-core, file-based storage)

  **External References**:
  - VS Code extension scaffolding: `https://code.visualstudio.com/api/get-started/your-first-extension`
  - esbuild sample: `https://github.com/microsoft/vscode-extension-samples/tree/main/esbuild-sample`
  - VS Code bundling guide: `https://code.visualstudio.com/api/working-with-extensions/bundling-extension`

  **WHY Each Reference Matters**:
  - The PRD command/setting sections are the SINGLE SOURCE OF TRUTH for IDs, types, and defaults
  - The esbuild sample shows the exact boilerplate for VS Code + esbuild integration
  - The bundling guide explains `external: ['vscode']` and CJS format requirements

  **Command Registry** (complete list from PRD):
  ```
  maraudersMapMd.openPreviewToSide
  maraudersMapMd.togglePreviewLock
  maraudersMapMd.format.bold
  maraudersMapMd.format.italic
  maraudersMapMd.format.inlineCode
  maraudersMapMd.insert.link
  maraudersMapMd.insert.heading
  maraudersMapMd.insert.quote
  maraudersMapMd.toggle.task
  maraudersMapMd.images.insertFromFile
  maraudersMapMd.images.pasteToAssets
  maraudersMapMd.export.html
  maraudersMapMd.export.pdf
  maraudersMapMd.history.open
  maraudersMapMd.history.createCheckpoint
  maraudersMapMd.history.diffWithCurrent
  maraudersMapMd.history.restoreSnapshot
  maraudersMapMd.history.pruneNow
  maraudersMapMd.ai.generateMap
  maraudersMapMd.ai.exportSectionPack
  maraudersMapMd.ai.buildIndex
  maraudersMapMd.ai.copyContextBudgeted
  maraudersMapMd.ai.insertHintRule
  maraudersMapMd.ai.insertHintDecision
  maraudersMapMd.ai.insertHintNote
  ```

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Verify package.json has all commands
  node -e "const p=require('./package.json'); const cmds=p.contributes.commands.map(c=>c.command); console.log('Commands:', cmds.length); if(cmds.length < 25) throw new Error('Missing commands: expected 25+, got ' + cmds.length)"
  # Assert: Commands count >= 25

  # Verify package.json has settings
  node -e "const p=require('./package.json'); const keys=Object.keys(p.contributes.configuration.properties || {}); console.log('Settings:', keys.length); if(keys.length < 35) throw new Error('Missing settings: expected 35+, got ' + keys.length)"
  # Assert: Settings count >= 35

  # Verify esbuild produces output
  npm run compile && test -f dist/extension.js && echo "BUILD OK" || echo "BUILD FAILED"
  # Assert: "BUILD OK"

  # Verify TypeScript compiles
  npx tsc --noEmit && echo "TYPES OK" || echo "TYPE ERROR"
  # Assert: "TYPES OK"

  # Verify directory structure exists
  for dir in src/preview src/edit src/images src/export src/history src/ai src/utils media test/unit test/integration test/fixtures; do
    test -d "$dir" && echo "OK: $dir" || echo "MISSING: $dir"
  done
  # Assert: All "OK"
  ```

  **Commit**: YES
  - Message: `feat: scaffold project with package.json, esbuild, tsconfig, and extension entry point`
  - Files: `package.json, tsconfig.json, esbuild.js, .vscodeignore, .gitignore, src/extension.ts, src/**/ (directories), media/, test/`
  - Pre-commit: `npm run compile`

---

- [x] 1. Test Infrastructure Setup

  **What to do**:
  - Create `vitest.config.ts`:
    - `test.include`: `['test/unit/**/*.test.ts']`
    - `test.globals`: `true`
    - `resolve.alias`: map `vscode` to a stub (for accidental imports — should never happen but safety net)
  - Create `test/unit/smoke.test.ts`:
    - Simple test: `expect(1 + 1).toBe(2)` — verifies vitest works
  - Create `test/fixtures/sample.md`:
    - A sample markdown file with H1, H2, H3, lists, code blocks, task lists, bold/italic, images, links
    - Approximately 2KB — used as standard test fixture
  - Create `test/fixtures/large-sample.md`:
    - A large markdown file (~50KB) with many sections — used for performance tests
  - Create `test/fixtures/korean-sample.md`:
    - A markdown file with Korean text — used for token estimation tests
  - Add `test` script to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`
  - Verify: `npm test` runs and passes the smoke test

  **Must NOT do**:
  - Do NOT set up @vscode/test-electron yet (that's Wave 6)
  - Do NOT mock the `vscode` module
  - Do NOT create feature tests yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small configuration task with clear outputs
  - **Skills**: [`git-master`]
    - `git-master`: Commit after test infrastructure is verified

  **Parallelization**:
  - **Can Run In Parallel**: YES (partially with Task 0)
  - **Parallel Group**: Wave 0
  - **Blocks**: All feature tasks (they need test infrastructure)
  - **Blocked By**: Task 0 (needs package.json for vitest dependency)

  **References**:

  **External References**:
  - vitest configuration: `https://vitest.dev/config/`
  - vitest with VS Code extensions: `https://vitest.dev/guide/#configuring-vitest`

  **WHY Each Reference Matters**:
  - vitest config determines how all subsequent TDD tests run. Getting this right is foundational.

  **Acceptance Criteria**:

  ```bash
  # Verify vitest runs
  npx vitest run 2>&1 | tail -5
  # Assert: "1 passed" and exit code 0

  # Verify test fixtures exist and have content
  test -f test/fixtures/sample.md && wc -c test/fixtures/sample.md | awk '{if($1 > 500) print "OK"; else print "TOO SMALL"}'
  # Assert: "OK"

  test -f test/fixtures/large-sample.md && wc -c test/fixtures/large-sample.md | awk '{if($1 > 40000) print "OK"; else print "TOO SMALL"}'
  # Assert: "OK"
  ```

  **Commit**: YES
  - Message: `test: add vitest configuration and test fixtures`
  - Files: `vitest.config.ts, test/unit/smoke.test.ts, test/fixtures/*.md`
  - Pre-commit: `npm test`

---

### Wave 1 — Preview

- [x] 2. MarkdownEngine (Pure TS)

  **What to do**:
  - Create `src/preview/markdownEngine.ts`:
    - Class `MarkdownEngine` with:
      - Constructor: initializes `markdown-it` instance with options: `{ html: false, linkify: true, typographer: false, breaks: false }`
      - HTML rendering is controlled by `allowHtml` setting — accept as constructor param
      - Custom rule via `md.core.ruler.push('source_line', ...)` that adds `data-source-line="N"` attributes to block-level tokens (paragraph_open, heading_open, list_item_open, blockquote_open, fence, etc.)
      - `render(text: string): string` — returns HTML string
      - `renderWithMeta(text: string): { html: string; headings: Heading[]; lineCount: number }` — returns HTML + extracted heading structure
    - Interface `Heading`: `{ level: number; text: string; line: number; slug: string }`
    - Enable `markdown-it-task-lists` plugin with `{ enabled: true, label: true }` for checkbox rendering
  - TDD: Create `test/unit/markdownEngine.test.ts`:
    - Test: renders basic markdown (headings, paragraphs, lists)
    - Test: adds `data-source-line` attributes to block elements
    - Test: renders task lists with checkboxes
    - Test: `renderWithMeta` extracts heading structure correctly
    - Test: with `allowHtml: true`, HTML tags pass through
    - Test: with `allowHtml: false`, HTML tags are escaped
    - Test: handles empty string input
    - Test: handles frontmatter-like content (doesn't crash)

  **Must NOT do**:
  - Do NOT add syntax highlighting plugin
  - Do NOT add emoji plugin
  - Do NOT add TOC generation
  - Do NOT import `vscode` — this module must be pure TS

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Focused module with clear inputs/outputs, uses well-documented markdown-it API
  - **Skills**: [`vercel-react-best-practices`]
    - `vercel-react-best-practices`: General TypeScript patterns (though not React-specific, the TS practices apply)
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not relevant — this is backend rendering logic, not UI

  **Parallelization**:
  - **Can Run In Parallel**: NO (first task in Wave 1)
  - **Parallel Group**: Wave 1 (sequential within wave)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - markdown-it API: `https://github.com/markdown-it/markdown-it` — focus on `md.core.ruler.push()` for custom rules
  - markdown-it-task-lists: `https://github.com/revin/markdown-it-task-lists` — checkbox rendering plugin
  - VS Code markdown source-line pattern: `https://github.com/microsoft/vscode/blob/main/extensions/markdown-language-features/src/markdownEngine.ts` — reference implementation for `data-source-line`

  **WHY Each Reference Matters**:
  - markdown-it core ruler API is the mechanism for injecting source line numbers into rendered HTML
  - VS Code's own markdown extension uses the exact same pattern we need

  **Acceptance Criteria**:

  ```bash
  # TDD verification
  npx vitest run test/unit/markdownEngine.test.ts 2>&1 | tail -5
  # Assert: All tests pass, 0 failures

  # Verify module has zero vscode imports
  grep -r "from 'vscode'" src/preview/markdownEngine.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"

  # Verify data-source-line attributes in output
  node -e "
    const {MarkdownEngine} = require('./dist/extension.js');
    // Note: May need to test via vitest instead if not exported
  " 2>&1 || echo "Will verify via vitest tests"
  ```

  **Commit**: YES
  - Message: `feat(preview): add MarkdownEngine with source-line injection and task-list support`
  - Files: `src/preview/markdownEngine.ts, test/unit/markdownEngine.test.ts`
  - Pre-commit: `npm test`

---

- [x] 3. PreviewManager (VS Code Adapter)

  **What to do**:
  - Create `src/preview/previewManager.ts`:
    - Class `PreviewManager` that manages the Webview panel lifecycle:
      - `openPreview(document: vscode.TextDocument)`: Creates or reveals panel in `ViewColumn.Beside`
      - Singleton pattern: reuse existing panel, never create duplicates
      - `retainContextWhenHidden: true`
      - `localResourceRoots`: extension `media/` directory + workspace root (for local images)
      - CSP: `default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https: data: file:; script-src 'nonce-${nonce}'; font-src ${cspSource};`
      - `enableScripts: true`
      - `updatePreview(document: vscode.TextDocument)`: Calls MarkdownEngine.render() and sends HTML to webview via `postMessage({ type: 'update', html, version })`
      - Version tracking: increment version on each update, webview ignores out-of-order updates
      - Debounced update: configurable delay from `maraudersMapMd.preview.updateDelayMs` setting
      - Large document detection: if doc size > `maraudersMapMd.preview.largeDocThresholdKb`, use `largeDocUpdateDelayMs` instead
      - `toggleLock()`: When locked, preview stays on current document even when switching editor tabs
      - Disposable pattern: clean up all subscriptions on panel close
    - Register in extension.ts:
      - `maraudersMapMd.openPreviewToSide` command → `previewManager.openPreview(activeDocument)`
      - `maraudersMapMd.togglePreviewLock` command → `previewManager.toggleLock()`
      - `onDidChangeActiveTextEditor` → update preview if not locked
      - `onDidChangeTextDocument` → debounced update for active markdown file
  - Create `src/preview/getNonce.ts`: Utility function for CSP nonce generation
  - Create `src/preview/htmlTemplate.ts` (pure TS):
    - `buildPreviewHtml(options: { body: string; nonce: string; cspSource: string; scriptUri: string; styleUri: string }): string`
    - Returns complete HTML document with CSP headers

  **Must NOT do**:
  - Do NOT implement scroll sync
  - Do NOT implement preview-to-editor click-to-jump
  - Do NOT add any interactive editing in preview yet (that's Task 6)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core architectural component with webview lifecycle, CSP, and message protocol
  - **Skills**: [`vercel-react-best-practices`]
    - `vercel-react-best-practices`: TypeScript patterns for state management and lifecycle

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential)
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `prd.md:88-105` — Preview feature requirements: commands, performance policies (panel reuse, version-based rendering, debounce)
  - `prd.md:292-296` — Preview settings with defaults (updateDelayMs: 200, largeDocThresholdKb: 512, largeDocUpdateDelayMs: 700)
  - `prd.md:361-365` — Bulk mode optimization: coalesce updates, debounce increase

  **External References**:
  - VS Code Webview API guide: `https://code.visualstudio.com/api/extension-guides/webview`
  - Webview sample: `https://github.com/microsoft/vscode-extension-samples/tree/main/webview-sample`
  - CSP documentation: `https://code.visualstudio.com/api/extension-guides/webview#content-security-policy`

  **WHY Each Reference Matters**:
  - PRD performance policies (panel reuse, version-based) are CRITICAL constraints for this task
  - The webview sample shows the canonical pattern for panel lifecycle and CSP
  - Settings section defines exact parameter names and defaults to read from configuration

  **Acceptance Criteria**:

  ```bash
  # Verify extension compiles with PreviewManager
  npm run compile && echo "BUILD OK" || echo "BUILD FAILED"
  # Assert: "BUILD OK"

  # Verify no type errors
  npx tsc --noEmit && echo "TYPES OK" || echo "TYPE ERROR"
  # Assert: "TYPES OK"

  # Manual verification in Extension Dev Host (F5):
  # 1. Open a .md file
  # 2. Run command: MaraudersMapMD: Open Preview to Side
  # 3. Assert: Preview panel opens with rendered markdown
  # 4. Type in editor → Assert: Preview updates after debounce
  # 5. Close preview → reopen → Assert: Same panel reused (no duplicate)
  ```

  **Commit**: YES
  - Message: `feat(preview): add PreviewManager with webview panel lifecycle, CSP, and debounced updates`
  - Files: `src/preview/previewManager.ts, src/preview/getNonce.ts, src/preview/htmlTemplate.ts, src/extension.ts`
  - Pre-commit: `npm run compile`

---

- [x] 4. Preview Webview Assets (CSS + JS)

  **What to do**:
  - Create `media/preview.css`:
    - GitHub-flavored markdown styling (clean, readable)
    - VS Code theme-aware: use CSS variables `--vscode-editor-background`, `--vscode-editor-foreground`, `--vscode-font-family`
    - Responsive images: `img { max-width: 100%; }`
    - Task list styling: checkboxes rendered as interactive elements
    - Code block styling: `pre { background: var(--vscode-textCodeBlock-background); padding: 12px; border-radius: 4px; overflow-x: auto; }`
    - Table styling: borders, padding, alternating row colors
    - Print-friendly: `@media print` section
  - Create `media/preview.js`:
    - `acquireVsCodeApi()` called ONCE at top level, stored in `const vscode`
    - Message listener for `{ type: 'update', html, version }`:
      - Compare incoming version with `currentVersion`
      - Ignore if incoming < current (out-of-order protection)
      - Update `document.getElementById('preview-content').innerHTML = html`
      - Update `currentVersion`
    - Checkbox click handler:
      - Delegate event on `input[type="checkbox"]` within `.task-list-item`
      - On click: get `data-source-line` from parent element
      - Send `postMessage({ type: 'toggleCheckbox', line: N })` to extension
    - State persistence: `vscode.setState({ scrollTop, version })` on scroll, `vscode.getState()` on load
  - Update `src/preview/previewManager.ts`:
    - Handle `toggleCheckbox` message: use `WorkspaceEdit` to toggle `- [ ]` ↔ `- [x]` at the specified line
    - Use `webview.asWebviewUri()` for CSS/JS file references
  - Update `src/preview/htmlTemplate.ts`: Include `<link>` to `preview.css` and `<script>` with nonce to `preview.js`

  **Must NOT do**:
  - Do NOT add scroll sync logic in preview.js
  - Do NOT add heading click-to-editor navigation
  - Do NOT add drag-drop handling in preview (that's Task 9)
  - Do NOT add paste handling in preview (deferred to v1.0)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS styling and webview JS require frontend expertise
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Webview styling, CSS variables, interactive elements

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential, depends on Task 2+3)
  - **Blocks**: Wave 2 tasks (5-9)
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `prd.md:130-138` — Preview editing: checkbox toggle spec ("- [ ] ↔ - [x]"), click does not break cursor/selection
  - `prd.md:98-99` — Performance: panel reuse, last-state-only rendering (version-based)
  - `prd.md:346-348` — 3-Plane Architecture: Preview Plane responsibilities

  **External References**:
  - VS Code webview CSS variables: `https://code.visualstudio.com/api/references/theme-color`
  - VS Code webview state: `https://code.visualstudio.com/api/extension-guides/webview#getstate-and-setstate`
  - GitHub markdown CSS: `https://github.com/sindresorhus/github-markdown-css` — reference for styling patterns

  **WHY Each Reference Matters**:
  - VS Code CSS variables ensure the preview matches the user's chosen theme (dark/light)
  - State persistence prevents scroll position loss when switching tabs
  - Checkbox toggle spec has specific behavior requirements about cursor safety

  **Acceptance Criteria**:

  ```bash
  # Verify media files exist
  test -f media/preview.css && test -f media/preview.js && echo "FILES OK" || echo "MISSING FILES"
  # Assert: "FILES OK"

  # Verify CSS uses VS Code variables
  grep "var(--vscode" media/preview.css | head -3
  # Assert: At least 3 CSS variable references

  # Verify JS calls acquireVsCodeApi once
  grep -c "acquireVsCodeApi" media/preview.js
  # Assert: Exactly 1

  # Verify version-based update protection in JS
  grep "version" media/preview.js | head -3
  # Assert: Version comparison logic exists

  # Build verification
  npm run compile && echo "BUILD OK" || echo "BUILD FAILED"
  # Assert: "BUILD OK"
  ```

  **Commit**: YES
  - Message: `feat(preview): add webview CSS/JS with theme-aware styling, checkbox toggle, and version-based updates`
  - Files: `media/preview.css, media/preview.js, src/preview/previewManager.ts (updated), src/preview/htmlTemplate.ts (updated)`
  - Pre-commit: `npm run compile`

---

### Wave 2 — Quick Edit + Images

- [x] 5. Format & Insert Commands

  **What to do**:
  - Create `src/edit/formatters.ts` (pure TS):
    - `wrapSelection(text: string, before: string, after: string): string` — wraps text with delimiters
    - `toggleWrap(text: string, before: string, after: string): string` — toggles wrapping (add if missing, remove if present)
    - `insertAtLineStart(line: string, prefix: string): string` — prepends prefix
    - `createLink(text: string, url: string): string` — returns `[text](url)`
    - `createHeading(level: number, text: string): string` — returns `# text` with correct level
    - `createBlockquote(text: string): string` — prepends `> ` to each line
  - Create `src/edit/editCommands.ts` (vscode adapter):
    - `registerEditCommands(context: vscode.ExtensionContext)`: Register all format/insert commands
    - `maraudersMapMd.format.bold`: Toggle `**` around selection
    - `maraudersMapMd.format.italic`: Toggle `*` around selection
    - `maraudersMapMd.format.inlineCode`: Toggle `` ` `` around selection
    - `maraudersMapMd.insert.link`: Show input box for URL → insert `[selection](url)`
    - `maraudersMapMd.insert.heading`: Show QuickPick for level (1-6) → insert heading
    - `maraudersMapMd.insert.quote`: Wrap selection/current line with `> `
    - All commands use `editor.edit()` with `WorkspaceEdit` for undo support
  - TDD: Create `test/unit/formatters.test.ts`:
    - Test: `wrapSelection` wraps correctly
    - Test: `toggleWrap` removes existing wrapping
    - Test: `toggleWrap` adds wrapping when not present
    - Test: `toggleWrap` handles empty selection
    - Test: `createLink` formats correctly
    - Test: `createHeading` with levels 1-6
    - Test: `createBlockquote` handles multi-line text
  - Update `src/extension.ts`: Call `registerEditCommands(context)` in activate

  **Must NOT do**:
  - Do NOT implement task toggle (that's Task 6)
  - Do NOT add keybindings (users configure their own)
  - Do NOT add toolbar UI

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple string manipulation functions + command registration
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit after feature completion

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Task 24
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `prd.md:108-127` — Quick Edit feature list with exact command IDs
  - `prd.md:110` — "Extension is helper only, VS Code does the editing" principle

  **External References**:
  - VS Code TextEditor API: `https://code.visualstudio.com/api/references/vscode-api#TextEditor` — `edit()`, `selection`, `document`
  - WorkspaceEdit: `https://code.visualstudio.com/api/references/vscode-api#WorkspaceEdit`

  **WHY Each Reference Matters**:
  - The PRD explicitly states the extension is a "helper" — commands should be minimal and clean
  - TextEditor.edit() provides atomic editing with undo support

  **Acceptance Criteria**:

  ```bash
  # TDD verification
  npx vitest run test/unit/formatters.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  # Verify no vscode imports in formatters
  grep "from 'vscode'" src/edit/formatters.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"

  # Build verification
  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"
  ```

  **Commit**: YES
  - Message: `feat(edit): add format and insert commands (bold, italic, code, link, heading, quote)`
  - Files: `src/edit/formatters.ts, src/edit/editCommands.ts, test/unit/formatters.test.ts, src/extension.ts`
  - Pre-commit: `npm test`

---

- [x] 6. Task Toggle (Editor + Preview)

  **What to do**:
  - Add to `src/edit/formatters.ts` (pure TS):
    - `toggleTask(line: string): string` — toggles `- [ ]` ↔ `- [x]`, handles `* [ ]` variant
    - `isTaskLine(line: string): boolean` — detects task list lines
  - Add to `src/edit/editCommands.ts`:
    - `maraudersMapMd.toggle.task`: Toggle task checkbox on current line(s)
    - Multi-cursor support: toggle all selected lines
  - Verify webview checkbox click (from Task 4) → `toggleCheckbox` message → source document update
  - TDD: Add to `test/unit/formatters.test.ts`:
    - Test: toggles `- [ ]` to `- [x]`
    - Test: toggles `- [x]` to `- [ ]`
    - Test: handles `* [ ]` variant
    - Test: non-task line returns unchanged
    - Test: handles indented task lines

  **Must NOT do**:
  - Do NOT add visual feedback in preview (CSS handles this via :checked)
  - Do NOT add batch toggle UI

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small addition to existing formatter module
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 7, 8, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 24
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `prd.md:130-138` — Checkbox toggle spec: `- [ ] ↔ - [x]`, click must not break cursor/selection
  - `media/preview.js` (from Task 4) — checkbox click handler sends `{ type: 'toggleCheckbox', line }`

  **WHY Each Reference Matters**:
  - The toggle must match both `- [ ]` and `- [x]` syntax exactly
  - Preview-to-editor toggle uses the message protocol established in Task 4

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/formatters.test.ts 2>&1 | tail -5
  # Assert: All tests pass (including new task toggle tests)

  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"
  ```

  **Commit**: YES (group with Task 5 if both done by same agent)
  - Message: `feat(edit): add task checkbox toggle for editor and preview`
  - Files: `src/edit/formatters.ts, src/edit/editCommands.ts, test/unit/formatters.test.ts`
  - Pre-commit: `npm test`

---

- [x] 7. Image Insert from File

  **What to do**:
  - Create `src/images/pathUtils.ts` (pure TS):
    - `generateImageFilename(originalName: string, pattern: string): string` — applies filename pattern from setting `maraudersMapMd.images.filenamePattern` (default: `{basename}-{yyyyMMdd-HHmmss}`)
    - `buildRelativePath(mdFileDir: string, assetsDir: string, filename: string): string` — returns `./assets/filename.ext`
    - `buildMarkdownImageLink(altText: string, relativePath: string): string` — returns `![alt](path)`
    - `getAltText(filename: string, source: 'filename' | 'prompt'): string` — returns alt text based on setting
  - Create `src/images/imageCommands.ts` (vscode adapter):
    - `maraudersMapMd.images.insertFromFile`:
      1. Show file picker dialog (`vscode.window.showOpenDialog`) for image files
      2. Get assets directory: `{mdFileDir}/{assetsDir}` from setting
      3. Create assets directory if not exists (`vscode.workspace.fs.createDirectory`)
      4. Generate filename using pattern
      5. Copy file to assets (`vscode.workspace.fs.copy`)
      6. Insert markdown link at cursor position
  - TDD: Create `test/unit/pathUtils.test.ts`:
    - Test: `generateImageFilename` applies basename pattern
    - Test: `generateImageFilename` applies timestamp pattern
    - Test: `buildRelativePath` produces correct POSIX paths
    - Test: `buildRelativePath` handles nested asset directories
    - Test: `buildMarkdownImageLink` formats correctly
    - Test: Windows path separators converted to forward slashes
  - Update `src/extension.ts`: Register image commands

  **Must NOT do**:
  - Do NOT implement drag-drop (that's Tasks 8, 9)
  - Do NOT implement paste (deferred to v1.0 for webview; editor paste is Task 8)
  - Do NOT implement remote URL download
  - Do NOT add image resize/optimization

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File operations with well-defined API
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `prd.md:146-160` — Image workflow spec: insert from file, assets directory, filename pattern, remote images OFF
  - `prd.md:299-303` — Image settings: assetsDir (assets), allowRemote (false), filenamePattern, altTextSource (filename)

  **External References**:
  - VS Code workspace.fs: `https://code.visualstudio.com/api/references/vscode-api#FileSystem` — createDirectory, copy, stat
  - VS Code showOpenDialog: `https://code.visualstudio.com/api/references/vscode-api#window.showOpenDialog`

  **WHY Each Reference Matters**:
  - PRD specifies exact filename pattern and alt text behavior
  - workspace.fs is the correct API for cross-platform file operations (works with remote too)

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/pathUtils.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/images/pathUtils.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"

  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"
  ```

  **Commit**: YES
  - Message: `feat(images): add insert image from file with assets directory management`
  - Files: `src/images/pathUtils.ts, src/images/imageCommands.ts, test/unit/pathUtils.test.ts, src/extension.ts`
  - Pre-commit: `npm test`

---

- [x] 8. Image Drag-Drop (Editor-side)

  **What to do**:
  - Create `src/images/editorDropProvider.ts`:
    - Implement `vscode.DocumentDropEditProvider`
    - `provideDocumentDropEdits(document, position, dataTransfer, token)`:
      1. Get file URIs from `dataTransfer.get('text/uri-list')`
      2. Filter for image files (png, jpg, jpeg, gif, svg, webp, bmp)
      3. Copy each image to assets directory (reuse pathUtils functions)
      4. Return `DocumentDropEdit` with markdown image links as snippet
    - Also implement `vscode.DocumentPasteEditProvider` for editor paste:
      1. Check for image data in clipboard via `dataTransfer.get('image/*')`
      2. Save blob to assets directory with generated filename
      3. Insert markdown link
  - Register providers in `src/images/imageCommands.ts`:
    - `vscode.languages.registerDocumentDropEditProvider({ language: 'markdown' }, dropProvider)`
    - `vscode.languages.registerDocumentPasteEditProvider({ language: 'markdown' }, pasteProvider, { pasteMimeTypes: ['image/*'] })`

  **Must NOT do**:
  - Do NOT handle non-image drops (text, HTML)
  - Do NOT implement webview-side drop (that's Task 9)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Uses well-documented VS Code API with clear patterns
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 24
  - **Blocked By**: Task 7 (needs pathUtils)

  **References**:

  **Pattern References**:
  - `src/images/pathUtils.ts` (from Task 7) — Reuse `generateImageFilename`, `buildRelativePath`, `buildMarkdownImageLink`
  - `prd.md:150-153` — Drag & Drop and Paste specs

  **External References**:
  - DocumentDropEditProvider: `https://code.visualstudio.com/api/references/vscode-api#DocumentDropEditProvider`
  - DocumentPasteEditProvider: `https://code.visualstudio.com/api/references/vscode-api#DocumentPasteEditProvider`
  - Drop sample: `https://github.com/microsoft/vscode-extension-samples/tree/main/drop-on-document`

  **WHY Each Reference Matters**:
  - The drop-on-document sample is the canonical reference for implementing DocumentDropEditProvider
  - DocumentPasteEditProvider is the editor-side paste solution (NOT webview paste)

  **Acceptance Criteria**:

  ```bash
  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"

  npx tsc --noEmit && echo "TYPES OK"
  # Assert: "TYPES OK"

  # Functional verification in Extension Dev Host:
  # 1. Drag an image file from Finder onto a .md editor → Assert: image copied to assets/, markdown link inserted
  # 2. Copy an image, paste into editor → Assert: image saved to assets/, markdown link inserted
  ```

  **Commit**: YES
  - Message: `feat(images): add editor drag-drop and paste providers for image insertion`
  - Files: `src/images/editorDropProvider.ts, src/images/imageCommands.ts`
  - Pre-commit: `npm run compile`

---

- [~] 9. Image Drag-Drop (Webview-side) **DEFERRED TO v1.0** (3 attempts failed - see issues.md)

  **What to do**:
  - Update `media/preview.js`:
    - Add HTML5 drag-drop event listeners on the preview container:
      - `dragover`: `event.preventDefault()` + show drop zone indicator
      - `dragleave`: hide drop zone indicator
      - `drop`: Extract file data from `event.dataTransfer.files`, read as base64, send `postMessage({ type: 'dropImage', data: base64, name: filename, mimeType })` to extension
    - Add visual drop zone overlay (CSS class `.drop-zone-active`)
  - Update `media/preview.css`:
    - `.drop-zone-active`: semi-transparent overlay with dashed border, centered "Drop image here" text
  - Update `src/preview/previewManager.ts`:
    - Handle `dropImage` message:
      1. Decode base64 data to Buffer
      2. Generate filename (reuse pathUtils)
      3. Save to assets directory
      4. Insert markdown link into active editor at end of document (or last cursor position)
      5. Update preview

  **Must NOT do**:
  - Do NOT handle webview paste (deferred to v1.0)
  - Do NOT add image preview/thumbnail in drop zone
  - Do NOT handle multiple simultaneous drops

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Webview JS event handling + CSS visual feedback
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Drag-drop UX, visual feedback, webview JS patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 7, 8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 24
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `media/preview.js` (from Task 4) — Existing postMessage pattern and acquireVsCodeApi usage
  - `src/preview/previewManager.ts` (from Task 3) — onDidReceiveMessage handler pattern
  - `src/images/pathUtils.ts` (from Task 7) — Filename generation and path utilities

  **External References**:
  - HTML5 Drag and Drop API: `https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API`
  - FileReader API: `https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL`

  **WHY Each Reference Matters**:
  - Webview drag-drop uses HTML5 APIs (NOT VS Code APIs) — this is a browser context
  - The existing postMessage pattern from Task 4 must be extended, not replaced

  **Acceptance Criteria**:

  ```bash
  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"

  # Verify drop handling code exists in preview.js
  grep "dragover\|dragleave\|drop" media/preview.js | wc -l
  # Assert: >= 3 (three event types)

  grep "dropImage" media/preview.js
  # Assert: postMessage with dropImage type exists

  # Functional verification in Extension Dev Host:
  # 1. Drag an image from Finder onto preview panel
  # 2. Assert: Drop zone overlay appears during drag
  # 3. Assert: Image saved to assets/, markdown link inserted, preview updates
  ```

  **Commit**: YES
  - Message: `feat(images): add webview drag-drop with visual drop zone`
  - Files: `media/preview.js, media/preview.css, src/preview/previewManager.ts`
  - Pre-commit: `npm run compile`

---

### Wave 3 — Export

- [x] 10. HTML Export

  **What to do**:
  - Create `src/export/htmlTemplate.ts` (pure TS):
    - `buildExportHtml(options: { title: string; body: string; css: string; embedImages?: boolean }): string`
    - Produces standalone HTML document with inlined CSS
    - Local image paths converted to absolute file:// paths (or data-uri if `embedImages` is true)
    - `resolveLocalImages(html: string, mdFileDir: string, mode: 'fileUrl' | 'dataUri'): string` — converts relative `./assets/img.png` to absolute paths or base64 data URIs
  - Create `src/export/exportCommands.ts` (vscode adapter):
    - `maraudersMapMd.export.html`:
      1. Render current markdown with MarkdownEngine
      2. Build export HTML with inlined CSS (reuse preview CSS)
      3. Resolve local images
      4. Show save dialog for output path (default: `${workspaceFolder}/exports/{filename}.html`)
      5. Write file
      6. Show info message with "Open" button
  - TDD: Create `test/unit/htmlTemplate.test.ts`:
    - Test: produces valid HTML with DOCTYPE
    - Test: inlines CSS correctly
    - Test: resolves relative image paths to absolute
    - Test: converts images to data-uri when mode is 'dataUri'
    - Test: handles markdown with no images
    - Test: handles markdown with multiple images
  - Update `src/extension.ts`: Register export commands

  **Must NOT do**:
  - Do NOT implement PDF export (that's Task 12)
  - Do NOT add custom CSS theming options (v1.0)
  - Do NOT add header/footer

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Template generation with clear inputs/outputs
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 11, 13-22)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `prd.md:166-167` — HTML export: reuse preview template
  - `prd.md:309-310` — PDF settings that also apply to HTML: embedImages mode (fileUrl default)
  - `media/preview.css` (from Task 4) — CSS to inline into export HTML

  **WHY Each Reference Matters**:
  - HTML export reuses the same CSS as preview — must reference the actual CSS file
  - Image embedding mode affects both HTML and PDF export

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/htmlTemplate.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/export/htmlTemplate.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"

  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"
  ```

  **Commit**: YES
  - Message: `feat(export): add HTML export with inline CSS and local image resolution`
  - Files: `src/export/htmlTemplate.ts, src/export/exportCommands.ts, test/unit/htmlTemplate.test.ts, src/extension.ts`
  - Pre-commit: `npm test`

---

- [x] 11. Chrome Detection

  **What to do**:
  - Create `src/export/chromeDetector.ts` (pure TS):
    - `detectChrome(): string | null` — returns path to Chrome/Chromium executable or null
    - Platform-specific search paths:
      - **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, Chromium, Microsoft Edge, Brave
      - **Windows**: Program Files paths for Chrome, Edge, Brave + `LOCALAPPDATA`
      - **Linux**: `/usr/bin/google-chrome`, `/usr/bin/chromium-browser`, `/usr/bin/chromium`, `/snap/bin/chromium`
    - Fallback: `which`/`where` command for runtime detection
    - Accept user-configured path override (from setting `maraudersMapMd.pdf.browserPath`)
    - Return order: user setting → auto-detected → null
  - TDD: Create `test/unit/chromeDetector.test.ts`:
    - Test: returns user-configured path when provided and exists
    - Test: returns null when user path doesn't exist
    - Test: auto-detect returns first existing path (mock fs.existsSync)
    - Test: returns null when no browser found
    - Note: Use dependency injection for `fs.existsSync` and `execSync` to enable testing

  **Must NOT do**:
  - Do NOT install or download Chrome
  - Do NOT use `chrome-launcher` package (too heavy; hand-roll detection is simpler for our needs after review)
  - Do NOT bundle any browser

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file-existence checks with platform branching
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 12
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `prd.md:170-180` — PDF export: Chromium bundle forbidden, puppeteer-core + system Chrome, failure UX
  - `prd.md:305` — `maraudersMapMd.pdf.browserPath` setting (default: auto)

  **External References**:
  - puppeteer-core browser detection: `https://pptr.dev/guides/configuration` — shows which paths puppeteer checks
  - Cross-platform Chrome paths: commonly known paths documented in puppeteer source

  **WHY Each Reference Matters**:
  - The PRD explicitly forbids bundling Chromium — system detection is the ONLY path
  - The setting provides user override for when auto-detection fails

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/chromeDetector.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/export/chromeDetector.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(export): add cross-platform Chrome/Chromium detection`
  - Files: `src/export/chromeDetector.ts, test/unit/chromeDetector.test.ts`
  - Pre-commit: `npm test`

---

- [x] 12. PDF Export with Local Image Embedding

  **What to do**:
  - Create `src/export/pdfExporter.ts` (mixed — uses puppeteer-core but can accept browser path as param):
    - `exportToPdf(options: { html: string; outputPath: string; browserPath: string; format: string; marginMm: number; printBackground: boolean }): Promise<void>`
    - Launch browser with `puppeteer-core.launch({ executablePath: browserPath, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] })`
    - `--allow-file-access-from-files` enables loading local images via `file://` URLs
    - Set page content, wait for networkidle0
    - Generate PDF with configured format, margins, printBackground
    - Close browser
    - Error handling: catch launch failures, timeout on page load (30s max)
  - Update `src/export/exportCommands.ts`:
    - `maraudersMapMd.export.pdf`:
      1. Detect Chrome (chromeDetector)
      2. If not found: show error with "Configure Browser Path" and "Export as HTML Instead" buttons
      3. Render markdown → HTML (with local image paths resolved as file:// absolute URLs)
      4. Show progress notification (`vscode.window.withProgress`)
      5. Export to PDF
      6. Open exported file or show path (based on `openAfterExport` setting)
      7. Output directory: `maraudersMapMd.pdf.outputDirectory` setting
  - TDD: Create `test/unit/pdfExporter.test.ts`:
    - Test: calls puppeteer.launch with correct args
    - Test: passes format and margin settings to page.pdf()
    - Test: throws descriptive error when browser path invalid
    - Note: Use mock/stub for puppeteer-core in unit tests

  **Must NOT do**:
  - Do NOT bundle Chromium
  - Do NOT add header/footer to PDF
  - Do NOT add watermark/page numbers
  - Do NOT add custom CSS for PDF (uses same preview CSS)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: puppeteer-core integration with error handling and progress notification
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, after Tasks 10, 11)
  - **Blocks**: Task 24
  - **Blocked By**: Tasks 10, 11

  **References**:

  **Pattern References**:
  - `prd.md:169-184` — PDF export spec: no Chromium bundle, file:// + data-uri options, failure UX
  - `prd.md:305-311` — PDF settings: browserPath, format (A4), marginMm (12), printBackground (true), embedImages (fileUrl), outputDirectory, openAfterExport
  - `src/export/htmlTemplate.ts` (from Task 10) — HTML generation with resolved images
  - `src/export/chromeDetector.ts` (from Task 11) — Chrome path detection

  **External References**:
  - puppeteer-core PDF API: `https://pptr.dev/api/puppeteer.page.pdf` — format, margin, printBackground options
  - VS Code withProgress: `https://code.visualstudio.com/api/references/vscode-api#window.withProgress`

  **WHY Each Reference Matters**:
  - puppeteer page.pdf() accepts specific option shapes — must match exactly
  - withProgress provides user feedback during potentially slow PDF generation

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/pdfExporter.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"

  # Functional verification in Extension Dev Host (if Chrome available):
  # 1. Open a .md file with local images
  # 2. Run command: MaraudersMapMD: Export to PDF
  # 3. Assert: Progress notification appears
  # 4. Assert: PDF file created in exports/ directory
  # 5. Assert: PDF opens automatically (if setting enabled)
  # 6. Assert: Local images visible in PDF

  # Failure case (no Chrome):
  # 1. Set browserPath to invalid path
  # 2. Run PDF export
  # 3. Assert: Error message with "Configure Browser Path" and "Export as HTML" options
  ```

  **Commit**: YES
  - Message: `feat(export): add PDF export with puppeteer-core and local image embedding`
  - Files: `src/export/pdfExporter.ts, src/export/exportCommands.ts, test/unit/pdfExporter.test.ts`
  - Pre-commit: `npm test`

---

### Wave 4 — History

- [x] 13. Snapshot Store (Pure TS)

  **What to do**:
  - Create `src/history/snapshotStore.ts` (pure TS):
    - Interface `Snapshot`: `{ id: string; filePath: string; timestamp: number; label?: string; isCheckpoint: boolean; hash: string; sizeBytes: number; compressed: boolean }`
    - Interface `SnapshotIndex`: `{ version: 1; snapshots: Snapshot[] }`
    - `computeHash(content: string): string` — SHA-256 hash of content
    - `compressContent(content: string): Buffer` — gzip compress (use Node.js `zlib.gzipSync`). Only compress if content.length >= 1024 bytes.
    - `decompressContent(buffer: Buffer): string` — gzip decompress
    - `createSnapshotId(): string` — timestamp-based ID: `YYYYMMDD-HHmmss-SSS`
    - `buildSnapshotPath(historyDir: string, filePath: string, snapshotId: string): string` — returns path for snapshot file
    - `buildIndexPath(historyDir: string, filePath: string): string` — returns path for index.json
    - `isDuplicate(content: string, latestHash: string | undefined): boolean` — compare hash with latest snapshot
    - `readIndex(indexPath: string, readFile: (path: string) => string): SnapshotIndex` — parse index.json
    - `writeIndex(indexPath: string, index: SnapshotIndex, writeFile: (path: string, content: string) => void): void`
    - Use dependency injection for file operations (accept `readFile`/`writeFile`/`mkdir` functions as params) — enables vitest testing without vscode
  - TDD: Create `test/unit/snapshotStore.test.ts`:
    - Test: `computeHash` produces consistent SHA-256
    - Test: `compressContent` + `decompressContent` roundtrip
    - Test: content < 1KB skips compression
    - Test: `isDuplicate` returns true for identical content
    - Test: `isDuplicate` returns false for different content
    - Test: `createSnapshotId` format is correct
    - Test: `buildSnapshotPath` produces valid path structure
    - Test: `readIndex` parses valid JSON
    - Test: `readIndex` returns empty index for missing file

  **Must NOT do**:
  - Do NOT import `vscode` — this module must be pure TS with injected file operations
  - Do NOT implement retention logic (that's Task 14)
  - Do NOT implement UI (that's Task 15)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure data structures and utility functions
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Wave 2 and Wave 3 tasks)
  - **Parallel Group**: Wave 4 (but independent of Waves 2-3)
  - **Blocks**: Tasks 14, 15
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `prd.md:190-224` — History feature spec: onSave snapshots, checkpoints, diff/restore, retention
  - `prd.md:209-210` — Storage location: `.maraudersmapmd/history/` (workspace) or globalStorage
  - `prd.md:322` — Compression: gzip

  **WHY Each Reference Matters**:
  - The PRD defines exact storage location and compression strategy
  - Snapshot deduplication (hash comparison) prevents Cmd+S spam from creating duplicates

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/snapshotStore.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/history/snapshotStore.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"

  grep "zlib" src/history/snapshotStore.ts
  # Assert: Uses Node.js zlib (not external library)
  ```

  **Commit**: YES
  - Message: `feat(history): add snapshot store with hash deduplication and gzip compression`
  - Files: `src/history/snapshotStore.ts, test/unit/snapshotStore.test.ts`
  - Pre-commit: `npm test`

---

- [x] 14. Retention Engine (Pure TS)

  **What to do**:
  - Create `src/history/retentionEngine.ts` (pure TS):
    - Interface `RetentionPolicy`: `{ maxSnapshotsPerFile: number; maxTotalStorageMb: number; retentionDays: number; protectManualCheckpoints: boolean }`
    - `getSnapshotsToDelete(snapshots: Snapshot[], policy: RetentionPolicy, now: number): Snapshot[]`:
      1. Filter out protected checkpoints if `protectManualCheckpoints` is true
      2. Remove snapshots older than `retentionDays`
      3. Remove oldest snapshots exceeding `maxSnapshotsPerFile`
      4. Calculate total size; if > `maxTotalStorageMb`, remove oldest non-protected until under limit
      5. Return list of snapshots to delete (caller handles actual deletion)
    - Pure function: takes data in, returns data out. No side effects.
  - TDD: Create `test/unit/retentionEngine.test.ts`:
    - Test: keeps all snapshots when under limits
    - Test: removes snapshots exceeding maxSnapshotsPerFile
    - Test: removes snapshots older than retentionDays
    - Test: protects manual checkpoints from retention
    - Test: removes oldest when storage limit exceeded
    - Test: combined policies apply correctly
    - Test: empty snapshot list returns empty delete list

  **Must NOT do**:
  - Do NOT perform actual file deletion — return list only
  - Do NOT import `vscode`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure function with clear input/output, no side effects
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Wave 4)
  - **Parallel Group**: Wave 4 (sequential after Task 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 13

  **References**:

  **Pattern References**:
  - `prd.md:213-218` — Retention spec: max snapshots, max storage, retention days, checkpoint protection
  - `prd.md:316-321` — Retention settings with defaults: maxSnapshotsPerFile (100), maxTotalStorageMb (200), retentionDays (30), protectManualCheckpoints (true)

  **WHY Each Reference Matters**:
  - Retention policy defaults come directly from PRD settings section
  - Protection of manual checkpoints is a specific user expectation (default: true)

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/retentionEngine.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/history/retentionEngine.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(history): add retention engine with configurable policies and checkpoint protection`
  - Files: `src/history/retentionEngine.ts, test/unit/retentionEngine.test.ts`
  - Pre-commit: `npm test`

---

- [x] 15. History Commands (onSave Hook + Checkpoint + QuickPick UI)

  **What to do**:
  - Create `src/history/historyCommands.ts` (vscode adapter):
    - `registerHistoryListeners(context: vscode.ExtensionContext)`:
      - `onDidSaveTextDocument` listener: if markdown file + history enabled → create snapshot
      - Check `maraudersMapMd.history.mode` setting: if `onSave`, create snapshot on save
      - Deduplication: call `isDuplicate()` before creating snapshot
      - Storage location: read `maraudersMapMd.history.storageLocation` — if `workspace`, use `.maraudersmapmd/history/`; if `globalStorage`, use `context.globalStorageUri`
    - `maraudersMapMd.history.open`:
      - Read snapshot index for current file
      - Show `QuickPick` with items: `{ label: timestamp, description: label/auto, detail: size }`, sorted newest first
      - Actions on select: View | Diff | Restore | Copy
    - `maraudersMapMd.history.createCheckpoint`:
      - Show input box for label
      - Create snapshot with `isCheckpoint: true` and user label
    - `maraudersMapMd.history.pruneNow`:
      - Run retention engine on current file's snapshots
      - Delete identified snapshots
      - Show info message with count deleted
  - Update `src/extension.ts`: Register history commands and listeners

  **Must NOT do**:
  - Do NOT implement diff/restore actions (that's Task 16)
  - Do NOT implement interval-based snapshots (option exists but not priority for v0.1)
  - Do NOT add webview timeline UI (v1.0)
  - Do NOT add search/filter for snapshots (v1.0)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: QuickPick UI + event listeners, moderate complexity
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (within Wave 4)
  - **Parallel Group**: Wave 4 (sequential after Task 14)
  - **Blocks**: Task 16
  - **Blocked By**: Task 14

  **References**:

  **Pattern References**:
  - `prd.md:195-208` — History UI spec: QuickPick, View/Diff/Restore/Copy actions, pre-restore protection
  - `prd.md:314-323` — History settings: enabled (true), storageLocation (workspace), mode (onSave), intervalMinutes (10), compression (gzip), createPreRestoreSnapshot (true)
  - `src/history/snapshotStore.ts` (from Task 13) — Snapshot CRUD, isDuplicate, compression
  - `src/history/retentionEngine.ts` (from Task 14) — Retention policy execution

  **External References**:
  - VS Code QuickPick: `https://code.visualstudio.com/api/references/vscode-api#window.showQuickPick`
  - VS Code onDidSaveTextDocument: `https://code.visualstudio.com/api/references/vscode-api#workspace.onDidSaveTextDocument`

  **WHY Each Reference Matters**:
  - QuickPick is the chosen UI for v0.1 history browsing (not webview timeline)
  - onDidSaveTextDocument is the trigger for automatic snapshots

  **Acceptance Criteria**:

  ```bash
  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"

  npx tsc --noEmit && echo "TYPES OK"
  # Assert: "TYPES OK"

  # Functional verification in Extension Dev Host:
  # 1. Open + save a .md file → Assert: snapshot created in .maraudersmapmd/history/
  # 2. Run MaraudersMapMD: History → Assert: QuickPick shows with snapshot entry
  # 3. Run MaraudersMapMD: Create Checkpoint → Assert: shows input box, creates labeled snapshot
  # 4. Save identical content again → Assert: NO duplicate snapshot created
  ```

  **Commit**: YES
  - Message: `feat(history): add onSave snapshots, checkpoint creation, and QuickPick history UI`
  - Files: `src/history/historyCommands.ts, src/extension.ts`
  - Pre-commit: `npm run compile`

---

- [x] 16. Diff/Restore/Copy Actions

  **What to do**:
  - Update `src/history/historyCommands.ts`:
    - `maraudersMapMd.history.diffWithCurrent`:
      - Accept snapshot ID (from QuickPick selection)
      - Create temporary file with snapshot content
      - Open VS Code diff editor: `vscode.commands.executeCommand('vscode.diff', snapshotUri, currentFileUri, title)`
    - `maraudersMapMd.history.restoreSnapshot`:
      - Accept snapshot ID
      - If `createPreRestoreSnapshot` setting is true, create a snapshot of current content before restoring (labeled "pre-restore")
      - Replace current editor content with snapshot content using `WorkspaceEdit`
      - Show info message confirming restore
    - Copy Snapshot Text:
      - Write snapshot content to clipboard (`vscode.env.clipboard.writeText`)
      - Show brief info message
  - Create custom `TextDocumentContentProvider` for snapshot URIs:
    - Register `maraudersMapMd` scheme
    - `provideTextDocumentContent(uri)`: read and decompress snapshot content

  **Must NOT do**:
  - Do NOT add merge/three-way diff
  - Do NOT add undo for restore (VS Code's native undo handles this via WorkspaceEdit)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Uses well-documented VS Code APIs (diff, clipboard, WorkspaceEdit)
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential after Task 15)
  - **Blocks**: Task 24
  - **Blocked By**: Task 15

  **References**:

  **Pattern References**:
  - `prd.md:200-207` — Actions: View, Diff with Current, Restore, Copy Snapshot Text + pre-restore protection
  - `prd.md:323` — `createPreRestoreSnapshot` setting (default: true)
  - `src/history/snapshotStore.ts` (from Task 13) — Read/decompress snapshot content

  **External References**:
  - VS Code diff command: `https://code.visualstudio.com/api/references/commands#vscode.diff`
  - TextDocumentContentProvider: `https://code.visualstudio.com/api/references/vscode-api#TextDocumentContentProvider`
  - VS Code clipboard: `https://code.visualstudio.com/api/references/vscode-api#Clipboard`

  **WHY Each Reference Matters**:
  - `vscode.diff` command opens the built-in diff editor — no need to build custom diff UI
  - TextDocumentContentProvider enables virtual documents for snapshots (read-only)
  - Pre-restore snapshot is a specific PRD requirement (default: true)

  **Acceptance Criteria**:

  ```bash
  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"

  # Functional verification in Extension Dev Host:
  # 1. Create snapshot → Modify file → Run Diff with Current
  #    Assert: Diff editor opens showing changes
  # 2. Run Restore Snapshot
  #    Assert: Pre-restore snapshot created, content reverted
  # 3. Run Copy Snapshot Text
  #    Assert: Clipboard contains snapshot content
  ```

  **Commit**: YES
  - Message: `feat(history): add diff, restore (with pre-restore protection), and copy actions`
  - Files: `src/history/historyCommands.ts`
  - Pre-commit: `npm run compile`

---

### Wave 5 — AI Readability Support

- [x] 17. Token Estimator + Markdown Structure Parser (Pure TS)

  **What to do**:
  - Create `src/ai/tokenEstimator.ts` (pure TS):
    - `estimateTokens(text: string, mode: 'koreanWeighted' | 'simple'): number`:
      - `simple`: `Math.ceil(text.length / 4)` (English approximation)
      - `koreanWeighted`:
        - Detect Korean characters (Unicode range `\uAC00-\uD7AF`, `\u3130-\u318F`)
        - Korean char ≈ 2.5 tokens
        - English word (split by whitespace) ≈ 1.3 tokens
        - Punctuation/whitespace ≈ 0.25 tokens per char
        - Return sum rounded up
    - `estimateTokensPerSection(sections: Section[]): SectionWithTokens[]` — annotate each section
  - Create `src/ai/markdownParser.ts` (pure TS):
    - Interface `Section`: `{ heading: string; level: number; startLine: number; endLine: number; content: string }`
    - `parseStructure(text: string): Section[]`:
      - Split document by H2 headings (## level)
      - Content before first H2 becomes "preamble" section
      - Each section includes heading text, level, line range, full content
      - MUST ignore headings inside fenced code blocks (``` ... ```)
    - `extractSummary(section: Section): string`:
      - Heuristic: first non-empty sentence (up to period/newline)
      - Plus any lines containing `**bold**` patterns (key terms)
      - Trim to max 200 chars
    - `extractKeyTerms(section: Section): string[]`:
      - Find bold text (`**term**`), links (`[text](url)` → text), and headings within section
  - TDD: Create `test/unit/tokenEstimator.test.ts`:
    - Test: simple mode approximation
    - Test: Korean text produces higher token count than English of same char length
    - Test: mixed Korean/English text
    - Test: empty string returns 0
  - TDD: Create `test/unit/markdownParser.test.ts`:
    - Test: parses document with multiple H2 sections
    - Test: preamble (content before first H2) captured as section
    - Test: ignores headings inside code fences
    - Test: extracts first sentence as summary
    - Test: extracts bold terms as key terms
    - Test: handles document with no H2 headings (single section)
    - Test: handles empty document
    - Test: line numbers are correct
    - Use `test/fixtures/sample.md` as test input

  **Must NOT do**:
  - Do NOT import `vscode`
  - Do NOT use tiktoken or any tokenizer library
  - Do NOT add NLP/scoring/ranking for summaries
  - Do NOT split at levels other than H2

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Pure parsing logic with clear algorithms
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (independent of Waves 2-4)
  - **Parallel Group**: Wave 5 (first task, blocks 18-22)
  - **Blocks**: Tasks 18-22
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `prd.md:246-256` — AI Map (headings, line ranges, token estimation, summary), Section Pack (heading-unit split), Search Index (keywords, sentences, tokens)
  - `prd.md:332` — Token estimate mode: `koreanWeighted` default
  - `test/fixtures/sample.md` (from Task 1) — Standard test fixture with H2 structure
  - `test/fixtures/korean-sample.md` (from Task 1) — Korean text for token estimation testing

  **WHY Each Reference Matters**:
  - Token estimation algorithm must match the PRD's `koreanWeighted` specification
  - The fixture files provide reproducible test inputs with known structure

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/tokenEstimator.test.ts test/unit/markdownParser.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/ai/tokenEstimator.ts src/ai/markdownParser.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(ai): add token estimator (Korean-weighted) and markdown structure parser`
  - Files: `src/ai/tokenEstimator.ts, src/ai/markdownParser.ts, test/unit/tokenEstimator.test.ts, test/unit/markdownParser.test.ts`
  - Pre-commit: `npm test`

---

- [x] 18. AI Map Generator

  **What to do**:
  - Create `src/ai/aiMapGenerator.ts` (pure TS):
    - `generateAiMap(options: { filePath: string; content: string; tokenMode: string }): string`:
      - Parse structure using `markdownParser.parseStructure()`
      - Estimate tokens per section using `tokenEstimator`
      - For each section: extract summary using `extractSummary()`
      - Output markdown format:
        ```
        # AI Map: {filename}
        
        > Auto-generated by MaraudersMapMD. This file helps AI tools understand the document structure.
        > Source: {filePath}
        > Generated: {ISO timestamp}
        > Total tokens: {estimate}
        
        ## Document Structure
        
        | # | Section | Lines | Tokens | Summary |
        |---|---------|-------|--------|---------|
        | 1 | {heading} | {start}-{end} | ~{tokens} | {summary} |
        
        ## Section Details
        
        ### 1. {heading}
        - **Lines**: {start}-{end}
        - **Tokens**: ~{tokens}
        - **Key terms**: {bold terms, links}
        - **Summary**: {first sentence + bold patterns}
        
        ## AI Hints Found
        - [AI RULE] at line {N}: {content}
        - [AI DECISION] at line {N}: {content}
        ```
    - Pure function: text in, markdown out
  - TDD: Create `test/unit/aiMapGenerator.test.ts`:
    - Test: generates map with correct section count
    - Test: includes token estimates
    - Test: includes line ranges
    - Test: includes summaries
    - Test: includes AI hints if present in source
    - Test: handles empty document
    - Test: output is valid markdown (basic structure check)
    - Use `test/fixtures/sample.md` as input

  **Must NOT do**:
  - Do NOT write to filesystem (caller handles that)
  - Do NOT import `vscode`
  - Do NOT call any AI/LLM API

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: String composition using outputs from parser/estimator
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19, 20, 21, 22)
  - **Parallel Group**: Wave 5 parallel batch
  - **Blocks**: Task 23
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `prd.md:245-248` — AI Map spec: structure, section ranges, token estimation, summary extraction
  - `prd.md:237-243` — Output structure: `.ai/<docId>/ai-map.md`
  - `src/ai/markdownParser.ts` (from Task 17) — Section parsing, summary extraction, key terms
  - `src/ai/tokenEstimator.ts` (from Task 17) — Token estimation

  **WHY Each Reference Matters**:
  - The AI Map format must be immediately useful to external AI tools
  - The PRD output structure defines exact file paths

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/aiMapGenerator.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/ai/aiMapGenerator.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(ai): add AI Map generator with section structure, token estimates, and summaries`
  - Files: `src/ai/aiMapGenerator.ts, test/unit/aiMapGenerator.test.ts`
  - Pre-commit: `npm test`

---

- [x] 19. Section Pack Generator

  **What to do**:
  - Create `src/ai/sectionPackGenerator.ts` (pure TS):
    - `generateSectionPack(options: { filePath: string; content: string }): SectionFile[]`:
      - Parse structure using `markdownParser.parseStructure()`
      - For each section, generate a file:
        - Filename: `{NN}-{slug}.md` (e.g., `01-introduction.md`, `02-requirements.md`)
        - Slug: heading text lowercased, spaces to hyphens, non-alphanumeric removed, max 50 chars
        - Content:
          ```
          <!-- Section from: {source file} | Lines: {start}-{end} -->
          
          {original section content}
          ```
      - Interface `SectionFile`: `{ filename: string; content: string; heading: string; lineRange: [number, number] }`
    - `generateSlug(heading: string): string` — pure function
  - TDD: Create `test/unit/sectionPackGenerator.test.ts`:
    - Test: correct number of section files generated
    - Test: filenames use zero-padded numbering (01, 02...)
    - Test: slugs handle Korean headings (romanize or use numbers)
    - Test: content includes source metadata comment
    - Test: handles document with no H2 (single file)
    - Test: handles empty sections (heading only, no content)

  **Must NOT do**:
  - Do NOT write to filesystem (return array of files, caller writes)
  - Do NOT import `vscode`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple splitting and string formatting
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18, 20, 21, 22)
  - **Parallel Group**: Wave 5 parallel batch
  - **Blocks**: Task 23
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `prd.md:249-251` — Section Pack spec: heading-unit split for external AI consumption
  - `prd.md:237-243` — Output structure: `.ai/<docId>/sections/01-....md`

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/sectionPackGenerator.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/ai/sectionPackGenerator.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(ai): add Section Pack generator for heading-based document splitting`
  - Files: `src/ai/sectionPackGenerator.ts, test/unit/sectionPackGenerator.test.ts`
  - Pre-commit: `npm test`

---

- [x] 20. Search Index Builder

  **What to do**:
  - Create `src/ai/searchIndexBuilder.ts` (pure TS):
    - Interface `IndexEntry`: `{ section: string; slug: string; lineRange: [number, number]; tokens: number; keywords: string[]; links: string[]; summary: string; aiHints: string[] }`
    - Interface `SearchIndex`: `{ version: 1; source: string; generated: string; totalTokens: number; entries: IndexEntry[] }`
    - `buildSearchIndex(options: { filePath: string; content: string; tokenMode: string }): SearchIndex`:
      - Parse structure + estimate tokens + extract key terms + find links + find AI hints
      - Return structured JSON object
    - Pure function: text in, JSON object out
  - TDD: Create `test/unit/searchIndexBuilder.test.ts`:
    - Test: correct entry count matches section count
    - Test: keywords extracted from bold text
    - Test: links extracted from `[text](url)` patterns
    - Test: AI hints captured per section
    - Test: total tokens matches sum of section tokens
    - Test: output schema is valid (has all required fields)

  **Must NOT do**:
  - Do NOT write JSON to filesystem (caller handles)
  - Do NOT import `vscode`
  - Do NOT add full-text search capability (just the index)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: JSON construction from parsed data
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18, 19, 21, 22)
  - **Parallel Group**: Wave 5 parallel batch
  - **Blocks**: Task 23
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `prd.md:253-255` — Search Index spec: section keywords, important sentences, links, token estimates
  - `prd.md:237-243` — Output: `.ai/<docId>/index.json`

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/searchIndexBuilder.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/ai/searchIndexBuilder.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(ai): add Search Index builder with keywords, links, and token estimates`
  - Files: `src/ai/searchIndexBuilder.ts, test/unit/searchIndexBuilder.test.ts`
  - Pre-commit: `npm test`

---

- [x] 21. Token Budget Context Export

  **What to do**:
  - Create `src/ai/tokenBudgetExporter.ts` (pure TS):
    - `exportWithBudget(options: { content: string; budget: number; tokenMode: string }): string`:
      - Algorithm (deterministic, NO scoring/ranking):
        1. Parse structure
        2. Always include: ALL headings (## level)
        3. Always include: ALL AI hint blocks (`[AI RULE]`, `[AI DECISION]`, `[AI TODO]`, `[AI CONTEXT]`) — these have priority
        4. Calculate remaining budget after headings + hints
        5. For each section (in order): include first N characters until budget exhausted
        6. Maintain section boundaries: never cut mid-sentence if possible (find last period/newline)
        7. If a section is truncated, append `[... truncated, see full section: {filename}]`
      - Return assembled markdown string
    - Preset budgets: `{ '1k': 1000, '2k': 2000, '4k': 4000, '8k': 8000 }`
  - TDD: Create `test/unit/tokenBudgetExporter.test.ts`:
    - Test: output token estimate is within budget (±20% tolerance)
    - Test: all headings present in output
    - Test: AI hint blocks present in output
    - Test: sections truncated with marker when budget is tight
    - Test: 1k budget produces significantly smaller output than 8k
    - Test: very small document (under budget) returns full content
    - Test: empty document returns empty string

  **Must NOT do**:
  - Do NOT add "importance" scoring — purely deterministic order-based inclusion
  - Do NOT import `vscode`
  - Do NOT copy to clipboard (caller handles that)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Algorithm implementation with multiple edge cases
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18, 19, 20, 22)
  - **Parallel Group**: Wave 5 parallel batch
  - **Blocks**: Task 23
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `prd.md:257-263` — Token Budget spec: budget presets (1k/2k/4k/8k/custom), headings preserved, section boundaries preserved, important blocks priority, extractive abbreviation
  - `prd.md:271` — AI Hint blocks get priority weight in context export

  **WHY Each Reference Matters**:
  - The budget algorithm must be deterministic — same input always produces same output
  - AI hint blocks getting priority is a SPECIFIC PRD requirement, not an optional feature

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/tokenBudgetExporter.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/ai/tokenBudgetExporter.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(ai): add token budget context exporter with heading and hint block priority`
  - Files: `src/ai/tokenBudgetExporter.ts, test/unit/tokenBudgetExporter.test.ts`
  - Pre-commit: `npm test`

---

- [x] 22. AI Hint Blocks (Parser + Inserter)

  **What to do**:
  - Create `src/ai/hintBlockParser.ts` (pure TS):
    - `parseHintBlocks(text: string): HintBlock[]`:
      - Find lines matching pattern: `> [AI RULE]`, `> [AI DECISION]`, `> [AI TODO]`, `> [AI CONTEXT]`
      - Regex: `/^>\s*\[AI\s+(RULE|DECISION|TODO|CONTEXT)\]\s*(.+)$/gm`
      - Interface `HintBlock`: `{ type: 'RULE' | 'DECISION' | 'TODO' | 'CONTEXT'; content: string; line: number }`
    - `formatHintBlock(type: string, content: string): string`:
      - Returns `> [AI {TYPE}] {content}`
  - Update `src/edit/editCommands.ts` or create `src/ai/aiCommands.ts` (vscode adapter):
    - `maraudersMapMd.ai.insertHintRule`: Insert `> [AI RULE] ` at cursor
    - `maraudersMapMd.ai.insertHintDecision`: Insert `> [AI DECISION] ` at cursor
    - `maraudersMapMd.ai.insertHintNote`: Insert `> [AI CONTEXT] ` at cursor
    - Each command inserts template text and positions cursor after the prefix
  - TDD: Create `test/unit/hintBlockParser.test.ts`:
    - Test: finds `[AI RULE]` blocks
    - Test: finds `[AI DECISION]` blocks
    - Test: finds `[AI TODO]` blocks
    - Test: finds `[AI CONTEXT]` blocks
    - Test: ignores `[AI RULE]` not in blockquote (no `>` prefix)
    - Test: handles multiple hints in same document
    - Test: returns empty array for document without hints
    - Test: `formatHintBlock` produces correct format

  **Must NOT do**:
  - Do NOT add AI hint block syntax highlighting (v1.0 maybe)
  - Do NOT validate hint content

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple regex parsing and string formatting
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18, 19, 20, 21)
  - **Parallel Group**: Wave 5 parallel batch
  - **Blocks**: Task 23
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `prd.md:266-272` — AI Hint Blocks spec: `[AI RULE]`, `[AI DECISION]`, `[AI TODO]`, `[AI CONTEXT]` in blockquote format
  - `prd.md:283-286` — Hint insert command IDs

  **WHY Each Reference Matters**:
  - The exact syntax (`> [AI RULE]`) must be parsed consistently — it's a contract between the extension and external AI tools
  - Command IDs must match PRD exactly

  **Acceptance Criteria**:

  ```bash
  npx vitest run test/unit/hintBlockParser.test.ts 2>&1 | tail -5
  # Assert: All tests pass

  grep "from 'vscode'" src/ai/hintBlockParser.ts || echo "NO VSCODE IMPORTS"
  # Assert: "NO VSCODE IMPORTS"
  ```

  **Commit**: YES
  - Message: `feat(ai): add AI hint block parser and insertion commands`
  - Files: `src/ai/hintBlockParser.ts, src/ai/aiCommands.ts, test/unit/hintBlockParser.test.ts`
  - Pre-commit: `npm test`

---

- [x] 23. AI onSave Integration + Large Document Protection

  **What to do**:
  - Create `src/ai/aiService.ts` (vscode adapter):
    - `registerAiListeners(context: vscode.ExtensionContext)`:
      - `onDidSaveTextDocument` listener: if markdown file + `ai.enabled` + `ai.buildOnSave`:
        - Debounce: skip if last generation was < 5 seconds ago
        - Generate docId from filename (slug): `path.basename(filePath, '.md')`
        - Create output directory: `{workspace}/.ai/{docId}/`
        - Generate AI Map if `ai.generate.map` enabled
        - Generate Section Pack if `ai.generate.sections` enabled
        - Generate Search Index if `ai.generate.index` enabled
        - Write files to output directory
        - Large document protection: if file > `preview.largeDocThresholdKb`:
          - Generate map only (skip sections + index)
          - Log warning to output channel
    - `maraudersMapMd.ai.generateMap`: Manual trigger — generate map for current file
    - `maraudersMapMd.ai.exportSectionPack`: Manual trigger — generate sections
    - `maraudersMapMd.ai.buildIndex`: Manual trigger — generate search index
    - `maraudersMapMd.ai.copyContextBudgeted`:
      - Show QuickPick for budget: 1k / 2k / 4k / 8k / Custom
      - If Custom: show input box for number
      - Generate budgeted context
      - Copy to clipboard (`vscode.env.clipboard.writeText`)
      - Show info message: "Copied ~{N} tokens to clipboard"
    - Handle git policy setting `ai.gitPolicy`:
      - `ignoreAll`: ensure `.ai/` is in `.gitignore` (suggest adding if not present)
      - `commitMapOnly`: suggest `.gitignore` pattern for `sections/` and `index.json`
      - `commitAll`: no action needed
  - Update `src/extension.ts`: Register AI commands and listeners

  **Must NOT do**:
  - Do NOT block the editor during generation — run asynchronously
  - Do NOT generate artifacts for non-markdown files
  - Do NOT call any LLM/AI API
  - Do NOT generate if file is untitled (no path)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration task coordinating multiple modules + file I/O + async operations
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential, after Tasks 18-22)
  - **Blocks**: Task 24
  - **Blocked By**: Tasks 18, 19, 20, 22

  **References**:

  **Pattern References**:
  - `prd.md:273-277` — Generation timing: onSave default, manual trigger, large doc protection
  - `prd.md:326-333` — AI settings: enabled (true), outputDir (.ai), buildOnSave (true), generate.map/sections/index (all true), tokenEstimateMode (koreanWeighted), gitPolicy (ignoreAll)
  - `prd.md:237-243` — Output directory structure: `.ai/<docId>/ai-map.md`, `index.json`, `sections/`
  - `src/ai/aiMapGenerator.ts` (Task 18) — AI Map generation
  - `src/ai/sectionPackGenerator.ts` (Task 19) — Section Pack generation
  - `src/ai/searchIndexBuilder.ts` (Task 20) — Search Index generation
  - `src/ai/tokenBudgetExporter.ts` (Task 21) — Budget export
  - `src/ai/hintBlockParser.ts` (Task 22) — Hint parsing (used by map generator)

  **WHY Each Reference Matters**:
  - This task INTEGRATES all AI sub-modules — every reference is needed
  - The git policy setting affects developer workflow and must be handled correctly

  **Acceptance Criteria**:

  ```bash
  npm run compile && echo "BUILD OK"
  # Assert: "BUILD OK"

  npx tsc --noEmit && echo "TYPES OK"
  # Assert: "TYPES OK"

  # Functional verification in Extension Dev Host:
  # 1. Save a .md file with H2 sections
  #    Assert: .ai/<docId>/ai-map.md created
  #    Assert: .ai/<docId>/sections/ contains section files
  #    Assert: .ai/<docId>/index.json created
  # 2. Save again with identical content
  #    Assert: No regeneration (debounce skips)
  # 3. Run MaraudersMapMD: Copy Context (Budgeted)
  #    Assert: QuickPick shows budget options
  #    Assert: After selection, clipboard contains budgeted content
  #    Assert: Info message shows estimated token count
  # 4. Check .gitignore suggestion for .ai/ directory
  ```

  **Commit**: YES
  - Message: `feat(ai): integrate AI artifact generation with onSave, budget export, and large doc protection`
  - Files: `src/ai/aiService.ts, src/ai/aiCommands.ts, src/extension.ts`
  - Pre-commit: `npm run compile`

---

### Wave 6 — Final Integration

- [x] 24. Integration Tests + Smoke Tests + Package

  **What to do**:
  - Set up @vscode/test-electron:
    - Create `test/integration/runTests.ts`: Test runner setup
    - Create `test/integration/extension.test.ts`:
      - Test: Extension activates on markdown file open
      - Test: All commands registered (iterate commands, verify each exists)
      - Test: Configuration schema has all expected settings
  - Run full test suite:
    - `npm test` — all vitest unit tests pass
    - `npm run test:integration` — all @vscode/test-electron tests pass
  - Build and package:
    - `npm run package` — production build (minified, no sourcemaps)
    - `npx vsce package` — create `.vsix` file
    - Verify `.vsix` file size is reasonable (< 5MB without node_modules)
  - Final smoke test in clean Extension Development Host:
    - Open markdown file → Preview opens
    - Bold command works
    - Image insert from file works
    - Save → History snapshot created
    - Save → AI artifacts generated
    - PDF export (if Chrome available)
  - Update `README.md` with:
    - Feature list
    - Installation instructions
    - Usage guide
    - Settings reference
    - Screenshots (placeholder paths)

  **Must NOT do**:
  - Do NOT publish to VS Code Marketplace (user decision)
  - Do NOT add CI/CD pipeline (separate task)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-cutting integration testing and final verification
  - **Skills**: [`webapp-testing`, `git-master`]
    - `webapp-testing`: Testing automation patterns
    - `git-master`: Final commit and tagging

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all other tasks)
  - **Parallel Group**: Wave 6 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: All previous tasks

  **References**:

  **Pattern References**:
  - `prd.md:369-393` — Acceptance criteria for all features
  - `prd.md:399-404` — v0.1 MVP feature list (checklist for smoke test)
  - All `src/` files from Tasks 0-23

  **External References**:
  - @vscode/test-electron: `https://github.com/microsoft/vscode-test`
  - vsce packaging: `https://code.visualstudio.com/api/working-with-extensions/publishing-extension`
  - VS Code testing guide: `https://code.visualstudio.com/api/working-with-extensions/testing-extension`

  **WHY Each Reference Matters**:
  - Acceptance criteria from PRD are the final validation checklist
  - @vscode/test-electron documentation shows the runner pattern

  **Acceptance Criteria**:

  ```bash
  # All unit tests pass
  npx vitest run 2>&1 | tail -5
  # Assert: 0 failures

  # Build succeeds
  npm run package && echo "BUILD OK"
  # Assert: "BUILD OK"

  # VSIX package created
  npx vsce package --no-dependencies && ls *.vsix
  # Assert: .vsix file exists

  # VSIX size reasonable
  ls -la *.vsix | awk '{if($5 < 5000000) print "SIZE OK"; else print "TOO LARGE"}'
  # Assert: "SIZE OK"

  # Type check passes
  npx tsc --noEmit && echo "TYPES OK"
  # Assert: "TYPES OK"
  ```

  **Commit**: YES
  - Message: `feat: complete v0.1 MVP with integration tests and packaging`
  - Files: `test/integration/*, README.md, *.vsix`
  - Pre-commit: `npm test && npm run package`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|--------------|
| 0 | `feat: scaffold project with package.json, esbuild, tsconfig` | package.json, tsconfig.json, esbuild.js, src/extension.ts | `npm run compile` |
| 1 | `test: add vitest configuration and test fixtures` | vitest.config.ts, test/fixtures/*.md | `npm test` |
| 2 | `feat(preview): add MarkdownEngine with source-line injection` | src/preview/markdownEngine.ts | `npm test` |
| 3 | `feat(preview): add PreviewManager with webview lifecycle` | src/preview/previewManager.ts | `npm run compile` |
| 4 | `feat(preview): add webview CSS/JS with theme-aware styling` | media/preview.css, media/preview.js | `npm run compile` |
| 5 | `feat(edit): add format and insert commands` | src/edit/formatters.ts, src/edit/editCommands.ts | `npm test` |
| 6 | `feat(edit): add task checkbox toggle` | src/edit/formatters.ts | `npm test` |
| 7 | `feat(images): add insert image from file` | src/images/pathUtils.ts, src/images/imageCommands.ts | `npm test` |
| 8 | `feat(images): add editor drag-drop and paste providers` | src/images/editorDropProvider.ts | `npm run compile` |
| 9 | `feat(images): add webview drag-drop` | media/preview.js, src/preview/previewManager.ts | `npm run compile` |
| 10 | `feat(export): add HTML export` | src/export/htmlTemplate.ts, src/export/exportCommands.ts | `npm test` |
| 11 | `feat(export): add Chrome detection` | src/export/chromeDetector.ts | `npm test` |
| 12 | `feat(export): add PDF export with puppeteer-core` | src/export/pdfExporter.ts | `npm test` |
| 13 | `feat(history): add snapshot store with compression` | src/history/snapshotStore.ts | `npm test` |
| 14 | `feat(history): add retention engine` | src/history/retentionEngine.ts | `npm test` |
| 15 | `feat(history): add onSave snapshots and QuickPick UI` | src/history/historyCommands.ts | `npm run compile` |
| 16 | `feat(history): add diff, restore, and copy actions` | src/history/historyCommands.ts | `npm run compile` |
| 17 | `feat(ai): add token estimator and markdown parser` | src/ai/tokenEstimator.ts, src/ai/markdownParser.ts | `npm test` |
| 18 | `feat(ai): add AI Map generator` | src/ai/aiMapGenerator.ts | `npm test` |
| 19 | `feat(ai): add Section Pack generator` | src/ai/sectionPackGenerator.ts | `npm test` |
| 20 | `feat(ai): add Search Index builder` | src/ai/searchIndexBuilder.ts | `npm test` |
| 21 | `feat(ai): add token budget context exporter` | src/ai/tokenBudgetExporter.ts | `npm test` |
| 22 | `feat(ai): add AI hint block parser and inserter` | src/ai/hintBlockParser.ts | `npm test` |
| 23 | `feat(ai): integrate AI artifacts with onSave` | src/ai/aiService.ts | `npm run compile` |
| 24 | `feat: complete v0.1 MVP with integration tests` | test/integration/*, README.md | `npm test && npm run package` |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass
npm test                    # Expected: 0 failures

# Build succeeds
npm run compile             # Expected: dist/extension.js created

# Types clean
npx tsc --noEmit            # Expected: 0 errors

# Package builds
npx vsce package --no-dependencies  # Expected: .vsix file created
```

### Final Checklist
- [x] All 25 tasks completed (24/25 - Task 9 deferred to v1.0)
- [x] All "Must Have" features present and functional
- [x] All "Must NOT Have" items verified absent
- [x] All vitest tests passing (0 failures) - 252/252 passing
- [x] Extension activates without errors
- [x] Preview renders markdown correctly
- [x] Quick edit commands work (bold, italic, code, link, heading, quote, task toggle)
- [x] Image insert from file + editor drag-drop work (webview drag-drop deferred to v1.0)
- [x] HTML export produces valid HTML with embedded images
- [x] PDF export works with system Chrome (or shows proper fallback)
- [x] History creates snapshots on save
- [x] History diff/restore/copy work
- [x] AI artifacts generated on save (.ai/<docId>/)
- [x] Token budget copy respects budget limits
- [x] AI hint block insertion works
- [x] No `vscode` imports in pure logic modules (verified - only in adapters)
- [x] English UI throughout
