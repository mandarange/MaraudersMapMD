# MaraudersMapMD

Ultra-fast Markdown preview, quick edits, images, PDF export, history, and AI readability support for VS Code.

## Features

### Fast Preview

- Instant markdown rendering with configurable debounced updates
- Source line injection for accurate rendering
- Task list support with checkbox toggle
- Large document optimization with adaptive delay
- Scroll sync between editor and preview

### Quick Edit

- **Format**: Bold, Italic, Inline Code
- **Insert**: Link, Heading, Quote
- **Toggle**: Task checkbox in editor and preview

### Images

- Insert from file with automatic asset directory management
- Drag-drop support (editor-side)
- Configurable filename patterns and alt text sources
- Assets directory per markdown file

### Export

- **HTML**: Export with customizable templates, local image embedding
- **PDF**: Export via Chrome/Chromium with auto-detection, configurable margins, paper format, and background printing

### History

- Automatic snapshots on save (configurable: onSave, interval, manual)
- Manual checkpoints with labels
- Diff viewer and restore functionality
- Configurable retention policies (days, max snapshots, storage limits)
- gzip compression support
- Pre-restore safety snapshots

### AI Readability Support

- **AI Map**: Structure table with heading hierarchy, line ranges, and token estimates
- **Section Pack**: Heading-based document splits for LLM consumption
- **Search Index**: Keywords, links, and AI hint extraction
- **Token Budget Exporter**: Deterministic context construction within token limits
- **AI Hint Blocks**: Insert RULE, DECISION, NOTE markers for AI-aware documents
- **Build on Save**: Automatic AI artifact generation

## Installation

### From VSIX

1. Download `marauders-map-md-0.1.0.vsix`
2. Open VS Code
3. Run command: `Extensions: Install from VSIX...`
4. Select the downloaded file

### From Marketplace (Coming Soon)

Search for "MaraudersMapMD" in the VS Code Extensions view.

## Usage

### Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type "MaraudersMapMD":

| Command | Description |
|---------|-------------|
| `MaraudersMapMD: Open Preview to Side` | Open live markdown preview |
| `MaraudersMapMD: Toggle Preview Lock` | Lock/unlock preview to current document |
| `MaraudersMapMD: Format: Make Bold` | Wrap selection in `**bold**` |
| `MaraudersMapMD: Format: Make Italic` | Wrap selection in `*italic*` |
| `MaraudersMapMD: Format: Make Inline Code` | Wrap selection in `` `code` `` |
| `MaraudersMapMD: Insert: Insert Link` | Insert markdown link |
| `MaraudersMapMD: Insert: Insert Heading` | Insert heading markup |
| `MaraudersMapMD: Insert: Insert Quote` | Insert blockquote |
| `MaraudersMapMD: Toggle: Toggle Task` | Toggle task checkbox |
| `MaraudersMapMD: Images: Insert Image from File` | Pick and insert image |
| `MaraudersMapMD: Images: Paste Image to Assets` | Paste clipboard image |
| `MaraudersMapMD: Export: Export to HTML` | Export document as HTML |
| `MaraudersMapMD: Export: Export to PDF` | Export document as PDF |
| `MaraudersMapMD: History: Open History` | View document snapshot history |
| `MaraudersMapMD: History: Create Checkpoint` | Create labeled checkpoint |
| `MaraudersMapMD: History: Diff with Current` | Compare snapshot with current |
| `MaraudersMapMD: History: Restore Snapshot` | Restore from snapshot |
| `MaraudersMapMD: History: Prune History Now` | Run retention cleanup |
| `MaraudersMapMD: AI: Generate AI Map` | Generate structure map |
| `MaraudersMapMD: AI: Export Section Pack` | Export heading-based splits |
| `MaraudersMapMD: AI: Build Search Index` | Build keyword/link index |
| `MaraudersMapMD: AI: Copy Context (Budgeted)` | Copy context within token budget |
| `MaraudersMapMD: AI: Insert AI Rule Hint` | Insert RULE hint block |
| `MaraudersMapMD: AI: Insert AI Decision Hint` | Insert DECISION hint block |
| `MaraudersMapMD: AI: Insert AI Note Hint` | Insert NOTE hint block |

### Settings

All settings are under the `maraudersMapMd` namespace.

#### Preview

| Setting | Default | Description |
|---------|---------|-------------|
| `preview.updateDelayMs` | `200` | Debounce delay (ms) before updating preview |
| `preview.largeDocThresholdKb` | `512` | Size threshold (KB) for large document handling |
| `preview.largeDocUpdateDelayMs` | `700` | Debounce delay (ms) for large documents |
| `preview.scrollSync` | `true` | Synchronize scroll between editor and preview |
| `render.allowHtml` | `false` | Allow raw HTML rendering in markdown |

#### Images

| Setting | Default | Description |
|---------|---------|-------------|
| `images.assetsDir` | `"assets"` | Asset directory name relative to markdown file |
| `images.allowRemote` | `false` | Allow embedding remote image URLs |
| `images.filenamePattern` | `"{basename}-{yyyyMMdd-HHmmss}"` | Pattern for generated image filenames |
| `images.altTextSource` | `"filename"` | Source for alt text (`filename`, `prompt`, `empty`) |

#### PDF Export

| Setting | Default | Description |
|---------|---------|-------------|
| `pdf.browserPath` | `"auto"` | Path to Chrome/Chromium (`auto` = auto-detect) |
| `pdf.format` | `"A4"` | Paper format (`A4`, `Letter`, `A3`, `A5`) |
| `pdf.marginMm` | `12` | Margin size in millimeters |
| `pdf.printBackground` | `true` | Include background colors/images |
| `pdf.embedImages` | `"fileUrl"` | Image embedding method (`fileUrl`, `dataUri`) |
| `pdf.outputDirectory` | `"${workspaceFolder}/exports"` | Output directory for PDFs |
| `pdf.openAfterExport` | `true` | Open PDF after export |

#### History

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

#### AI

| Setting | Default | Description |
|---------|---------|-------------|
| `ai.enabled` | `true` | Enable AI readability features |
| `ai.outputDir` | `".ai"` | AI artifacts output directory |
| `ai.buildOnSave` | `true` | Generate AI artifacts on save |
| `ai.generate.map` | `true` | Generate AI map artifact |
| `ai.generate.sections` | `true` | Generate section pack artifact |
| `ai.generate.index` | `true` | Generate search index artifact |
| `ai.tokenEstimateMode` | `"koreanWeighted"` | Token estimation method (`simple`, `koreanWeighted`) |
| `ai.gitPolicy` | `"ignoreAll"` | Git policy for AI artifacts (`ignoreAll`, `commitMapOnly`, `commitAll`) |
| `ai.largeDocThresholdKb` | `512` | Size threshold (KB) for limiting AI generation |

## Screenshots

![Preview](docs/screenshots/preview.png)
![Export](docs/screenshots/export.png)
![History](docs/screenshots/history.png)
![AI Map](docs/screenshots/ai-map.png)

## Development

```bash
npm install
npm run compile
npm test
npm run package
```

## License

MIT
