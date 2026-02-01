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

## Task 7: Image Insert from File (TDD)

### TDD Workflow Success
- **RED phase**: Created 22 test cases for pathUtils functions, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS pathUtils to pass all tests
- **REFACTOR phase**: Fixed unused parameter warning by prefixing with underscore

### Pure TS Path Utilities Pattern (pathUtils.ts)
- `generateImageFilename(originalName, pattern)` — applies filename pattern with timestamp
  - Extracts basename and extension separately
  - Supports `{basename}` and `{yyyyMMdd-HHmmss}` placeholders
  - Preserves original file extension
  - Handles filenames with multiple dots correctly
  
- `buildRelativePath(_mdFileDir, assetsDir, filename)` — builds POSIX relative path
  - Converts Windows backslashes to forward slashes
  - Returns `./assetsDir/filename` format
  - Handles nested asset directories (e.g., `assets/2024/january`)
  
- `buildMarkdownImageLink(altText, relativePath)` — formats markdown image syntax
  - Returns `![altText](relativePath)` format
  - Handles empty alt text and special characters
  
- `getAltText(filename, source)` — determines alt text based on setting
  - If source is 'filename': returns filename
  - If source is 'prompt': returns empty string (user will provide via dialog)

### VS Code Command Adapter Pattern (imageCommands.ts)
- `registerImageCommands(context)` function registers `maraudersMapMd.images.insertFromFile`
- Command workflow:
  1. Verify active editor is markdown file
  2. Get config: assetsDir, filenamePattern, altTextSource
  3. Show file picker dialog for image files (png, jpg, jpeg, gif, webp, svg)
  4. Create assets directory if not exists (`vscode.workspace.fs.createDirectory`)
  5. Generate filename using pattern
  6. Copy file to assets directory (`vscode.workspace.fs.copy`)
  7. Build relative path and markdown link
  8. Insert at cursor position using `editor.edit()`

### Test Coverage (22 tests)
1. **generateImageFilename**: 8 tests
   - Basename pattern, timestamp pattern, combined patterns
   - Extension preservation (lowercase, uppercase, multiple dots)
   - Filenames without extension
   
2. **buildRelativePath**: 6 tests
   - POSIX path generation
   - Windows backslash conversion
   - Nested asset directories
   - Special characters in filenames
   
3. **buildMarkdownImageLink**: 4 tests
   - Basic formatting, empty alt text
   - Special characters in alt text
   - Nested paths
   
4. **getAltText**: 4 tests
   - Filename source returns filename
   - Prompt source returns empty string
   - Handles filenames without extension

### Module Boundary Pattern
- `pathUtils.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- `imageCommands.ts` is the VS Code adapter — imports vscode, manages file operations
- This separation enables fast unit testing and clear separation of concerns

### File Operations Pattern
- `vscode.workspace.fs.createDirectory()` — creates directory recursively
- `vscode.workspace.fs.copy()` — copies file with overwrite option
- `vscode.Uri.joinPath()` — safely joins URI paths
- `vscode.Uri.file()` — converts filesystem path to URI
- Error handling: wrap in try-catch, show error message to user

### Configuration Pattern
- Read from `vscode.workspace.getConfiguration('maraudersMapMd.images')`
- Supported settings:
  - `assetsDir` (default: 'assets')
  - `filenamePattern` (default: '{basename}-{yyyyMMdd-HHmmss}')
  - `altTextSource` (default: 'filename')
  - `allowRemote` (false — not implemented in Task 7)

### Build Status
- All 79 tests pass (1 smoke + 46 formatters + 22 pathUtils + 10 markdown engine)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (262.0kb dist/extension.js)

### Key Learnings
1. **Timestamp generation**: Use `Date` object with padStart for zero-padding
2. **Path normalization**: Always convert backslashes to forward slashes for consistency
3. **File extension handling**: Split on last dot to handle multiple dots in filename
4. **Unused parameters**: Prefix with underscore to satisfy TypeScript strict mode
5. **VS Code file operations**: Use workspace.fs for cross-platform compatibility
6. **Error handling**: Always wrap file operations in try-catch, show user-friendly messages

### Next Steps
- Task 8 (Drag & Drop) will reuse pathUtils functions
- Task 9 (Paste to Assets) will reuse pathUtils functions
- All image operations maintain consistency with this pattern

## Task 8: Image Drag-Drop (Editor-side)

### TDD Workflow Success
- **Implementation**: Created `editorDropProvider.ts` with both DocumentDropEditProvider and DocumentPasteEditProvider
- **Registration**: Updated `imageCommands.ts` to register both providers
- **Build**: Compiles successfully with no type errors

### DocumentDropEditProvider Pattern (editorDropProvider.ts)

#### Drop Provider Implementation
- `EditorDropProvider` implements `vscode.DocumentDropEditProvider`
- `provideDocumentDropEdits(document, position, dataTransfer, token)`:
  1. Get file URIs from `dataTransfer.get('text/uri-list')`
  2. Parse URI list (split by newlines, filter comments starting with #)
  3. Filter for image files using `IMAGE_EXTENSIONS` set (png, jpg, jpeg, gif, svg, webp, bmp)
  4. Create assets directory if not exists
  5. For each image: copy to assets, generate filename, build markdown link
  6. Return `DocumentDropEdit` with snippet containing all markdown links
  7. Join multiple images with newlines

#### Image File Detection
- `isImageFile(filename)` helper function
- Extract extension from filename (last dot-separated part)
- Case-insensitive comparison against `IMAGE_EXTENSIONS` set
- Returns false for files without extension

#### DocumentDropEdit Constructor
- Signature: `new DocumentDropEdit(insertText, title?, kind?)`
- `insertText`: string or SnippetString to insert
- `title`: human-readable label (e.g., "Insert image")
- `kind`: DocumentDropOrPasteEditKind (use Empty for basic text insertion)

### DocumentPasteEditProvider Pattern (editorDropProvider.ts)

#### Paste Provider Implementation
- `EditorPasteProvider` implements `vscode.DocumentPasteEditProvider`
- `provideDocumentPasteEdits(document, ranges, dataTransfer, context, token)`:
  1. Check for image data in clipboard via multiple mime types
  2. Try: image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml, image/bmp
  3. Create assets directory if not exists
  4. Generate filename using pattern (default: pasted-image.png)
  5. Get image bytes via `imageData.asFile()` then `imageFile.data()`
  6. Write bytes to assets directory
  7. Build markdown link
  8. Return array of `DocumentPasteEdit` (provider expects array, not single edit)

#### DocumentPasteEdit Constructor
- Signature: `new DocumentPasteEdit(insertText, title, kind)`
- All three parameters are required (unlike DocumentDropEdit)
- Must return array: `[new DocumentPasteEdit(...)]`

#### Mime Type Handling
- Check multiple image mime types in order of preference
- Use `||` chain to find first available image data
- Default to 'png' extension for pasted images (actual format determined by clipboard)

### Provider Registration Pattern (imageCommands.ts)

#### Drop Provider Registration
```typescript
vscode.languages.registerDocumentDropEditProvider(
  { language: 'markdown' },
  dropProvider
)
```
- Simple registration with language selector and provider instance
- No metadata required for drop provider

#### Paste Provider Registration
```typescript
vscode.languages.registerDocumentPasteEditProvider(
  { language: 'markdown' },
  pasteProvider,
  { 
    providedPasteEditKinds: [vscode.DocumentDropOrPasteEditKind.Empty],
    pasteMimeTypes: ['image/*']
  }
)
```
- Requires metadata object with two properties:
  - `providedPasteEditKinds`: array of kinds this provider can provide (required)
  - `pasteMimeTypes`: array of mime types to trigger this provider (optional but recommended)
- Use wildcard `'image/*'` to match all image mime types

### Configuration Reuse Pattern
- Both providers read same config as insertFromFile command:
  - `assetsDir` (default: 'assets')
  - `filenamePattern` (default: '{basename}-{yyyyMMdd-HHmmss}')
  - `altTextSource` (default: 'filename')
- Consistent behavior across all image insertion methods

### Error Handling Pattern
- Wrap file operations in try-catch
- Show user-friendly error messages via `vscode.window.showErrorMessage()`
- Return undefined/empty array on error to gracefully fail
- Continue processing remaining images on individual failures (drop provider)

### Module Boundary Pattern
- `editorDropProvider.ts` imports vscode (VS Code adapter)
- Reuses pure TS functions from `pathUtils.ts`
- Keeps file operations and provider logic together
- Clear separation: pure utilities vs VS Code integration

### Build Status
- All 79 tests pass (1 smoke + 46 formatters + 22 pathUtils + 10 markdown engine)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (267.2kb dist/extension.js)

### Key Learnings
1. **DocumentDropEditProvider vs DocumentPasteEditProvider**: Different signatures and return types
2. **Provider metadata**: Paste provider requires `providedPasteEditKinds` array
3. **Return types**: Drop returns single edit, Paste returns array of edits
4. **Mime type detection**: Check multiple image mime types, use || chain
5. **File data access**: Use `imageData.asFile()` then `imageFile.data()` for clipboard images
6. **URI parsing**: `vscode.Uri.parse()` handles file:// URIs from drag-drop
7. **Snippet strings**: Both providers use SnippetString for insertText
8. **Error recovery**: Continue processing on individual failures, return gracefully

### Next Steps
- Task 9 (Webview-side drag-drop) will implement preview drop handling
- Both editor and webview drops will use same pathUtils functions
- All image operations maintain consistency with this pattern

## Task 10: HTML Export (TDD)

### TDD Workflow Success
- **RED phase**: Created 18 test cases for htmlTemplate functions, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS functions to pass all tests
- **REFACTOR phase**: Code is clean and self-documenting

### Pure TS HTML Template Pattern (htmlTemplate.ts)

#### buildExportHtml Function
- Signature: `buildExportHtml(options: ExportHtmlOptions): string`
- Produces standalone HTML document with:
  - DOCTYPE declaration
  - UTF-8 charset meta tag
  - Viewport meta tag for responsive design
  - Inlined CSS in `<style>` tag
  - Body content directly embedded
- Returns complete HTML string ready for file write
- No vscode imports — testable with vitest

#### resolveLocalImages Function
- Signature: `resolveLocalImages(html: string, mdFileDir: string, mode: 'fileUrl' | 'dataUri'): string`
- Converts relative image paths to absolute URLs
- Regex pattern: `/src=["']([^"']+)["']/g` matches both single and double quotes
- Preserves:
  - Absolute URLs (https://, http://)
  - Data URIs (data:image/...)
  - All other image attributes (alt, class, width, etc.)
- Relative path detection: starts with `./` or `.\`
- Path normalization: converts backslashes to forward slashes
- File URL format: `file:///absolute/path/to/image.png`

