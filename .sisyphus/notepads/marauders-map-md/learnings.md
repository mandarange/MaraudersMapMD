# MaraudersMapMD Test Infrastructure Learnings

## Task 1: Test Infrastructure Setup

### Completed
- ✓ vitest.config.ts created with test.include: ['test/unit/**/*.test.ts'], test.globals: true
- ✓ test/unit/smoke.test.ts created with passing smoke test (expect(1 + 1).toBe(2))
- ✓ test/fixtures/sample.md created (2,379 bytes, ~2.4KB) with comprehensive markdown content
- ✓ test/fixtures/large-sample.md created (68,751 bytes, ~68KB) with repeated sections
- ✓ test/fixtures/korean-sample.md created (3,961 bytes) with Korean text for token estimation tests
- ✓ package.json updated with "test": "vitest run" and "test:watch": "vitest" scripts
- ✓ npm test runs successfully and shows "1 passed"
- ✓ All fixtures verified with proper file sizes

### Key Findings

#### Vitest Configuration
- vitest.config.ts is minimal and straightforward
- test.globals: true enables global test functions (describe, it, expect) without imports
- test.include pattern matches all .test.ts files in test/unit/
- No additional plugins needed for basic unit testing

#### Test Fixtures
- sample.md includes: H1, H2, H3, H4 headings, lists (ordered/unordered), code blocks (Python, TypeScript), task lists, blockquotes, tables, links, images, bold/italic/strikethrough formatting
- large-sample.md created by repeating middle sections to reach ~68KB (exceeds 50KB requirement)
- korean-sample.md includes Korean text with various markdown elements for token estimation testing

#### Build Process
- npm test automatically runs npm run compile (pretest hook)
- esbuild compiles successfully with minor ES2024 target warning (non-blocking)
- Vitest runs after compilation completes
- Total test execution time: ~144ms

#### File Size Verification
- sample.md: 2,379 bytes ✓ (requirement: ≥500 bytes)
- large-sample.md: 68,751 bytes ✓ (requirement: ≥40,000 bytes)
- korean-sample.md: 3,961 bytes ✓ (contains Korean text)

### Patterns for Future Tasks

1. **Test File Organization**: Place unit tests in test/unit/ with .test.ts suffix
2. **Fixture Usage**: Test fixtures are ready for use in subsequent feature tests
3. **Test Scripts**: Both "test" (run once) and "test:watch" (continuous) are available
4. **Smoke Test Pattern**: Simple expect() assertions verify vitest is working

### Dependencies Verified
- vitest ^1.0.0 already in package.json from Task 0
- No additional dependencies needed for basic vitest setup
- @vscode/test-electron deferred to Wave 6 (integration tests)

### Next Steps
- Task 2 (MarkdownEngine) will use test/unit/markdownEngine.test.ts pattern
- All subsequent feature tasks will follow TDD: RED → GREEN → REFACTOR
- Test fixtures are ready for use in markdown parsing tests

## Task 2: MarkdownEngine Implementation (TDD)

### TDD Workflow Success
- **RED phase**: Created 10 test cases first, verified they fail (module not found)
- **GREEN phase**: Implemented MarkdownEngine to make all tests pass
- **Key insight**: Writing tests first forced clear API design (render vs renderWithMeta)

### markdown-it Patterns
- **Source line injection**: Use `md.core.ruler.push()` to add custom rules
- **Token inspection**: Check `token.map` for line numbers, `token.type` for block detection
- **Plugin configuration**: markdown-it-task-lists `enabled: false` adds `disabled` attribute to checkboxes
- **Heading extraction**: Parse tokens, look for `heading_open` + `inline` pairs

### Type Declarations
- markdown-it-task-lists has no @types package
- Created custom declaration in `src/types/markdown-it-task-lists.d.ts`
- Pattern: `export = taskLists` for CommonJS module compatibility

### Module Boundary Pattern
- MarkdownEngine is pure TypeScript (zero vscode imports)
- Testable with vitest without VS Code runtime
- Exports: MarkdownEngine class, Heading interface, RenderResult interface
- This enables fast unit testing and clear separation of concerns

### Test Coverage Achieved
1. Basic rendering (headings, paragraphs, lists)
2. data-source-line attribute injection on block elements
3. Task list rendering with disabled checkboxes
4. HTML escaping (allowHtml: false)
5. HTML passthrough (allowHtml: true)
6. Empty input handling
7. Frontmatter-like content (no crash)
8. renderWithMeta: heading extraction with level, text, line, slug
9. renderWithMeta: lineCount calculation
10. Documents with no headings

