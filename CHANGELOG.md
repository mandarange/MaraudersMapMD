# Changelog

## 1.1.24 - 2026-02-18
- Add Fact Check skill integration: `AI: Copy Fact Check Prompt` command and preview toolbar button for validating quantitative claims in Markdown via [Marauders_FactCheck_Skill](https://github.com/mandarange/Marauders_FactCheck_Skill).
- Add explicit companion file manifests to all three skill prompts (Readability, PPT, Fact Check) — each prompt now lists required Python scripts, reference docs, and templates with an incomplete-install guard.
- Add `npm run skill:install:fc` installer script for Fact Check skill.
- Remove stale integration tests (wrong extension ID, outdated command list) and unused `large-sample.md` fixture.
- Remove `@vscode/test-electron` devDependency and `test:integration` script.

## 1.1.23 - 2026-02-17
- Add PPT Prompt functionality for generating presentation PDFs via MaraudersPPT skill.
- Update README with skill installation instructions and trigger reliability notes.

## 1.1.22 - 2026-02-17
- Clarify PPT prompt invocation: `MaraudersMD2PPT` is an AI chat keyword (Cursor/Antigravity), not a terminal command.
- Keep Activation Guard and SKILL_ONLY execution contract while reducing user confusion around invocation context.

## 1.1.21 - 2026-02-17
- Sync MaraudersPPT skill bundle to v1.3.0 with full clean reset and refreshed `.mdc` rule content.
- Update PPT prompt execution contract to remove model-switch confirmation and run immediately with environment-aware image generation/fallback behavior.

## 1.1.20 - 2026-02-17
- Update PPT prompt contract to enforce Activation Guard (`MaraudersMD2PPT` required), forbid generic fallback, and require diagnostic execution report output.
- Refresh MaraudersPPT skill bundle to latest (v1.2) with clean reset and synchronized reference/template assets.

## 1.1.19 - 2026-02-17
- Improve PPT prompt workflow: continuous execution from Step 1 to Step 2 without interruption.
- Add explicit model switch guidance step before execution starts (single confirmation).
- Enforce best-effort execution in current environment unless blocked by critical errors.

## 1.1.18 - 2026-02-17
- Update Rewrite/PPT prompt workflows to sync full skill repositories (not only `SKILL.md`).
- Require full clean reset on skill upgrade: delete existing `.cursor/skills/...` bundle before reinstall.
- Enforce companion code/template sync (including Python files) for both MaraudersMapMD and MaraudersPPT skills.

## 1.1.17 - 2026-02-17
- Add `AI: Copy PPT Prompt` command and preview toolbar `PPT Prompt` button.
- Add MaraudersPPT prompt workflow that enforces latest skill update before use (`.cursor/rules/maraudersppt-skill.mdc`).
- Define PPT prompt output as PDF-only slides (no `.pptx` generation).
- Update usage guide and README/docs command references for the new PPT prompt flow.

## 1.1.16 - 2026-02-08
- Add Mermaid diagram rendering support via CDN (mermaid@11).
- Force light mode (white background) for all preview, HTML export, and PDF export.
- Remove dark/high-contrast theme dependencies; all colors hardcoded to light palette.
- Add MutationObserver to prevent VS Code from re-injecting dark theme styles.
- Wait for Mermaid SVG rendering before PDF generation.

## 1.1.14 - 2026-02-04
- Fix PDF export table row backgrounds for light print output.
- Improve JSON token contrast in PDF exports.

## 1.1.12 - 2026-02-04
- Improve dark/light contrast for tables and code blocks in preview and export.
- Update README with contrast note.

## 1.1.11 - 2026-02-04
- Update readability prompt to require latest installed skill before rewriting.

## 1.1.10 - 2026-02-04
- Enable raw HTML rendering by default across preview and export (configurable).
- Add multi-language code block highlighting with TypeScript fallback.
- Add highlight.js dependency for syntax coloring.

## 1.1.9 - 2026-02-04
- Fix PDF export to load a temp HTML file for reliable local image access.
- Normalize local image paths for export (decode URI, strip query/hash).
- Refresh README to reflect implemented features and link changelog.