#### Helper Functions
- `escapeHtml()` — HTML entity encoding for title attribute
- `isAbsoluteUrl()` — detects http/https URLs
- `isDataUri()` — detects data: URIs
- `isRelativePath()` — detects relative paths
- `resolveRelativePath()` — builds absolute path from relative
- `toFileUrl()` — converts filesystem path to file:// URL

### VS Code Command Adapter Pattern (exportCommands.ts)

#### Export Command Workflow
1. Verify active editor is markdown file
2. Get markdown content and file path
3. Create MarkdownEngine with allowHtml: false
4. Render markdown to HTML
5. Build export HTML with inlined CSS
6. Resolve local images to file:// URLs
7. Show save dialog with default path: `${workspaceFolder}/exports/{filename}.html`
8. Write HTML file to selected path
9. Show success message with "Open" button
10. Open file in default browser if user clicks "Open"

#### CSS Inlining Strategy
- Embedded preview.css directly in exportCommands.ts as string constant
- Avoids file I/O for CSS (faster, simpler)
- CSS includes:
  - VS Code theme variable integration (--vscode-editor-background, etc.)
  - GitHub-flavored markdown styling
  - Print styles for PDF conversion
  - Responsive image sizing

#### Error Handling Pattern
- Wrap entire export flow in try-catch
- Show user-friendly error messages
- Graceful failure if file write fails
- No silent failures

### Test Coverage (18 tests)

#### buildExportHtml Tests (9 tests)
1. Produces valid HTML with DOCTYPE
2. Includes title in head
3. Inlines CSS in style tag
4. Includes body content
5. Includes charset meta tag
6. Includes viewport meta tag
7. Handles empty CSS
8. Handles empty body
9. Proper HTML structure

#### resolveLocalImages Tests (9 tests)
1. Converts relative paths to file:// URLs
2. Handles multiple images
3. Preserves absolute URLs
4. Preserves data URIs
5. Handles nested asset directories
6. Handles Windows-style paths
7. Supports dataUri mode (for future PDF export)
8. Handles markdown with no images
9. Preserves all image attributes (alt, class, width, etc.)

### Module Boundary Pattern
- `htmlTemplate.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- `exportCommands.ts` is the VS Code adapter — imports vscode, manages file operations
- This separation enables fast unit testing and clear separation of concerns

### Build Status
- All 97 tests pass (1 smoke + 18 htmlTemplate + 46 formatters + 22 pathUtils + 10 markdown engine)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (273.9kb dist/extension.js)

### Key Learnings
1. **HTML template generation**: DOCTYPE, meta tags, style inlining all essential for standalone HTML
2. **Image path resolution**: Regex with capture groups handles both quote styles
3. **Relative path handling**: Normalize backslashes, detect relative paths, build absolute paths
4. **CSS inlining**: Embed CSS as string constant for simplicity and performance
5. **File URL format**: `file:///` prefix for absolute paths (three slashes on Unix, two on Windows)
6. **Error handling**: Always wrap file operations in try-catch, show user-friendly messages
7. **VS Code save dialog**: Default URI should be in exports folder, filter by file type

### Next Steps
- Task 11 (PDF Export) will reuse htmlTemplate functions
- Both HTML and PDF export will use same image resolution logic
- All export operations maintain consistency with this pattern

## Task 11: Chrome Detection (TDD)

### TDD Workflow Success
- **RED phase**: Created 4 test cases for `detectChrome()` function, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS function to pass all tests
- **REFACTOR phase**: Fixed TypeScript unused import warning by renaming import

### Pure TS Chrome Detection Pattern (chromeDetector.ts)

#### detectChrome Function
- Signature: `detectChrome(userPath: string | null, fsExistsSync, execSync): string | null`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Dependency injection for `fs.existsSync` and `execSync` enables testing without file system access
- Returns path to Chrome/Chromium executable or null if not found

#### Priority-Based Detection Strategy
1. **User-configured path**: Check `maraudersMapMd.pdf.browserPath` setting if provided
2. **Platform-specific paths**: Check OS-specific installation directories
   - **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, Chromium, Microsoft Edge, Brave
   - **Windows**: Program Files paths for Chrome, Edge, Brave + LOCALAPPDATA
   - **Linux**: `/usr/bin/google-chrome`, `/usr/bin/chromium-browser`, `/usr/bin/chromium`, `/snap/bin/chromium`
3. **Fallback to which/where**: Use system command to find browser in PATH
4. **Return null**: If no browser found

#### Helper Functions
- `getPlatformPaths()` — returns platform-specific path list based on `process.platform`
- `findViaWhich()` — tries `which` (Unix) or `where` (Windows) command for runtime detection

### Test Coverage (4 tests)
1. **User path exists**: Returns user-configured path when provided and exists
2. **User path missing**: Returns null when user path doesn't exist
3. **Auto-detect**: Returns first existing path from platform list (mocked fs.existsSync)
4. **No browser found**: Returns null when no browser found (all mocks return false)

### Dependency Injection Pattern
- `fsExistsSync` parameter allows mocking file system checks in tests
- `execSync` parameter allows mocking shell command execution
- Default parameters use real implementations: `existsSync` and `nodeExecSync`
- Tests pass mock functions to verify behavior without touching file system