### Slugification
- Simple slug generation: lowercase, trim, remove special chars, replace spaces with hyphens
- Used for heading anchor links (future feature)

## Task 3: PreviewManager Implementation

### Webview Lifecycle Patterns
- Singleton panel pattern: check `this.panel` before creating, `reveal()` if exists
- `createWebviewPanel()` takes viewType, title, showOptions, options
- `preserveFocus: true` in showOptions keeps editor focused when opening beside
- `retainContextWhenHidden: true` keeps webview state when tab is not visible (memory cost but prevents re-render)
- `onDidDispose` callback fires when user closes the panel — must null out references
- Push dispose listeners into `this.disposables` array, clean them up in `dispose()`

### CSP Configuration
- Strict CSP: `default-src 'none'` blocks everything, then whitelist per directive
- `style-src ${cspSource} 'unsafe-inline'` — cspSource for external CSS, unsafe-inline for inline styles
- `img-src ${cspSource} https: data: file:` — covers webview URIs, remote images, base64, local files
- `script-src 'nonce-${nonce}'` — only scripts with matching nonce can execute
- `font-src ${cspSource}` — fonts from extension resources only
- `webview.cspSource` provides the VS Code webview origin string

### Debouncing Strategy
- Use `ReturnType<typeof setTimeout>` for cross-platform timeout type (avoids Node vs browser conflict)
- Always clear previous timeout before setting new one: `clearTimeout(this.updateTimeout)`
- Read delay from config each time (respects user changes without restart)
- Large doc detection: `Buffer.byteLength(text, 'utf8') / 1024` for accurate KB size
- Two-tier debounce: normal (200ms) vs large doc (700ms) based on `largeDocThresholdKb`

### Version Tracking
- Increment `this.version` on each update, capture into local `currentVersion`
- Send version in `postMessage` — webview script should only apply if version >= last seen
- Prevents stale renders from overwriting newer content (race condition prevention)

### Module Boundaries
- `htmlTemplate.ts` is pure TS (no vscode imports) — testable without VS Code runtime
- `getNonce.ts` is pure TS — simple utility, no dependencies
- `previewManager.ts` is the VS Code adapter — imports vscode, manages panel lifecycle
- `extension.ts` wires PreviewManager to VS Code command/event system

### Lock Feature
- `toggleLock()` captures current document reference when locking
- When locked: only updates for the locked document's URI (ignores editor switching)
- When unlocking: immediately updates to current active editor's document
- Lock state shown via emoji prefix in panel title

### Event Wiring Pattern
- `onDidChangeActiveTextEditor` → switch preview to new markdown file (unless locked)
- `onDidChangeTextDocument` → debounced update for editing changes
- Both registered in `extension.ts` via `context.subscriptions.push()`
- PreviewManager methods are public thin handlers; internal logic stays private


## Task 5: Format and Insert Commands (TDD)

### TDD Workflow Success
- **RED phase**: Created 26 test cases covering all formatter functions
- **GREEN phase**: Implemented pure TS formatters to pass all tests
- **REFACTOR phase**: Removed verbose docstrings, used self-documenting variable names

### Pure TS Formatter Pattern
- `src/edit/formatters.ts` has ZERO vscode imports — pure text manipulation
- Functions: wrapSelection, toggleWrap, insertAtLineStart, createLink, createHeading, createBlockquote
- All functions are deterministic and testable without VS Code runtime
- This separation enables fast unit testing and code reuse

### Test Coverage (26 tests)
1. **wrapSelection**: Basic wrapping, empty text, different before/after
2. **toggleWrap**: Add wrap if missing, remove if present, partial wraps, empty text
3. **insertAtLineStart**: Single line, multiline, empty text, trailing newlines
4. **createLink**: Basic link, empty text, empty URL
5. **createHeading**: Levels 1-6, empty text, level clamping (0→1, 7→6)
6. **createBlockquote**: Single line, multiline, empty text, trailing newlines

### VS Code Command Adapter Pattern
- `src/edit/editCommands.ts` imports vscode and formatters
- `registerEditCommands(context)` function registers all 6 commands
- Each command handler:
  - Gets active editor
  - Processes all selections (supports multi-cursor)
  - Uses `editor.edit()` with EditBuilder for atomic changes
  - Calls pure formatter functions

### Command Implementation Details
- **Bold/Italic/InlineCode**: Use `toggleWrap()` for smart toggle behavior
- **Link**: Show `showInputBox()` for URL, apply `createLink()`
- **Heading**: Show `showQuickPick()` with levels 1-6, apply `createHeading()`
- **Quote**: Use `createBlockquote()` on all selections

