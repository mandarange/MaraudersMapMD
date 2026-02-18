# Changelog

## 1.1.27 - 2026-02-18
- Fix history retention time math to use millisecond-based day windows, preventing premature snapshot pruning.
- Implement real `history.mode = interval` behavior with inactivity-based snapshot scheduling and timer cleanup.
- Expand `History: Prune History Now` to apply retention policies across all indexed history files (global storage cap included).
- Honor `history.snapshotCompression` (`gzip` or `none`) for regular, checkpoint, and pre-restore snapshots.
- Fix History panel `Refresh` action wiring and strengthen checkpoint protection during count/size pruning.
- Update retention tests to millisecond fixtures and refresh README history documentation to match runtime behavior.

## 1.1.26 - 2026-02-18
- Restore Rewrite Prompt full-skill installation guard for `MaraudersMapMD-skill`, including companion file validation for Python scripts (`shards_db.py`, `shards_search.py`, `shards_to_json.py`) plus docs/tests directories.
- Keep the newer readability output naming contract: `<filename>.rewritten_vN.md` with explicit ban on chained names like `rewritten.rewritten.md`.
- Clarify Rewrite Prompt execution contract to enforce explicit invocation (`Use MaraudersMapMD skill`) and uninterrupted Step 1 → Step 2 flow.
- Bump extension version and refresh release packaging metadata/docs for VSIX build.

## 1.1.25 - 2026-02-18
- Rename "RC Check" → "Fact Check" across all UI labels, commands, docs, and internal identifiers.
- Update skill repo URL from `Marauders_RealityCheck_Skill` → `Marauders_FactCheck_Skill`.
- Remove internal dev docs (`docs/`, `PUBLISHING.md`) from repository.
- Clean up stale build artifacts.

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