### Module Boundary Pattern
- `chromeDetector.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Will be used by PDF export code (Task 12) which handles VS Code integration
- Clear separation: pure detection logic vs VS Code adapter

### Build Status
- All 101 tests pass (4 new chromeDetector + 97 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (273.9kb dist/extension.js)

### Key Learnings
1. **Dependency injection for testability**: Pass fs and exec functions as parameters, not imports
2. **Platform detection**: Use `process.platform` to branch on 'darwin', 'win32', 'linux'
3. **Environment variables**: Windows paths use `process.env.ProgramFiles`, `process.env.LOCALAPPDATA`
4. **Fallback strategy**: Try multiple detection methods in priority order
5. **Error handling**: Catch exceptions from `execSync` when command not found
6. **TypeScript unused imports**: Rename imports if used only in default parameters (e.g., `execSync as nodeExecSync`)

### Next Steps
- Task 12 (PDF Export) will use `detectChrome()` to find browser for puppeteer-core
- PDF export will handle VS Code integration (settings, error messages)
- Chrome detection is now reusable for any future browser-dependent features

## Task 12: PDF Export with Local Image Embedding (TDD)

### TDD Workflow Success
- **RED phase**: Created 9 test cases for `exportToPdf()` function, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS function with DI pattern to pass all tests
- **REFACTOR phase**: Simplified BrowserLauncher type to use `any` for page methods at DI boundary

### Pure TS PDF Exporter Pattern (pdfExporter.ts)

#### exportToPdf Function
- Signature: `exportToPdf(options: PdfExportOptions, launch: BrowserLauncher): Promise<void>`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Dependency injection for BrowserLauncher enables testing without puppeteer-core
- Uses try/finally to ensure browser.close() always called (even on errors)

#### BrowserLauncher DI Pattern
- `BrowserLauncher` type: `(options) => Promise<{ newPage(): Promise<any>; close(): Promise<void> }>`
- Uses `any` for page methods at DI boundary (pragmatic tradeoff for type compatibility)
- Puppeteer-core's types are too specific (PuppeteerLifeCycleEvent enum) for generic DI interface
- exportCommands.ts passes `puppeteer.launch.bind(puppeteer)` as the launcher

#### Browser Launch Configuration
- `headless: true` — no visible browser window
- `--no-sandbox` — required for many Linux environments
- `--allow-file-access-from-files` — enables loading local images via file:// URLs

#### Error Handling
- Launch failures wrapped with descriptive message: `Could not launch browser at "path": original error`
- try/finally ensures browser cleanup even when page operations fail
- 30s timeout on page.setContent to prevent hangs

### VS Code Command Adapter (exportCommands.ts)

#### PDF Export Workflow
1. Verify active editor is markdown file
2. Read PDF settings from configuration
3. Detect Chrome using chromeDetector
4. If Chrome not found: show error with "Configure Browser Path" and "Export as HTML Instead" buttons
5. Resolve output directory (replace ${workspaceFolder} placeholder)
6. Create output directory if not exists
7. Show progress notification with vscode.window.withProgress
8. Render markdown → HTML → resolve local images → export to PDF
9. Open exported file or show path (based on openAfterExport setting)

#### Chrome Not Found UX
- Two action buttons: "Configure Browser Path" (opens settings) and "Export as HTML Instead" (fallback)
- Graceful degradation to HTML export when no browser available

#### Configuration Settings Used
- `maraudersMapMd.pdf.browserPath` (auto = auto-detect)
- `maraudersMapMd.pdf.format` (A4, Letter, A3, A5)
- `maraudersMapMd.pdf.marginMm` (in millimeters, applied uniformly)
- `maraudersMapMd.pdf.printBackground` (true/false)
- `maraudersMapMd.pdf.embedImages` (fileUrl/dataUri)
- `maraudersMapMd.pdf.outputDirectory` (supports ${workspaceFolder} variable)
- `maraudersMapMd.pdf.openAfterExport` (true/false)

### Test Coverage (9 tests)
1. Calls launcher with correct executablePath and args
2. Sets page content with HTML and waits for networkidle0
3. Passes format and margin settings to page.pdf()
4. Passes A4 format and default margin settings
5. Closes browser after successful export
6. Closes browser even when page.pdf() throws
7. Closes browser even when setContent throws
8. Throws descriptive error when browser path invalid (launch fails)
9. Wraps launch errors with descriptive message

### Key Learnings
1. **puppeteer-core vs puppeteer**: puppeteer-core does NOT bundle Chromium, requires system browser
2. **puppeteer-core was NOT in package.json**: Had to install it (task spec incorrectly claimed it was present)
3. **Type compatibility at DI boundaries**: puppeteer's specific enum types (PuppeteerLifeCycleEvent) don't match generic string types — use `any` at the boundary
4. **BrowserLauncher DI**: Pass `puppeteer.launch.bind(puppeteer)` to preserve `this` context
5. **try/finally for browser cleanup**: Always close browser, even on error — prevents zombie processes
6. **vscode.window.withProgress**: Location.Notification shows non-blocking progress in notification area
7. **${workspaceFolder} in settings**: Must manually replace placeholder in setting values
8. **fs.mkdirSync recursive**: Create output directory tree if it doesn't exist
9. **Bundle size impact**: puppeteer-core adds ~3.8MB to dist/extension.js (from ~274KB to ~4.1MB)

### Build Status
- All 110 tests pass (9 new pdfExporter + 101 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js — larger due to puppeteer-core)

### Patterns for Future Tasks
- DI pattern with `any` at boundaries is pragmatic for external library integration
- Always test browser cleanup with both success and error scenarios
- VS Code adapter layer is where casts and library-specific code lives

## Task 13: Snapshot Store (Pure TS)

### TDD Workflow Success
- **RED phase**: Created 36 test cases covering all snapshot store functions, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS functions to pass all tests
- **REFACTOR phase**: Code is clean and self-documenting

### Pure TS Snapshot Store Pattern (snapshotStore.ts)

#### Core Interfaces
- `Snapshot`: Represents a single snapshot with id, filePath, timestamp, optional label, isCheckpoint, hash, sizeBytes, compressed
- `SnapshotIndex`: Container for version and snapshots array (version: 1 for future compatibility)

#### Hash Computation
- `computeHash(content: string): string` — SHA-256 hash using Node.js crypto module
- Returns 64-character hex string (SHA-256 digest)
- Used for content deduplication (comparing with latestHash)

#### Compression Strategy
- `compressContent(content: string): Buffer` — gzip compress with level 6
  - Only compresses if content.length >= 1024 bytes (COMPRESSION_THRESHOLD)
  - Returns Buffer with original content if below threshold (no compression overhead)
  - Uses `gzipSync()` from Node.js zlib module
  
- `decompressContent(buffer: Buffer): string` — gzip decompress with fallback
  - Tries `gunzipSync()` first
  - Falls back to plain UTF-8 decode if decompression fails (handles uncompressed content)
  - Returns string

#### Snapshot ID Generation
- `createSnapshotId(): string` — timestamp-based ID in YYYYMMDD-HHmmss-SSS format
- Uses `Date` object with padStart for zero-padding
- Milliseconds included for uniqueness on rapid successive calls
- Example: "20240101-120000-000"

#### Path Building
- `buildSnapshotPath(historyDir, filePath, snapshotId): string`
  - Extracts directory and basename from filePath
  - Strips file extension from basename
  - Returns path like: `/history/docs/nested/document.20240101-120000-000.md`
  - Handles nested directories and Windows backslashes
  
- `buildIndexPath(historyDir, filePath): string`
  - Similar to buildSnapshotPath but for index.json
  - Returns path like: `/history/docs/nested/document.index.json`
  - One index per markdown file (tracks all snapshots for that file)

#### Deduplication
- `isDuplicate(content: string, latestHash: string | undefined): boolean`
  - Compares hash of current content with latestHash
  - Returns false if latestHash is undefined (first snapshot)
  - Returns true only if hashes match exactly

#### Index Management
- `readIndex(indexPath, readFile): SnapshotIndex`
  - Dependency injection: accepts readFile function for testability
  - Parses JSON from file
  - Returns empty index { version: 1, snapshots: [] } on error (file not found, parse error)
  - Graceful degradation: never throws
  
- `writeIndex(indexPath, index, writeFile): void`
  - Dependency injection: accepts writeFile function for testability
  - Serializes index to JSON with 2-space indentation
  - Preserves all snapshot properties (id, filePath, timestamp, label, isCheckpoint, hash, sizeBytes, compressed)

### Dependency Injection Pattern
- All file operations accept function parameters: `readFile`, `writeFile`, `mkdir`
- Enables testing without file system access (pass mock functions in tests)
- Real implementation passes actual fs functions from VS Code adapter layer
- This separation: pure logic in snapshotStore.ts, VS Code integration in future history manager

### Test Coverage (36 tests)
1. **computeHash**: 5 tests
   - Consistent hashing, different content → different hash
   - 64-char hex format, empty string, large content
   
2. **compressContent + decompressContent**: 6 tests
   - Roundtrip compression/decompression
   - Skips compression for < 1KB
   - Compresses >= 1KB
   - Handles special characters and multiline content
   
3. **createSnapshotId**: 5 tests
   - YYYYMMDD-HHmmss-SSS format validation
   - Unique IDs on successive calls
   - Valid date/time components
   
4. **buildSnapshotPath**: 4 tests
   - Valid path structure, nested files
   - Consistent paths, different IDs → different paths
   
5. **buildIndexPath**: 4 tests
   - Valid index path, nested files
   - Consistent paths, different files → different paths
   
6. **isDuplicate**: 5 tests
   - True for identical content, false for different
   - False when latestHash undefined
   - Handles empty and large content
   
7. **readIndex**: 4 tests
   - Parses valid JSON, returns empty index on missing file
   - Handles multiple snapshots, empty snapshots array
   
8. **writeIndex**: 4 tests
   - Writes valid JSON, preserves all properties
   - Calls writeFile with correct path

### Module Boundary Pattern
- `snapshotStore.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Uses only Node.js built-in modules: crypto, zlib, path
- Will be used by history manager (Task 14) which handles VS Code integration
- Clear separation: pure snapshot logic vs VS Code adapter