### Multi-Selection Support
- Loop through `editor.selections` array
- Each selection gets independent formatting
- Enables formatting multiple text blocks in one command

### Extension Integration
- Import `registerEditCommands` in extension.ts
- Call `registerEditCommands(context)` in activate()
- Replaces 6 individual command registrations with single function call
- Cleaner extension.ts, easier to maintain

### Code Style Observations
- Repository uses semantic commit style: `feat(scope): description`
- Example: `feat(edit): implement text formatters with TDD`
- Scope matches module/feature (edit, preview, etc.)

### Key Learnings
1. **Separation of concerns**: Pure formatters + VS Code adapter = testable + maintainable
2. **Self-documenting code**: Variable names like `isAlreadyWrapped`, `validLevel` eliminate need for comments
3. **Multi-selection**: Always loop through selections, not just first one
4. **Input dialogs**: `showInputBox()` for text, `showQuickPick()` for choices
5. **EditBuilder pattern**: All text changes go through `editor.edit()` callback for atomicity

### Test Insights
- Test edge cases: empty text, boundary values (level 0, 7), partial wraps
- Test multiline behavior: ensure newlines are preserved correctly
- Test toggle behavior: verify both add and remove paths work

### Next Steps
- Task 6 (Task Toggle) will follow same pattern: pure formatter + VS Code adapter
- Tasks 7-9 (Images, Export, History) can parallelize with this pattern
- All edit operations should use `editor.edit()` for consistency

## Task 6: Task Toggle (Editor + Preview)

### TDD Workflow Success
- **RED phase**: Created 20 test cases for `isTaskLine()` and `toggleTask()` functions
- **GREEN phase**: Implemented pure TS functions to pass all tests
- **REFACTOR phase**: Code is clean and self-documenting

### Task Toggle Implementation

#### Pure TS Formatter Pattern (formatters.ts)
- `isTaskLine(line: string): boolean` — detects task list lines with regex pattern
  - Pattern: `/^\s*[-*]\s+\[[xX\s]\]/` matches indented task markers
  - Handles both `-` and `*` list markers
  - Handles indented task lines (any leading whitespace)
  
- `toggleTask(line: string): string` — toggles checkbox state
  - Returns unchanged if not a task line
  - Uses regex replace to toggle `[ ]` ↔ `[x]`
  - Preserves indentation and task text
  - Handles both `-` and `*` markers

#### VS Code Command Adapter (editCommands.ts)
- `maraudersMapMd.toggle.task` command registered in `registerEditCommands()`
- `toggleTaskCheckbox()` function:
  - Gets active editor
  - Loops through all selections (multi-cursor support)
  - Gets line at selection start
  - Applies `toggleTask()` formatter
  - Uses `editor.edit()` for atomic changes

### Test Coverage (20 new tests)
1. **isTaskLine**: 10 tests
   - Detects `- [ ]` and `- [x]` patterns
   - Detects `* [ ]` and `* [x]` patterns
   - Detects indented task lines
   - Rejects non-task lines, headings, empty lines

2. **toggleTask**: 10 tests
   - Toggles unchecked → checked
   - Toggles checked → unchecked
   - Handles both `-` and `*` markers
   - Handles indented tasks
   - Preserves task text
   - Returns non-task lines unchanged

### Integration Points
- **Preview checkbox click**: preview.js sends `{ type: 'toggleCheckbox', line }` message
- **PreviewManager handler**: `handleToggleCheckbox()` already implemented (Task 4)
- **Editor command**: New `maraudersMapMd.toggle.task` command for keyboard shortcut
- Both paths (preview click + editor command) update the source document

### Key Learnings
1. **Regex patterns for task detection**: `/^\s*[-*]\s+\[[xX\s]\]/` is robust for all variants
2. **Capture groups in replace**: `$1` preserves indentation and marker in replacement
3. **Multi-cursor support**: Loop through `editor.selections`, not just first selection
4. **Line-based operations**: Use `editor.document.lineAt()` to get full line range
5. **Case-insensitive checkbox**: Pattern `[xX]` handles both lowercase and uppercase

### Test Insights
- Edge cases: indented tasks, `*` vs `-` markers, non-task lines
- Boundary values: empty lines, lines without markers
- Preservation: indentation, task text, marker type

### Build Status
- All 57 tests pass (1 smoke + 26 formatters + 10 markdown engine + 20 task toggle)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (258.5kb dist/extension.js)

### Next Steps
- Task 7 (Image Insert) can follow same pattern
- Tasks 8-9 (Export, History) can parallelize
- All edit operations maintain consistency with `editor.edit()` pattern
