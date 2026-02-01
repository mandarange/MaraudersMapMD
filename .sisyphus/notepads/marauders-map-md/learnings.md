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