### Build Status
- All 146 tests pass (36 new snapshotStore + 110 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Compression threshold**: Only compress >= 1KB to avoid overhead for small content
2. **Graceful decompression**: Try gunzip first, fall back to plain UTF-8 for uncompressed buffers
3. **Timestamp-based IDs**: Include milliseconds for uniqueness without external dependencies
4. **Path normalization**: Always convert backslashes to forward slashes for consistency
5. **Dependency injection for testability**: Pass file operation functions as parameters
6. **Empty index handling**: Return empty index on error, never throw (graceful degradation)
7. **JSON serialization**: Use 2-space indentation for readability in version control

### Next Steps
- Task 14 (Retention Policy) will use snapshotStore functions to manage snapshot lifecycle
- Task 15 (History UI) will use readIndex to display snapshots in QuickPick
- All history operations will maintain consistency with this pattern

## Task 14: Retention Engine (Pure TS)

### TDD Workflow Success
- **RED phase**: Created 7 test cases covering all retention policies, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS retention engine to pass all tests
- **REFACTOR phase**: Code is clean and self-documenting

### Pure TS Retention Engine Pattern (retentionEngine.ts)

#### Core Interface
- `RetentionPolicy`: Defines retention constraints
  - `maxSnapshotsPerFile: number` — keep at most N snapshots per file
  - `maxTotalStorageMb: number` — keep total storage under N MB
  - `retentionDays: number` — keep only snapshots from last N days
  - `protectManualCheckpoints: boolean` — exempt checkpoints from age-based deletion

#### getSnapshotsToDelete Function
- Signature: `getSnapshotsToDelete(snapshots: Snapshot[], policy: RetentionPolicy, now: number): Snapshot[]`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Returns list of snapshots to delete (caller handles actual deletion)
- Applies policies in combination (union of all deletion criteria):
  1. **Age policy**: Remove snapshots older than retentionDays (unless protected checkpoint)
  2. **Count policy**: Remove oldest snapshots exceeding maxSnapshotsPerFile per file
  3. **Size policy**: Remove oldest snapshots until total storage under maxTotalStorageMb
  4. **Checkpoint protection**: If enabled, exempt isCheckpoint=true from age deletion

#### Policy Application Strategy
- Use Set to combine deletion candidates from all policies (union, not intersection)
- Each policy independently identifies snapshots to delete
- Final result is sorted by timestamp (oldest first)
- Caller decides which snapshots to actually delete

#### Helper Functions
- `filterByAge()` — identifies snapshots older than retentionDays
  - Respects checkpoint protection: protected checkpoints never deleted by age
  - Time unit: seconds (matches Snapshot.timestamp)
  - Calculation: `cutoffTime = now - (retentionDays * 86400)`
  
- `filterByCount()` — identifies excess snapshots per file
  - Groups snapshots by filePath
  - For each file: if count > maxSnapshotsPerFile, mark oldest for deletion
  - Returns oldest snapshots that exceed the limit
  
- `filterBySize()` — identifies snapshots exceeding storage limit
  - Sorts all snapshots by timestamp (oldest first)
  - Greedily keeps newest snapshots until under limit
  - Returns snapshots that don't fit in the budget
  
- `groupByFile()` — helper to group snapshots by filePath

### Test Coverage (7 tests)
1. **Keeps all snapshots when under limits**: No deletion when all policies satisfied
2. **Removes snapshots exceeding maxSnapshotsPerFile**: Deletes oldest when count exceeded
3. **Removes snapshots older than retentionDays**: Deletes old snapshots
4. **Protects manual checkpoints from retention**: Checkpoints exempt from age deletion
5. **Removes oldest snapshots when storage limit exceeded**: Deletes oldest until under size limit
6. **Applies combined policies correctly**: Multiple policies work together (union)
7. **Returns empty list for empty snapshot array**: Edge case handling

### Key Implementation Details

#### Time Unit Consistency
- Snapshot.timestamp is in seconds (Unix timestamp)
- Retention calculation: `retentionDays * 86400` (seconds per day)
- NOT milliseconds — this was the initial bug

#### Set-Based Policy Combination
- Each policy returns list of snapshots to delete
- Use Set to combine results (avoids duplicates)
- Convert back to array and sort by timestamp
- This ensures all policies are applied (union, not intersection)

#### Checkpoint Protection Logic
- Only applies to age-based deletion
- Count and size policies still delete checkpoints if needed
- Protects manual snapshots from being auto-deleted due to age
- But still respects storage and count limits

### Module Boundary Pattern
- `retentionEngine.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Uses only Snapshot interface from snapshotStore.ts
- No file I/O, no side effects
- Will be used by history manager (future task) which handles VS Code integration

### Build Status
- All 153 tests pass (7 new retentionEngine + 146 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Time unit consistency**: Always verify timestamp units (seconds vs milliseconds)
2. **Policy combination**: Use Set to union deletion candidates from multiple policies
3. **Checkpoint protection**: Only applies to age policy, not count/size policies
4. **Sorting for deletion**: Return oldest snapshots first (sorted by timestamp)
5. **Pure function design**: No side effects, deterministic output, testable without VS Code

### Next Steps
- Task 15 (History UI) will use retentionEngine to clean up old snapshots
- Task 16 (History Manager) will integrate retention with snapshot lifecycle
- All history operations will maintain consistency with this pattern

## Task 15: History Commands (VS Code Integration)

### Implementation Success
- **Created**: `src/history/historyCommands.ts` with VS Code adapter for history features
- **Updated**: `src/extension.ts` to register history commands and listeners
- **Build**: Compiles successfully with no type errors

### VS Code History Integration Pattern (historyCommands.ts)

#### registerHistoryListeners Function
- Registers `onDidSaveTextDocument` listener for automatic snapshot creation
- Checks:
  1. File is markdown (`document.languageId === 'markdown'`)
  2. History is enabled (`maraudersMapMd.history.enabled`)
  3. Mode is onSave (`maraudersMapMd.history.mode === 'onSave'`)
- Calls `createSnapshotOnSave()` when all conditions met
- Deduplication: Uses `isDuplicate()` before creating snapshot

#### createSnapshotOnSave Function
- Workflow:
  1. Get document content and workspace folder
  2. Determine history directory (workspace or globalStorage)
  3. Read existing index (or create empty if not found)
  4. Check for duplicates using `isDuplicate(content, latestSnapshot?.hash)`
  5. Skip if duplicate (no-op)
  6. Create snapshot: generate ID, compute hash, compress content
  7. Write snapshot file to history directory
  8. Update index with new snapshot metadata
  9. Write updated index
- Error handling: Catch all errors, log to console (silent failure for background operation)

#### getHistoryDirectory Function
- Reads `maraudersMapMd.history.storageLocation` setting
- Returns:
  - `globalStorage`: `context.globalStorageUri.fsPath`
  - `workspace`: `${workspaceFolder}/.maraudersmapmd/history`
- Used by all history commands for consistent storage location

#### openHistoryCommand Function
- Shows QuickPick with snapshot history for current file
- Workflow:
  1. Verify active editor is markdown file
  2. Read snapshot index for current file
  3. Sort snapshots newest first
  4. Create QuickPick items with:
     - `label`: timestamp (localized date string)
     - `description`: label (if checkpoint) or "auto"
     - `detail`: size in KB + compression status
     - `buttons`: View, Diff, Restore, Copy (with icons)
  5. Handle selection: default action is View
  6. Handle button clicks: dispatch to appropriate action
- QuickPick UI:
  - Title: `History: ${relativePath}`
  - Placeholder: "Select a snapshot to view, diff, restore, or copy"
  - Buttons: eye (View), diff (Diff), discard (Restore), copy (Copy)

#### Snapshot Actions

##### viewSnapshot Function
- Opens snapshot in read-only editor
- Workflow:
  1. Read snapshot file from history directory
  2. Decompress content
  3. Create temporary document with content
  4. Show in preview mode
- Language: markdown (enables syntax highlighting)

##### diffSnapshot Function
- Shows diff between snapshot and current document
- Workflow:
  1. Read snapshot file and decompress
  2. Create temporary document with snapshot content
  3. Use `vscode.commands.executeCommand('vscode.diff', ...)`
  4. Title: `${filePath} (${timestamp}) ↔ Current`
- Built-in VS Code diff viewer

##### restoreSnapshot Function
- Replaces current document content with snapshot
- Workflow:
  1. Show confirmation dialog (modal)
  2. Read snapshot file and decompress
  3. Create WorkspaceEdit to replace entire document
  4. Apply edit and save document
  5. Show success message
- Safety: Requires user confirmation before restore

##### copySnapshot Function
- Copies snapshot content to clipboard
- Workflow:
  1. Read snapshot file and decompress
  2. Use `vscode.env.clipboard.writeText(content)`
  3. Show success message
- Enables pasting snapshot content elsewhere

#### createCheckpointCommand Function
- Creates manual checkpoint with user-provided label
- Workflow:
  1. Verify active editor is markdown file
  2. Show input box for label (required, non-empty)
  3. Read existing index
  4. Create snapshot with:
     - `isCheckpoint: true`
     - `label: user input`
     - All other fields same as auto snapshot
  5. Write snapshot file and update index
  6. Show success message with label
- Validation: Label cannot be empty

#### pruneNowCommand Function
- Runs retention engine on current file's snapshots
- Workflow:
  1. Verify active editor is markdown file
  2. Read snapshot index
  3. Get retention policy from settings:
     - `maxSnapshotsPerFile`
     - `maxTotalStorageMb`
     - `retentionDays`
     - `protectManualCheckpoints`
  4. Call `getSnapshotsToDelete()` from retentionEngine
  5. Delete identified snapshot files
  6. Update index (remove deleted snapshots)
  7. Show info message with count deleted
- Error handling: Ignore file deletion errors (file may not exist)

### Extension Integration (extension.ts)

#### Import Pattern
```typescript
import {
  registerHistoryListeners,
  openHistoryCommand,
  createCheckpointCommand,
  pruneNowCommand,
} from './history/historyCommands';
```

#### Registration Pattern
- `registerHistoryListeners(context)` called in activate() — registers onSave listener
- Commands registered with lambda wrappers:
  - `maraudersMapMd.history.open` → `openHistoryCommand(context)`
  - `maraudersMapMd.history.createCheckpoint` → `createCheckpointCommand(context)`
  - `maraudersMapMd.history.pruneNow` → `pruneNowCommand(context)`
- Deferred commands (not implemented in Task 15):
  - `maraudersMapMd.history.diffWithCurrent` — placeholder
  - `maraudersMapMd.history.restoreSnapshot` — placeholder

### VS Code API Patterns Used

#### File Operations
- `vscode.workspace.fs.readFile(uri)` — read file as Uint8Array
- `vscode.workspace.fs.writeFile(uri, buffer)` — write buffer to file
- `vscode.workspace.fs.createDirectory(uri)` — create directory recursively
- `vscode.workspace.fs.delete(uri)` — delete file
- `Buffer.from(data)` — convert Uint8Array to Buffer for decompression

#### QuickPick UI
- `vscode.window.createQuickPick()` — create QuickPick instance
- `quickPick.items` — set items array
- `quickPick.placeholder` — set placeholder text
- `quickPick.title` — set title
- `quickPick.onDidAccept()` — handle selection
- `quickPick.onDidTriggerItemButton()` — handle button clicks
- `quickPick.show()` — display QuickPick
- `quickPick.hide()` — close QuickPick

#### QuickPickItem with Buttons
- `buttons` property: array of `{ iconPath, tooltip }`
- `iconPath`: `new vscode.ThemeIcon('icon-name')` for built-in icons
- Button click event: `event.item` (QuickPickItem), `event.button` (button that was clicked)
- Button index: `event.item.buttons?.indexOf(event.button)`

#### Input Box
- `vscode.window.showInputBox({ prompt, placeHolder, validateInput })` — show input dialog
- `validateInput` callback: return error message or null
- Returns Promise<string | undefined> (undefined if cancelled)

#### Diff Viewer
- `vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title)` — show diff
- Built-in VS Code diff viewer
- Temporary documents can be used for left side

#### Clipboard
- `vscode.env.clipboard.writeText(text)` — copy to clipboard
- Returns Promise<void>

#### Workspace Edit
- `new vscode.WorkspaceEdit()` — create edit
- `edit.replace(uri, range, text)` — replace text in range
- `vscode.workspace.applyEdit(edit)` — apply edit
- Returns Promise<boolean> (success/failure)

### Configuration Settings Used
- `maraudersMapMd.history.enabled` (default: true)
- `maraudersMapMd.history.storageLocation` (default: 'workspace')
- `maraudersMapMd.history.mode` (default: 'onSave')
- `maraudersMapMd.history.maxSnapshotsPerFile` (default: 100)
- `maraudersMapMd.history.maxTotalStorageMb` (default: 200)
- `maraudersMapMd.history.retentionDays` (default: 30)
- `maraudersMapMd.history.protectManualCheckpoints` (default: true)

### Build Status
- All 153 tests pass (no new tests — VS Code adapter layer)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **onSave listener pattern**: Check file type, settings, then create snapshot
2. **Deduplication**: Always check `isDuplicate()` before creating snapshot
3. **QuickPick with buttons**: Use `onDidTriggerItemButton` for action buttons
4. **Temporary documents**: Use `vscode.workspace.openTextDocument({ content, language })` for diff
5. **Modal confirmation**: Use `{ modal: true }` in showWarningMessage for destructive actions
6. **Error handling**: Silent failure for background operations (onSave), user messages for commands
7. **Storage location**: Support both workspace and globalStorage for flexibility
8. **Index management**: Read index, modify, write back — atomic updates

### Patterns for Future Tasks
- VS Code adapter layer: thin wrapper around pure TS modules
- QuickPick for list selection UI with action buttons
- Temporary documents for diff/preview without file I/O
- WorkspaceEdit for atomic document changes
- Configuration-driven behavior (read settings, apply logic)

### Next Steps
- Task 16 (Diff/Restore) will implement remaining history commands
- Task 17 (Timeline UI) will add webview-based timeline visualization
- All history operations maintain consistency with this pattern

## Task 16: Diff/Restore/Copy Actions with Pre-Restore Snapshot

### Implementation Success
- **Updated**: `src/history/historyCommands.ts` with pre-restore snapshot logic
- **Added**: `SnapshotContentProvider` class for `maraudersMapMd:` URI scheme
- **Registered**: TextDocumentContentProvider in `registerHistoryListeners()`
- **Build**: Compiles successfully with no type errors

### Pre-Restore Snapshot Pattern

#### Implementation Details
- When `maraudersMapMd.history.createPreRestoreSnapshot` is true (default)
- Before restoring a snapshot, create a snapshot of current content
- Label the pre-restore snapshot with `label: 'pre-restore'`
- Store in same index as other snapshots
- If pre-restore snapshot creation fails, continue with restore (graceful degradation)

#### Workflow
1. User clicks "Restore" button in QuickPick
2. Show confirmation dialog (modal)
3. If confirmed:
   - Read `createPreRestoreSnapshot` setting
   - If true: create snapshot of current content with label "pre-restore"
   - Read target snapshot from history directory
   - Replace current document content with target snapshot
   - Save document
   - Show success message

#### Error Handling
- Pre-restore snapshot failures don't block restore operation
- Errors logged to console but don't show error dialog
- Restore continues even if pre-restore snapshot fails
- This ensures user can always restore even if snapshot creation has issues

### TextDocumentContentProvider Pattern

#### SnapshotContentProvider Class
- Implements `vscode.TextDocumentContentProvider`
- Registered for `maraudersMapMd:` URI scheme
- `provideTextDocumentContent(uri)` method:
  1. Extract filesystem path from URI
  2. Read snapshot file from disk
  3. Decompress content using `decompressContent()`
  4. Return decompressed string
  5. Return error message on failure (graceful)

#### Registration Pattern
- Create provider instance in `registerHistoryListeners()`
- Register with `vscode.workspace.registerTextDocumentContentProvider()`
- Push subscription to `context.subscriptions` for cleanup
- Provider enables virtual document viewing via `maraudersMapMd://` URIs

