<p align="center">
  <img src="icon.png" width="140" alt="MaraudersMapMD - AI-native Markdown preview extension for Cursor, Antigravity" />
</p>

<h1 align="center">MaraudersMapMD</h1>

<p align="center">
  <strong>Ultra-fast Markdown preview with AI-native readability artifacts, PDF export, and document history for Cursor, Antigravity</strong>
</p>

<p align="center">
  <a href="https://github.com/mandarange/MaraudersMapMD/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/mandarange/MaraudersMapMD/releases"><img src="https://img.shields.io/github/v/release/mandarange/MaraudersMapMD" alt="Latest Release" /></a>
  <img src="https://img.shields.io/badge/Cursor%20%7C%20Antigravity-%5E1.75.0-blue?logo=visual-studio-code" alt="Cursor | Antigravity ^1.75.0" />
  <img src="https://img.shields.io/badge/AI--native-GEO%20Ready-green" alt="GEO Ready" />
</p>

<p align="center">
  <a href="#why-maraudersmapmd">Why?</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#ai-readability--geo-support">AI / GEO</a> &middot;
  <a href="#commands">Commands</a> &middot;
  <a href="#settings">Settings</a> &middot;
  <a href="#faq">FAQ</a> &middot;
  <a href="CHANGELOG.md">Changelog</a> &middot;
  <a href="llms.txt">llms.txt</a> &middot;
  <a href="llms-full.txt">llms-full.txt</a>
</p>

## Marketplace Listing

**MaraudersMapMD** on Visual Studio Marketplace (Free) —
"Ultra-fast Markdown preview with AI-native readability artifacts (AI Map, Section Pack, Token Budget), PDF/HTML export, document history, and GEO (Generative Engine Optimization) support for Cursor, Antigravity."

Marketplace link: https://open-vsx.org/extension/mandarange/marauders-map-md

<!--
  AI-Agent-Context: MaraudersMapMD is a Cursor/Antigravity extension for Markdown editing with AI-native
  readability artifacts. It generates AI Maps (document structure), Section Packs (heading-based
  splits), and Search Indexes for LLM consumption.
  Key GEO features: llms.txt, llms-full.txt, structured metadata, AI hint blocks.
  Tech stack: TypeScript, esbuild, markdown-it, puppeteer-core. Zero external AI API dependencies.
  Repository: https://github.com/mandarange/MaraudersMapMD
-->

