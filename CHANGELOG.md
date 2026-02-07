# Changelog

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