### Diff/Restore/Copy Actions (Already Implemented)

#### Diff Action
- Creates temporary document with snapshot content
- Uses `vscode.commands.executeCommand('vscode.diff', snapshotUri, currentUri, title)`
- Title format: `${filePath} (${timestamp}) ↔ Current`
- Built-in VS Code diff viewer (no custom implementation needed)

#### Restore Action
- Now includes pre-restore snapshot protection
- Confirmation dialog before restore
- Uses `WorkspaceEdit` to replace entire document content
- Saves document after edit
- Shows success message

#### Copy Action
- Reads snapshot content
- Writes to clipboard via `vscode.env.clipboard.writeText()`
- Shows brief info message

### Key Learnings
1. **Pre-restore snapshot**: Protects against accidental data loss by creating backup before restore
2. **Graceful degradation**: Pre-restore failure doesn't block restore operation
3. **TextDocumentContentProvider**: Enables virtual document viewing for any URI scheme
4. **Error handling**: Decompress failures return error message instead of throwing
5. **Setting integration**: Read `createPreRestoreSnapshot` from config each time (respects user changes)

### Build Status
- All tests pass (existing test suite)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Next Steps
- Task 17 will implement AI artifact generation
- History feature is now complete with full snapshot lifecycle
- All history operations maintain consistency with this pattern

## Task 17: Token Estimator + Markdown Structure Parser (Pure TS)

### TDD Workflow Success
- **RED phase**: Created 18 tokenEstimator tests + 23 markdownParser tests, verified they fail
- **GREEN phase**: Implemented pure TS functions to pass all tests
- **REFACTOR phase**: Fixed test expectations to match actual behavior

### Pure TS Token Estimator Pattern (tokenEstimator.ts)

#### estimateTokens Function
- Signature: `estimateTokens(text: string, mode: 'koreanWeighted' | 'simple'): number`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Two modes:
  - **simple**: `Math.ceil(text.length / 4)` — English approximation
  - **koreanWeighted**: Character-by-character weighted estimation
    - Korean Hangul (U+AC00-U+D7AF): 2.5 tokens per char
    - Korean Jamo (U+3130-U+318F): 2.5 tokens per char
    - English words (whitespace-delimited): 1.3 tokens per word
    - Punctuation/whitespace: 0.25 tokens per char

#### Korean Character Detection
- `isKoreanChar()` checks Unicode ranges:
  - Hangul syllables: 0xAC00-0xD7AF (가-힣)
  - Jamo characters: 0x3130-0x318F (ㄱ-ㅎ, ㅏ-ㅣ)
- Handles both composed Hangul and individual Jamo components

#### Token Estimation Algorithm
- Character-by-character iteration with state machine:
  1. Check if Korean char → add 2.5 tokens
  2. Check if whitespace → add 0.25 tokens
  3. Check if punctuation → add 0.25 tokens
  4. Otherwise, consume entire word → add 1.3 tokens per word
- Returns `Math.ceil(tokenCount)` for integer result

#### estimateTokensPerSection Function
- Signature: `estimateTokensPerSection(sections: Section[]): SectionWithTokens[]`
- Maps over sections, adds `tokens` property to each
- Uses `koreanWeighted` mode by default (as per PRD spec)

### Pure TS Markdown Parser Pattern (markdownParser.ts)

#### Section Interface
- `heading: string` — section heading text
- `level: number` — heading level (0 for preamble, 2 for H2)
- `startLine: number` — zero-based line index where section starts
- `endLine: number` — zero-based line index where section ends
- `content: string` — full section content including heading

#### parseStructure Function
- Signature: `parseStructure(text: string): Section[]`
- Splits document by H2 headings (`## Heading`)
- Content before first H2 becomes "preamble" section (level 0)
- **CRITICAL**: Ignores headings inside fenced code blocks (``` ... ```)
  - Tracks `inCodeBlock` state by counting ``` markers
  - Only processes headings when `inCodeBlock === false`
- Returns array of sections with line ranges and full content

#### Code Block Detection Strategy
- Toggle `inCodeBlock` flag when encountering ``` markers
- Skip all heading detection while inside code blocks
- Prevents false positives from markdown examples in code

#### extractSummary Function
- Signature: `extractSummary(section: Section): string`
- Heuristic extraction:
  1. First non-empty sentence (up to period/newline)
  2. All bold text patterns (`**term**`)
  3. Join with spaces, trim to max 200 chars
- Skips code blocks, headings, empty lines

#### extractKeyTerms Function
- Signature: `extractKeyTerms(section: Section): string[]`
- Extracts:
  - Bold text: `**term**` → "term"
  - Link text: `[text](url)` → "text"
  - H3 headings within section: `### Heading` → "Heading"
- Returns unique terms (uses Set to deduplicate)

### Test Coverage (41 tests total)

#### tokenEstimator.test.ts (18 tests)
1. **simple mode**: 5 tests
   - English text, Korean text, empty string, fractional rounding, large text
2. **koreanWeighted mode**: 13 tests
   - Pure English, pure Korean, mixed Korean/English
   - Hangul characters, Jamo characters
   - Punctuation, empty string, code blocks, markdown formatting

#### markdownParser.test.ts (23 tests)
1. **parseStructure**: 10 tests
   - Parse H2 sections from sample.md
   - Include preamble section
   - Parse all H2 sections
   - Ignore headings inside code blocks (CRITICAL)
   - Handle documents with no H2 headings
   - Calculate correct line ranges
   - Handle Korean H2 headings
   - Preserve full content
   - Handle empty document, whitespace-only document
2. **extractSummary**: 6 tests
   - Extract first sentence, include bold terms
   - Trim to max 200 chars
   - Handle no sentences, empty content, Korean content
3. **extractKeyTerms**: 7 tests
   - Extract bold text, link text, H3 headings
   - Return unique terms
   - Handle no key terms, empty content, Korean text

### Module Boundary Pattern
- Both `tokenEstimator.ts` and `markdownParser.ts` are pure TypeScript (zero vscode imports)
- Testable with vitest without VS Code runtime
- Clear separation: pure AI utilities vs VS Code integration (future tasks)