<details>
<summary><strong>Schema.org JSON-LD</strong></summary>

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MaraudersMapMD",
  "alternateName": "Marauders Map MD",
  "description": "Ultra-fast Markdown preview extension for Cursor, Antigravity with AI-native readability artifacts (AI Map, Section Pack, Search Index), PDF/HTML export, document history, and Generative Engine Optimization (GEO) support.",
  "applicationCategory": "DeveloperApplication",
  "applicationSubCategory": "Markdown Editor Extension",
  "operatingSystem": "Windows, macOS, Linux",
  "softwareRequirements": "Visual Studio Code ^1.100.0",
  "programmingLanguage": "TypeScript",
  "license": "https://opensource.org/licenses/MIT",
  "url": "https://github.com/mandarange/MaraudersMapMD",
  "codeRepository": "https://github.com/mandarange/MaraudersMapMD",
  "keywords": ["Markdown", "AI readability", "LLM context optimization", "Cursor extension", "Antigravity extension", "PDF export", "GEO", "Generative Engine Optimization", "AI Map", "Section Pack", "document history", "AI-native", "vendor-neutral"],
  "featureList": [
    "Ultra-fast Markdown preview with scroll sync",
    "AI Map generation for document structure",
    "Section Pack for heading-based document splits",
    "AI Hint Blocks (RULE, DECISION, NOTE)",
    "PDF export via Chrome/Chromium",
    "HTML export with local image embedding",
    "Document history with snapshots and diff",
    "Image workflow with drag-drop and paste",
    "Quick edit commands (bold, italic, links)"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "url": "https://github.com/mandarange"
  }
}
```

</details>

---

## Why MaraudersMapMD?

Modern development increasingly relies on AI assistants (Cursor, Claude, Copilot) that consume Markdown documentation. But **AI has token limits** &mdash; it can't read your entire 500-page PRD at once.

MaraudersMapMD solves this by generating **AI-native artifacts** that help LLMs understand large documents within token budgets:

| Problem | MaraudersMapMD Solution |
|---------|------------------------|
| AI can't read the whole document | **AI Map** provides structure at a glance |
| AI misses critical rules | **AI Hint Blocks** mark must-read content (`RULE`, `DECISION`, `TODO`, `CONTEXT`) |
| Long docs lose accuracy | **Section Pack** splits by heading for precise retrieval |
| Keyword search fails for AI | **Search Index** enables semantic section discovery |
| Rewriting docs is tedious | **Rewrite Prompt** generates a ready-to-paste AI prompt |

**Plus**: blazing-fast preview, PDF/HTML export, document history with diff/restore &mdash; all in one lightweight extension.

> **Vendor-neutral**: MaraudersMapMD does NOT call any AI API. It generates file-based artifacts (`docs/MaraudersMap/` directory) that ANY AI tool can read.

---

## Features

### Ultra-Fast Markdown Preview

- Instant rendering with configurable debounce (default 200ms)
- Scroll sync between editor and preview
- Task list rendering support
- Large document optimization with adaptive delay
- Source line injection for accurate rendering
- Contrast-tuned tables and code blocks for dark/light modes

### AI Readability & GEO Support

> **GEO (Generative Engine Optimization)**: Optimizing content for AI-powered search engines and LLM consumption.

- **AI Map** (`ai-map.md`): Structure table with heading hierarchy, line ranges, and token estimates &mdash; lets AI understand your document without reading it entirely
- **Section Pack** (`sections/*.md`): Heading-based document splits for precise LLM consumption
- **Search Index** (`index.json`): Keywords, links, and AI hint extraction per section
- **AI Hint Blocks**: Insert semantic markers (`RULE`, `DECISION`, `TODO`, `CONTEXT`) that AI agents prioritize
- **Rewrite Prompt**: One-click prompt generation for AI-powered readability rewriting ([skill](https://github.com/mandarange/MaraudersMapMD-skill))
- **Build on Save**: Automatic AI artifact generation to `docs/MaraudersMap/` directory
- **llms.txt & llms-full.txt**: Standard AI documentation files for Generative Engine Optimization

### Quick Edit Commands

- **Format**: Bold (`**`), Italic (`*`), Inline Code (`` ` ``)
- **Insert**: Link, Heading, Blockquote
- **Toggle**: Task checkbox in editor

### Image Workflow

- Insert from file with automatic `assets/` directory management
- Drag & drop images into the editor to copy into `assets/`
- Paste images from clipboard into the editor to save in `assets/`
- Configurable filename patterns and alt text sources
- Markdown image syntax renders in preview and exports (local paths, https URLs, data URIs)
- Explorer context menu: Copy for MaraudersMap MD

### PDF & HTML Export

- **PDF**: Export via system Chrome/Chromium (auto-detected, no bundled browser)
- **PDF Images**: Local images render reliably using embedded data URIs (default) or file URLs
- **HTML**: Standalone export with local image embedding
- Configurable margins, paper format (A4/Letter/A3/A5), and background printing
- Graceful fallback: if Chrome not found, guides to HTML print-to-PDF
- Raw HTML is rendered when `render.allowHtml` is enabled (default on)
- Code blocks highlight common languages; unknown languages fall back to TypeScript-style coloring

### Document History & Snapshots

- Automatic snapshots on save (configurable: `onSave`, `interval`, `manual`)
- Manual checkpoints with labels
- Visual diff viewer and one-click restore
- Configurable retention (days, max snapshots, storage limits)
- gzip compression for efficient storage
- Pre-restore safety snapshots (never lose data)

---

## Quick Start

### Install from VSIX

```bash
# 1. Download the latest .vsix from GitHub Releases
# 2. In your editor, run:
code --install-extension marauders-map-md-1.0.0.vsix
```

Or: Command Palette → `Extensions: Install from VSIX...` → select file.

### Install from Marketplace

Search **"MaraudersMapMD"** or **"Marauders Map MD"** in the Extensions view.

Direct link: https://open-vsx.org/extension/mandarange/marauders-map-md

### First Steps

1. Open any `.md` file
2. Run `MaraudersMapMD: Open Preview to Side` (Command Palette)
3. Start editing &mdash; preview updates in real-time
4. Save the file &mdash; AI artifacts auto-generate to `docs/MaraudersMap/` directory

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type **"MaraudersMapMD"**:

### Preview & Edit

| Command | Description |
|---------|-------------|
| `Open Preview to Side` | Open live Markdown preview panel |
| `Toggle Preview Lock` | Lock/unlock preview to current document |
| `Format: Make Bold` | Wrap selection in `**bold**` |
| `Format: Make Italic` | Wrap selection in `*italic*` |
| `Format: Make Inline Code` | Wrap selection in `` `code` `` |
| `Insert: Insert Link` | Insert Markdown link template |
| `Insert: Insert Heading` | Insert heading markup |
| `Insert: Insert Quote` | Insert blockquote |
| `Toggle: Toggle Task` | Toggle task checkbox (`- [ ]` / `- [x]`) |

### Images & Export

| Command | Description |
|---------|-------------|
| `Images: Insert Image from File` | Pick image, copy to assets, insert link |
| `Images: Copy for MaraudersMap MD` | Copy Markdown image link for selected file |
| `Export: Export to HTML` | Export as standalone HTML file |
| `Export: Export to PDF` | Export as PDF via Chrome/Chromium |

### History

| Command | Description |
|---------|-------------|
| `History: Open History` | View snapshot history for current file |
| `History: Create Checkpoint` | Create labeled checkpoint snapshot |
| `History: Diff with Current` | Compare snapshot with current version |
| `History: Restore Snapshot` | Restore file from selected snapshot |
| `History: Prune History Now` | Run retention cleanup manually |

### AI Readability (GEO)

| Command | Description |
|---------|-------------|
| `AI: Insert AI Rule Hint` | Insert `[AI RULE]` semantic marker |
| `AI: Insert AI Decision Hint` | Insert `[AI DECISION]` semantic marker |
| `AI: Insert AI Context Hint` | Insert `[AI CONTEXT]` semantic marker |
| `AI: Copy Readability Prompt` | Copy prompt for readability-focused rewriting |

### Help

| Command | Description |
|---------|-------------|
| `Help: Open Usage Guide` | Open the in-extension usage guide panel |

---

## Detailed Usage

### Readability-First Markdown
- Keep a clear heading hierarchy (#, ##, ###). Avoid skipping levels.
- Use short paragraphs and bullets for dense content.
- Use tables for settings, options, and comparisons.
- Use bold for key terms, inline code for identifiers.
- Use blockquotes for critical notes, not general prose.
- Use AI Hint Blocks for must-read content:
  - `> [AI RULE]` constraints
  - `> [AI DECISION]` key decisions
  - `> [AI TODO]` follow-up actions (type manually)
  - `> [AI CONTEXT]` essential background

### Visual Emphasis (Preview)
- Heading levels are color-coded to show hierarchy.
- Links are colored; convert raw URLs into Markdown links.
- Code blocks and inline code are styled for commands/paths.
- Blockquotes get a colored border for critical notes.

### History Workflow
- Use **History** to browse snapshots and restore when needed.
- Create a **Checkpoint** before major edits.

### Prompt Workflow
- Use **Rewrite Prompt** button to copy a rewrite prompt.
- Paste into Cursor/Antigravity and apply to a copy of the document.

---

## Settings

All settings use the `maraudersMapMd.*` namespace. Configure via Settings UI or `settings.json`.

<details>
<summary><strong>Preview Settings</strong></summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `preview.updateDelayMs` | `200` | Debounce delay (ms) before updating preview |
| `preview.largeDocThresholdKb` | `512` | Size threshold (KB) for large document handling |
| `preview.largeDocUpdateDelayMs` | `700` | Debounce delay (ms) for large documents |
| `preview.scrollSync` | `true` | Synchronize scroll between editor and preview |
| `render.allowHtml` | `true` | Allow raw HTML rendering in Markdown |

</details>

<details>
<summary><strong>Image Settings</strong></summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `images.assetsDir` | `"assets"` | Asset directory name relative to Markdown file |
| `images.allowRemote` | `false` | Reserved for remote image policy (preview/export currently render https URLs if present) |
| `images.filenamePattern` | `"{basename}-{yyyyMMdd-HHmmss}"` | Pattern for generated image filenames |
| `images.altTextSource` | `"filename"` | Source for alt text (`filename`, `prompt`, `empty`) |

</details>

<details>
<summary><strong>PDF Export Settings</strong></summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `pdf.browserPath` | `"auto"` | Path to Chrome/Chromium (`auto` = auto-detect) |
| `pdf.format` | `"A4"` | Paper format (`A4`, `Letter`, `A3`, `A5`) |
| `pdf.marginMm` | `12` | Margin size in millimeters |
| `pdf.printBackground` | `true` | Include background colors/images |
| `pdf.embedImages` | `"dataUri"` | Image embedding method (`dataUri`, `fileUrl`) |
| `pdf.outputDirectory` | `"${workspaceFolder}/exports"` | Output directory for PDFs |
| `pdf.openAfterExport` | `true` | Open PDF after export |

</details>

<details>
<summary><strong>History Settings</strong></summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `history.enabled` | `true` | Enable history snapshots |
| `history.storageLocation` | `"workspace"` | Storage location (`workspace`, `globalStorage`) |
| `history.mode` | `"onSave"` | Snapshot trigger (`onSave`, `interval`, `manual`) |
| `history.intervalMinutes` | `10` | Auto-snapshot interval (minutes) |
| `history.maxSnapshotsPerFile` | `100` | Max snapshots per file |
| `history.maxTotalStorageMb` | `200` | Max total storage (MB) |
| `history.retentionDays` | `30` | Retention period (days) |
| `history.protectManualCheckpoints` | `true` | Protect checkpoints from auto-pruning |
| `history.snapshotCompression` | `"gzip"` | Compression (`none`, `gzip`) |
| `history.createPreRestoreSnapshot` | `true` | Create safety snapshot before restore |

</details>

<details>
<summary><strong>AI Readability Settings</strong></summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `ai.enabled` | `true` | Enable AI readability features |
| `ai.outputDir` | `"docs/MaraudersMap"` | AI artifacts output directory |
| `ai.buildOnSave` | `true` | Generate AI artifacts on save |
| `ai.generate.map` | `true` | Generate AI Map artifact |
| `ai.generate.sections` | `true` | Generate Section Pack artifact |
| `ai.generate.index` | `true` | Generate Search Index artifact |
| `ai.tokenEstimateMode` | `"koreanWeighted"` | Token estimation method (`simple`, `koreanWeighted`) |
| `ai.gitPolicy` | `"ignoreAll"` | Git policy for AI artifacts (`ignoreAll`, `commitMapOnly`, `commitAll`) |
| `ai.largeDocThresholdKb` | `512` | Size threshold (KB) for limiting AI generation |

</details>

---

## AI Artifacts Output Structure

When AI features are enabled, MaraudersMapMD generates the following file structure:

```
docs/MaraudersMap/
  <document-id>/
    ai-map.md          # Document structure map with token estimates
    index.json         # Search index with keywords and links
    sections/
      01-introduction.md
      02-architecture.md
      ...
```

**For AI agents**: Read `docs/MaraudersMap/<docId>/ai-map.md` first to understand document structure, then selectively load sections as needed.

---

## Generative Engine Optimization (GEO)

MaraudersMapMD is designed for the **GEO era** &mdash; where AI search engines (ChatGPT, Perplexity, Claude, Gemini) answer questions by consuming documentation:

| GEO Feature | File | Purpose |
|-------------|------|---------|
| **llms.txt** | [`llms.txt`](llms.txt) | Concise AI-readable project summary |
| **llms-full.txt** | [`llms-full.txt`](llms-full.txt) | Complete reference for AI agents |
| **AI Map** | `docs/MaraudersMap/*/ai-map.md` | Token-efficient document structure |
| **Section Pack** | `docs/MaraudersMap/*/sections/` | Heading-based splits for retrieval |
| **Search Index** | `docs/MaraudersMap/*/index.json` | Semantic keyword index |
| **AI Hint Blocks** | In-document markers | Priority content for AI consumption |
| **Schema.org JSON-LD** | README.md | Structured data for search engines |

### What is GEO?

**Generative Engine Optimization (GEO)** is the practice of optimizing content to be accurately understood and cited by AI-powered search engines and large language models. Unlike traditional SEO (which targets keyword matching), GEO focuses on:

- **Structured information**: Clear hierarchies, explicit relationships
- **Machine-readable metadata**: Schema.org, llms.txt standards
- **Token efficiency**: Conveying maximum information within context windows
- **Semantic markers**: Explicit annotations for AI priority processing

---

## FAQ

<details>
<summary><strong>Does MaraudersMapMD call any AI API?</strong></summary>

**No.** MaraudersMapMD is completely vendor-neutral. It generates file-based artifacts (`docs/MaraudersMap/` directory) that any AI tool (Cursor, Claude, Copilot, etc.) can read. Zero external API calls, zero cloud dependencies.

</details>

<details>
<summary><strong>What is the AI Map and why do I need it?</strong></summary>

The AI Map (`ai-map.md`) is a structured table showing your document's heading hierarchy, line ranges, and token estimates. When an AI assistant reads your repository, it can read the AI Map first (small token cost) and then selectively load only the sections it needs, dramatically improving accuracy and reducing token usage.

</details>

<details>
<summary><strong>Does it work with Korean (or other CJK) text?</strong></summary>

Yes. The token estimator supports a `koreanWeighted` mode (default) that accounts for the higher token-per-character ratio of CJK text, providing more accurate estimates.

</details>

<details>
<summary><strong>Why Chrome/Chromium for PDF export?</strong></summary>

MaraudersMapMD uses `puppeteer-core` with your system's Chrome/Chromium to avoid bundling a 300MB+ browser. If Chrome is not detected, it provides clear setup instructions and falls back to HTML export with browser print-to-PDF.

</details>

<details>
<summary><strong>How is this different from Markdown Preview Enhanced or other Markdown extensions?</strong></summary>

MaraudersMapMD is **AI-first**. While other extensions focus on rendering features (diagrams, math, charts), MaraudersMapMD focuses on making your documents optimally consumable by LLMs through AI Map, Section Pack, Search Index, and AI Hint Blocks. It's designed for the workflow where you write docs AND AI reads them.

</details>

<details>
<summary><strong>What is llms.txt?</strong></summary>

`llms.txt` is an emerging standard (proposed by Jeremy Howard / Answer.AI) for providing AI-readable documentation alongside your project. It's like `robots.txt` but for LLMs. MaraudersMapMD ships with both `llms.txt` (concise) and `llms-full.txt` (comprehensive) to maximize discoverability by AI search engines.

</details>

---

## Development

```bash
git clone https://github.com/mandarange/MaraudersMapMD.git
cd MaraudersMapMD
npm install
npm run compile
npm test
npm run package    # Creates .vsix file
```

### Publishing

See `PUBLISHING.md` for Marketplace publish steps.

### Tech Stack

- **Language**: TypeScript
- **Bundler**: esbuild (single-file bundle)
- **Markdown**: markdown-it with task-lists plugin
- **PDF**: puppeteer-core (system Chrome)
- **Testing**: Vitest (unit) + VS Code Test Electron (integration)

---

## Contributing

Contributions are welcome! Please see the [GitHub Issues](https://github.com/mandarange/MaraudersMapMD/issues) for open tasks.

---

## License

[MIT](LICENSE) &copy; 2025