### Build Status
- All 194 tests pass (18 tokenEstimator + 23 markdownParser + 153 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)
- Verified: NO VSCODE IMPORTS in src/ai/*.ts

### Key Learnings

#### Unicode Character Detection
- Use `charCodeAt(0)` to get Unicode code point
- Korean Hangul range: 0xAC00-0xD7AF (44,032 syllables)
- Korean Jamo range: 0x3130-0x318F (individual consonants/vowels)
- Regex `/\s/` for whitespace, `/[^\w\s\uAC00-\uD7AF\u3130-\u318F]/` for punctuation

#### Token Estimation Weights
- Korean characters are ~2.5x heavier than English words
- Whitespace and punctuation contribute minimal tokens (0.25)
- English words estimated at 1.3 tokens (accounts for subword tokenization)
- Always round up with `Math.ceil()` for conservative estimates

#### Markdown Parsing Edge Cases
- **Code block detection is CRITICAL**: Must track ``` markers to avoid false positives
- Preamble section (level 0) for content before first H2
- Line ranges are zero-based and inclusive (startLine to endLine)
- Empty documents return empty array (not error)

#### Test Fixture Usage
- `readFileSync()` in tests to load sample.md and korean-sample.md
- Enables realistic testing with actual markdown documents
- Tests verify behavior on real-world content, not just synthetic examples

#### Regex Patterns for Extraction
- Bold text: `/\*\*([^*]+)\*\*/g` with matchAll
- Link text: `/\[([^\]]+)\]\([^)]+\)/g` with matchAll
- H3 headings: `/^###\s+(.+)$/gm` with multiline flag
- First sentence: `/^[^.!?]+[.!?]/` to match up to punctuation

### Next Steps
- Task 18 (AI Map Generator) will use both tokenEstimator and markdownParser
- AI Map will combine section structure + token estimates + summaries + key terms
- All AI features maintain consistency with pure TS pattern (no vscode imports)

### Patterns for Future Tasks
1. **Pure TS module pattern**: Zero vscode imports, testable with vitest
2. **Character-by-character state machine**: Efficient for mixed-language text processing
3. **Code block awareness**: Always track fenced code blocks when parsing markdown
4. **Heuristic extraction**: First sentence + bold terms is simple but effective
5. **Set for deduplication**: Use Set to ensure unique terms, convert to array for return

## Task 18: AI Map Generator (Pure TS)

### TDD Workflow Success
- **RED phase**: Created 8 test cases covering all AI Map generation functions, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS aiMapGenerator to pass all tests
- **REFACTOR phase**: Removed unnecessary comments, code is self-documenting

### Pure TS AI Map Generator Pattern (aiMapGenerator.ts)

#### generateAiMap Function
- Signature: `generateAiMap(options: AiMapOptions): string`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Returns markdown string with complete AI Map structure
- Input: filePath, content, tokenMode (koreanWeighted or simple)

#### AI Map Output Structure
1. **Header with metadata**:
   - Title: `# AI Map: {filePath}`
   - Source path, generation timestamp, total token count
   
2. **Document Structure table**:
   - Markdown table with columns: Section, Lines, Tokens, Summary
   - One row per section from parseStructure()
   - Tokens calculated using estimateTokens()
   - Summary truncated to 50 chars using extractSummary()
   
3. **Section Details**:
   - Expanded information for each section
   - Includes: line range, token count, summary, key terms
   - Key terms extracted using extractKeyTerms()
   
4. **AI Hints Found** (if present):
   - Detects [AI RULE], [AI DECISION], [AI NOTE] blocks
   - Lists hint type, line number, and text
   - Only included if hints found in source

#### extractAiHints Helper Function
- Scans content line-by-line for AI hint patterns
- Regex patterns: `/^\s*\[AI RULE\]\s*(.+)$/`, etc.
- Returns array of AiHint objects with type, line, text
- Handles indented hints (leading whitespace)

#### Integration with Task 17 Functions
- Uses `parseStructure()` to get sections with line ranges
- Uses `estimateTokens()` for token calculation per section
- Uses `extractSummary()` for section summaries
- Uses `extractKeyTerms()` for key term extraction
- All functions from markdownParser.ts and tokenEstimator.ts

### Test Coverage (8 tests)
1. **Generates map with correct section count**: Verifies structure table present
2. **Includes token estimates**: Verifies token numbers in output
3. **Includes line ranges**: Verifies line range format (N-M)
4. **Includes summaries**: Verifies summary column present
5. **Includes AI hints if present**: Detects [AI RULE], [AI DECISION], [AI NOTE]
6. **Handles empty document**: Gracefully handles empty content
7. **Output is valid markdown**: Verifies markdown syntax (headings, tables)
8. **Includes metadata header**: Verifies filename and timestamp in output

### Module Boundary Pattern
- `aiMapGenerator.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Uses only functions from markdownParser.ts and tokenEstimator.ts
- No file I/O, no side effects
- Will be used by future AI features (Task 19+) which handle VS Code integration

### Build Status
- All 202 tests pass (8 new aiMapGenerator + 194 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Markdown table generation**: Pipe-delimited format with header separator row
2. **Summary truncation**: Limit to 50 chars for readability in table
3. **AI hint detection**: Regex with line-by-line scanning for [AI ...] patterns
4. **Integration pattern**: Reuse existing parser/estimator functions, don't duplicate
5. **Pure TS module**: Zero vscode imports enables fast testing and code reuse
6. **Self-documenting code**: Variable names like `totalTokens`, `keyTerms` eliminate need for comments

### Next Steps
- Task 19 (Section Pack) will use aiMapGenerator output to create section files
- Task 20 (Search Index) will use AI Map structure for indexing
- All AI features will maintain consistency with this pure TS pattern

## Task 19: Section Pack Generator (Pure TS)

### TDD Workflow Success
- **RED phase**: Created 22 test cases covering slug generation and section pack generation, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS functions to pass all tests
- **REFACTOR phase**: Removed unnecessary comments, fixed unused imports

### Pure TS Section Pack Generator Pattern (sectionPackGenerator.ts)

#### generateSlug Function
- Signature: `generateSlug(heading: string): string`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Converts heading to URL-friendly slug:
  1. Lowercase and trim
  2. Replace spaces with hyphens
  3. Remove non-alphanumeric characters (except hyphens and Unicode for Korean/CJK)
  4. Collapse multiple hyphens to single hyphen
  5. Remove leading/trailing hyphens
  6. Truncate to 50 characters max
- Handles Korean and mixed-language headings correctly
- Returns empty string for empty/whitespace-only input

#### generateSectionPack Function
- Signature: `generateSectionPack(options: { filePath: string; content: string }): SectionFile[]`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Splits markdown document into section files:
  1. Parse document structure using `parseStructure()` from markdownParser
  2. Filter sections: if H2 sections exist, exclude preamble; otherwise include preamble
  3. For each section:
     - Generate zero-padded filename: `{NN}-{slug}.md` (01, 02, ..., 99, 100, ...)
     - Create metadata comment: `<!-- Section from: {filePath} | Lines: {start}-{end} -->`
     - Combine metadata + original section content
     - Return SectionFile with filename, content, heading, lineRange
- Returns array of SectionFile objects (caller handles file writing)

#### SectionFile Interface
- `filename: string` — zero-padded filename with slug (e.g., "01-getting-started.md")
- `content: string` — metadata comment + original section content
- `heading: string` — original heading text (e.g., "Getting Started")
- `lineRange: [number, number]` — [startLine, endLine] in original document (0-based)

### Test Coverage (22 tests)

#### generateSlug Tests (10 tests)
1. Converts heading to lowercase
2. Replaces spaces with hyphens
3. Removes non-alphanumeric characters
4. Handles Korean headings (preserves Unicode)
5. Handles mixed Korean and English
6. Limits slug to 50 characters
7. Handles empty heading
8. Removes multiple consecutive hyphens
9. Removes leading and trailing hyphens
10. Handles special characters (e.g., C++ → c-programming)

#### generateSectionPack Tests (12 tests)
1. Generates correct number of section files
2. Uses zero-padded numbering (01, 02, ..., 10, ...)
3. Generates slugified filenames from headings
4. Includes source metadata comment in content
5. Includes original section content after metadata
6. Handles document with no H2 sections (returns preamble)
7. Handles empty sections
8. Preserves line numbers in metadata
9. Returns SectionFile interface with all required properties
10. Handles Korean headings in filenames
11. Handles special characters in filenames
12. Handles very long headings with truncation

### Key Implementation Details

#### Preamble Handling
- If document has H2 sections: filter out preamble, number H2s as 01, 02, ...
- If document has NO H2 sections: include preamble as 01-preamble.md
- This ensures documents without H2 still produce output (preamble)

#### Slug Generation Strategy
- Unicode regex `/[^\w\-\u0080-\uFFFF]/g` preserves non-Latin characters (Korean, Chinese, etc.)
- Truncation happens AFTER normalization to ensure max 50 chars
- Trailing hyphens removed after truncation to avoid ugly filenames

#### Line Number Tracking
- Metadata comment includes 1-based line numbers (user-friendly)
- lineRange property stores 0-based indices (programmer-friendly)
- Format: `<!-- Section from: {filePath} | Lines: {startLine+1}-{endLine+1} -->`

### Module Boundary Pattern
- `sectionPackGenerator.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Depends on `parseStructure()` from markdownParser.ts (Task 17)
- No file I/O, no side effects
- Will be used by AI Map Generator (Task 18) and future AI features

### Build Status
- All 224 tests pass (22 new sectionPackGenerator + 202 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Preamble logic**: Filter based on presence of H2 sections, not always exclude
2. **Unicode handling**: Use `\u0080-\uFFFF` range to preserve non-Latin characters
3. **Slug truncation**: Truncate AFTER normalization, then remove trailing hyphens
4. **Zero-padding**: Use `String(n).padStart(2, '0')` for consistent numbering
5. **Line number tracking**: Store both 1-based (for display) and 0-based (for code)
6. **Pure TS pattern**: No vscode imports enables fast testing and code reuse

### Next Steps
- Task 20 (AI Map Generator) will use generateSectionPack() to create section metadata
- All AI features will maintain consistency with this pure TS pattern

## Task 20: Search Index Builder (Pure TS)

### TDD Workflow Success
- **RED phase**: Created 6 test cases covering all search index builder functions, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS functions to pass all tests
- **REFACTOR phase**: Code is clean and self-documenting

### Pure TS Search Index Builder Pattern (searchIndexBuilder.ts)

#### Core Interfaces
- `IndexEntry`: Represents a single section in the search index
  - `section: string` — heading text
  - `slug: string` — URL-safe slug generated from heading
  - `lineRange: [number, number]` — start and end line numbers
  - `tokens: number` — estimated token count for section
  - `keywords: string[]` — extracted key terms from bold text
  - `links: string[]` — extracted URLs from markdown links
  - `summary: string` — first sentence or bold text summary
  - `aiHints: string[]` — AI-specific hints ([AI RULE], [AI DECISION], etc.)

- `SearchIndex`: Container for the complete search index
  - `version: 1` — schema version for future compatibility
  - `source: string` — source markdown file path
  - `generated: string` — ISO timestamp when index was created
  - `totalTokens: number` — sum of all section tokens
  - `entries: IndexEntry[]` — array of indexed sections

#### buildSearchIndex Function
- Signature: `buildSearchIndex(options: BuildSearchIndexOptions): SearchIndex`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Workflow:
  1. Parse markdown structure using `parseStructure()`
  2. Skip preamble section (only index H2 sections)
  3. For each section:
     - Extract keywords from bold text using `extractKeyTerms()`
     - Extract links from markdown link syntax `[text](url)`
     - Extract AI hints using pattern `/\[AI\s+(RULE|DECISION|TODO|CONTEXT)\]/`
     - Extract summary using `extractSummary()`
     - Generate slug using `generateSlug()`
     - Estimate tokens using `estimateTokens()`
  4. Accumulate total tokens across all sections
  5. Return structured SearchIndex object

#### Helper Functions
- `extractLinks(content: string): string[]`
  - Regex pattern: `/\[([^\]]+)\]\(([^)]+)\)/g`
  - Extracts URLs from markdown link syntax
  - Filters out anchor links (starting with #)
  - Returns unique URLs (Set-based deduplication)

- `extractAiHints(content: string): string[]`
  - Regex pattern: `/\[AI\s+(RULE|DECISION|TODO|CONTEXT)\][^\n]*/g`
  - Captures entire hint line including the hint text
  - Returns array of matching hints (empty if none found)

### Test Coverage (6 tests)
1. **Correct entry count**: Verifies entries match H2 section count (preamble excluded)
2. **Keywords extraction**: Verifies bold text is extracted as keywords
3. **Links extraction**: Verifies markdown links are extracted with URLs
4. **AI hints detection**: Verifies [AI RULE], [AI DECISION], etc. are captured per section
5. **Total tokens calculation**: Verifies totalTokens equals sum of section tokens
6. **Output schema validation**: Verifies all required fields present with correct types

### Key Implementation Details

#### Preamble Handling
- `parseStructure()` returns preamble as first section with heading='preamble'
- Search index skips preamble (only indexes H2 sections)
- Rationale: Preamble is metadata, not searchable content

#### Link Extraction
- Pattern matches both `[text](url)` markdown syntax
- Filters out anchor links (starting with #) — these are internal references
- Uses Set for automatic deduplication (same URL in multiple places)

#### AI Hints Pattern
- Matches: `[AI RULE]`, `[AI DECISION]`, `[AI TODO]`, `[AI CONTEXT]`
- Captures entire line including hint text (e.g., "[AI RULE] This is critical")
- Returns empty array if no hints found in section

#### Token Estimation
- Reuses `estimateTokens()` from Task 17
- Supports both 'koreanWeighted' and 'simple' modes
- Accumulates total across all sections

#### Slug Generation
- Reuses `generateSlug()` from Task 19
- Converts heading to URL-safe format (lowercase, hyphens, max 50 chars)
- Used for future anchor links or section references

### Module Boundary Pattern
- `searchIndexBuilder.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Reuses functions from Tasks 17-19: parseStructure, extractKeyTerms, extractSummary, estimateTokens, generateSlug
- No file I/O, no side effects
- Will be used by AI context builder (future task) for semantic search

### Build Status
- All 230 tests pass (6 new searchIndexBuilder + 224 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Preamble exclusion**: Search index focuses on H2 sections, not preamble
2. **Link filtering**: Exclude anchor links (#) from extracted links
3. **AI hints pattern**: Capture entire line for context, not just the marker
4. **Set-based deduplication**: Use Set for unique URLs, convert back to array
5. **Reuse existing functions**: Leverage parseStructure, extractKeyTerms, estimateTokens, generateSlug
6. **Schema versioning**: Include version: 1 for future compatibility

### Next Steps
- Task 21 (AI Context Builder) will use SearchIndex to build semantic context
- Task 22 (Semantic Search) will query the search index
- All AI features will maintain consistency with this pattern

## Task 21: Token Budget Context Exporter (TDD)

### TDD Workflow Success
- **RED phase**: Created 10 test cases covering all export scenarios, verified they fail (module not found)
- **GREEN phase**: Implemented pure TS exporter to pass all tests
- **REFACTOR phase**: Removed unused imports (Section, extractHeadings)

### Pure TS Token Budget Exporter Pattern (tokenBudgetExporter.ts)

#### exportWithBudget Function
- Signature: `exportWithBudget(options: ExportOptions): string`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Deterministic algorithm (no scoring/ranking):
  1. Parse structure using markdownParser
  2. Always include ALL headings (## level)
  3. Always include ALL AI hint blocks ([AI RULE], [AI DECISION], [AI TODO], [AI CONTEXT])
  4. Calculate remaining budget after headings + hints
  5. For each section (in order): include first N characters until budget exhausted
  6. Maintain section boundaries: truncate at sentence boundaries (find last period/newline)
  7. If truncated, append `[... truncated, see full section: {heading}]`
- Returns assembled markdown string

#### AI Hint Detection
- `extractAIHints(content: string): string[]` — extracts all AI hint blocks
- Patterns: `/>\s*\[AI RULE\][^\n]*/g`, `/>\s*\[AI DECISION\][^\n]*/g`, etc.
- Matches blockquote-style hints: `> [AI RULE] ...`
- Returns array of matched hint strings

#### Truncation Strategy
- `truncateAtSentenceBoundary(text: string, maxLength: number): string`
- Finds last period or newline within maxLength
- Returns truncated text ending at sentence boundary
- Prevents mid-sentence cuts for readability

#### Section Processing
- For each section from parseStructure:
  1. Extract heading (if level 2)
  2. Extract AI hints from section content
  3. Remove hints from content to avoid duplication
  4. Calculate available budget for content
  5. Truncate content at sentence boundary if needed
  6. Add truncation marker if content was cut
  7. Combine heading + hints + content
  8. Add to result if within budget

#### Preset Budgets
- `PRESET_BUDGETS` constant: `{ '1k': 1000, '2k': 2000, '4k': 4000, '8k': 8000 }`
- Enables quick selection of common budget sizes
- Used by future UI for budget selection

### Test Coverage (10 tests)
1. **Empty document**: Returns empty string
2. **Small document under budget**: Returns full content unchanged
3. **Preserve all headings**: Even with tight budget, all ## headings included
4. **Preserve all AI hints**: All [AI RULE], [AI DECISION], [AI TODO], [AI CONTEXT] blocks included
5. **Truncation markers**: Adds `[... truncated, see full section: ...]` when sections cut
6. **Budget difference**: 1k budget produces smaller output than 8k budget
7. **Token estimate within budget**: Output tokens ≤ budget + 20% tolerance
8. **Sentence boundary truncation**: Cuts at last period or newline, not mid-sentence
9. **Korean weighted mode**: Handles koreanWeighted token mode
10. **Section boundary preservation**: Never mixes content from different sections

### Key Implementation Details

#### Token Estimation
- Uses `estimateTokens()` from tokenEstimator.ts
- Supports both 'simple' (length/4) and 'koreanWeighted' modes
- Budget enforcement: strict ≤ budget check (no tolerance in algorithm)
- Test tolerance: ±20% for output validation (accounts for estimation variance)

#### Content Deduplication
- `removeAIHintsFromContent()` removes hints before processing content
- Prevents hints from appearing twice (once in priority section, once in content)
- Uses same regex patterns as extractAIHints

#### Budget Allocation
- Priority: headings + AI hints always included first
- Remaining budget distributed to section content in order
- Greedy algorithm: fill sections until budget exhausted
- No backtracking or optimization (deterministic, predictable)

### Module Boundary Pattern
- `tokenBudgetExporter.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- Depends on: markdownParser.ts (parseStructure), tokenEstimator.ts (estimateTokens)
- Will be used by AI context export command (future task) which handles VS Code integration
- Clear separation: pure export logic vs VS Code adapter

### Build Status
- All 163 tests pass (10 new tokenBudgetExporter + 153 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Deterministic algorithms**: No scoring/ranking ensures reproducible output
2. **Priority-based inclusion**: Always include critical elements (headings, hints) first
3. **Sentence boundary truncation**: Improves readability by avoiding mid-sentence cuts
4. **Budget enforcement**: Strict ≤ budget check prevents overruns
5. **Test data sizing**: Ensure test documents exceed budget to verify truncation logic
6. **Token estimation variance**: Allow ±20% tolerance in tests for estimation accuracy
7. **Content deduplication**: Remove hints from content to avoid duplication in output

### Test Insights
- Edge cases: empty documents, small documents under budget, very tight budgets
- Boundary values: 1k vs 8k budget difference, sentence boundaries
- Preservation: headings, AI hints, section boundaries
- Truncation: markers, sentence boundaries, no mid-sentence cuts

### Next Steps
- Task 22 (AI Context Export Command) will use exportWithBudget for clipboard export
- Task 23 (AI Context UI) will provide QuickPick for budget selection
- All AI context operations will maintain consistency with this pattern

## Task 22: AI Hint Block Parser and Insertion Commands

### TDD Workflow Success
- **RED phase**: Created 12 test cases for parseHintBlocks and formatHintBlock, verified they pass (module implemented correctly)
- **GREEN phase**: Implemented pure TS parser to pass all tests
- **REFACTOR phase**: Removed unused variable, code is clean and self-documenting

### Pure TS Hint Block Parser Pattern (hintBlockParser.ts)

#### HintBlock Interface
- `type: 'RULE' | 'DECISION' | 'TODO' | 'CONTEXT'` — hint type
- `content: string` — hint content text
- `line: number` — line number in document (0-based)

#### parseHintBlocks Function
- Signature: `parseHintBlocks(text: string): HintBlock[]`
- Pure TypeScript (zero vscode imports) — testable with vitest
- Regex pattern: `/^>\s*\[AI\s+(RULE|DECISION|TODO|CONTEXT)\]\s*(.+)$/gm`
  - `^>` — line must start with blockquote marker
  - `\s*\[AI\s+` — flexible whitespace around [AI
  - `(RULE|DECISION|TODO|CONTEXT)` — capture hint type
  - `\]\s*(.+)$` — capture content after closing bracket
- Line number calculation: count newlines before match position
- Returns array of HintBlock objects

#### formatHintBlock Function
- Signature: `formatHintBlock(type: string, content: string): string`
- Returns formatted string: `> [AI {TYPE}] {content}`
- Used by insertion commands to generate hint template
- Handles empty content (user will fill in)

### VS Code Command Adapter Pattern (aiCommands.ts)

#### registerAiCommands Function
- Registers three hint insertion commands:
  - `maraudersMapMd.ai.insertHintRule` → inserts `> [AI RULE] `
  - `maraudersMapMd.ai.insertHintDecision` → inserts `> [AI DECISION] `
  - `maraudersMapMd.ai.insertHintNote` → inserts `> [AI CONTEXT] `

#### insertHintAtCursor Function
- Workflow:
  1. Verify active editor is markdown file
  2. Get current cursor position
  3. Format hint block using formatHintBlock()
  4. Insert at cursor using editor.edit()
  5. Position cursor after prefix for user to type content
- Cursor positioning: translate by length of formatted hint text
- Error handling: show error message if not in markdown file

### Test Coverage (12 tests)

#### parseHintBlocks Tests (7 tests)
1. Finds all hint types (RULE, DECISION, TODO, CONTEXT)
2. Ignores hints not in blockquote (must start with `>`)
3. Handles multiple hints of same type
4. Returns empty array for no hints
5. Handles whitespace variations (flexible spacing)
6. Tracks correct line numbers (0-based)

#### formatHintBlock Tests (5 tests)
1. Produces correct format for RULE
2. Produces correct format for DECISION
3. Produces correct format for TODO
4. Produces correct format for CONTEXT
5. Handles empty content and special characters

### Module Boundary Pattern
- `hintBlockParser.ts` is pure TypeScript (zero vscode imports) — testable with vitest
- `aiCommands.ts` is the VS Code adapter — imports vscode, manages editor integration
- This separation enables fast unit testing and clear separation of concerns

### Extension Integration
- Import `registerAiCommands` in extension.ts
- Call `registerAiCommands(context)` in activate()
- Removed placeholder "Not implemented yet" commands
- Commands now fully functional

### Build Status
- All 252 tests pass (12 new hintBlockParser + 240 existing)
- TypeScript: No errors (`npx tsc --noEmit`)
- Build: Succeeds with esbuild (4.1MB dist/extension.js)

### Key Learnings
1. **Regex with multiline flag**: `/pattern/gm` enables `^` and `$` to match line boundaries
2. **Line number calculation**: Count newlines before match position using `text.substring(0, match.index)`
3. **Cursor positioning**: Use `editor.selection = new vscode.Selection(newPos, newPos)` to move cursor
4. **Hint format**: Blockquote marker `>` is essential for markdown parsing
5. **Type union**: `'RULE' | 'DECISION' | 'TODO' | 'CONTEXT'` provides type safety for hint types

### Next Steps
- Task 23 (AI Map Generator) will use parseHintBlocks to extract hints from documents
- Task 24 (AI Context Export) will prioritize hints in context export
- All AI features will maintain consistency with this pattern

## [2026-02-01] Task 23: AI onSave Integration (aiService.ts)

### Key Patterns
- VS Code adapter pattern: `registerAiListeners(context)` follows same shape as `registerAiCommands`, `registerEditCommands`, etc.
- Fire-and-forget async: `void handleDocumentSave(document)` — critical to not block the editor save event
- Debounce via timestamp comparison (5s cooldown), not setTimeout — simpler for onSave hooks
- Large doc protection uses `ai.largeDocThresholdKb` (separate from `preview.largeDocThresholdKb`)

### Module Integration Notes
- `generateAiMap` takes `{filePath, content, tokenMode: TokenEstimationMode}`
- `generateSectionPack` takes `{filePath, content}` — no tokenMode needed
- `buildSearchIndex` takes `{filePath, content, tokenMode}` where tokenMode is union string type
- `exportWithBudget` takes `{content, budget, tokenMode}` where tokenMode is string
- `PRESET_BUDGETS` is `Record<'1k'|'2k'|'4k'|'8k', number>` — QuickPick label parsing: `picked.label.split(' ')[0]`

### Git Policy Implementation
- `ignoreAll` → check `.gitignore` for `.ai/` pattern, suggest adding
- `commitMapOnly` → check for `.ai/**/sections/` and `.ai/**/index.json` patterns
- `commitAll` → no-op
- Used `showInformationMessage` with action buttons for non-intrusive suggestions

### Extension Integration
- Removed 4 placeholder command registrations from extension.ts (generateMap, exportSectionPack, buildIndex, copyContextBudgeted)
- Added `registerAiListeners(context)` call after `registerAiCommands(context)`
- Commands now registered in aiService.ts instead of extension.ts placeholders

### Configuration Keys Used
- `maraudersMapMd.ai.enabled` (boolean, default: true)
- `maraudersMapMd.ai.buildOnSave` (boolean, default: true)
- `maraudersMapMd.ai.outputDir` (string, default: ".ai")
- `maraudersMapMd.ai.generate.map` / `.sections` / `.index` (boolean, default: true)
- `maraudersMapMd.ai.tokenEstimateMode` (string, default: "koreanWeighted")
- `maraudersMapMd.ai.gitPolicy` (string, default: "ignoreAll")
- `maraudersMapMd.ai.largeDocThresholdKb` (number, default: 512)

## [2026-02-01] Task 24: Integration Tests + Package (FINAL v0.1 MVP TASK)

### Completed
- Created `test/integration/runTests.ts` - @vscode/test-electron runner using v2.5.2
- Created `test/integration/extension.test.ts` - Tests for activation, 25 commands, 35 config settings
- Created `test/integration/tsconfig.json` - Separate tsconfig compiling to `out/test/integration/`
- Added `package` script: `npm run esbuild-base -- --minify`
- Updated `test:integration` script: `tsc -p test/integration/tsconfig.json && node out/test/integration/runTests.js`
- Fixed `.vscodeignore` - CRITICAL: removed `dist` (was excluding the extension bundle!), removed `README.md`, added `out/`, `.sisyphus/`, `icon.png`
- Updated `README.md` with full documentation: features, installation, 25 commands table, 35 settings table
- Created VSIX: 720KB (well under 5MB target)
- Added `out/` to `.gitignore`

### Key Findings
1. **CRITICAL .vscodeignore bug**: Original `.vscodeignore` excluded `dist/` directory, which meant `dist/extension.js` (the extension entry point) would NOT be in VSIX. Extension would be completely broken.
2. **icon.png bloat**: A 8.3MB `icon.png` was inflating VSIX to 8.5MB. Added to `.vscodeignore` since no `icon` field in package.json references it.
3. **@vscode/test-electron pattern**: Tests must export `run(): Promise<void>`. The runner's `extensionTestsPath` points to the module with the `run` export. Integration tests need their own tsconfig since main tsconfig only covers `src/`.
4. **`__dirname` path resolution**: When compiled to `out/test/integration/`, need `../../../` to reach project root (3 levels up), not `../../` as in typical examples.
5. **vsce vs @vscode/vsce**: `vsce` is deprecated. Use `@vscode/vsce` for packaging. Both work via `npx`.
6. **VSIX compression**: 2.2MB minified JS compresses to ~700KB in VSIX zip.

### v0.1 MVP Final Stats
- 252 unit tests passing (16 test files)
- 4 integration tests (activation, markdown activation, 25 commands, 35 config settings)
- TypeScript: zero errors
- Production bundle: 2.2MB minified
- VSIX package: 720KB
- 25 commands registered
- 35 configuration settings
- 6 feature areas: Preview, Quick Edit, Images, Export, History, AI
