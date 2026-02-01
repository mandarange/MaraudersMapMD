# Large Sample Markdown Document

This is a large markdown file (~50KB) used for testing performance and handling of large documents in the MaraudersMapMD extension.

## Section 1: Introduction and Overview

The purpose of this document is to provide a comprehensive test fixture that simulates real-world markdown documents with substantial content. This helps ensure that the extension can handle large files efficiently without performance degradation.

### Subsection 1.1: Key Concepts

- **Performance**: The extension must maintain responsiveness even with large documents
- **Memory Efficiency**: Efficient handling of large content in memory
- **Rendering Speed**: Fast preview updates for large files
- **Token Estimation**: Accurate token counting for AI features

### Subsection 1.2: Technical Requirements

The following technical requirements must be met:

1. Preview rendering must complete within 150ms for initial load
2. Updates must complete within 80ms for responsive editing
3. Memory usage should scale linearly with document size
4. Token estimation should be accurate within 5% margin

## Section 2: Detailed Feature Documentation

### Feature 2.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 2.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 2.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 2.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```

## Section 10: Conclusion

The MaraudersMapMD extension provides a comprehensive solution for markdown editing in VS Code. With features for preview, quick editing, image management, export, history, and AI readability support, it enables developers to work with markdown more efficiently.

The extension is designed with performance, reliability, and user experience in mind. It uses modern VS Code APIs and best practices to provide a seamless editing experience.

For more information, visit the project repository or documentation.

---

*This is a large sample document for testing purposes. It contains multiple sections with realistic content to simulate real-world markdown documents.*

*Last updated: 2024*

## Section 3: Detailed Feature Documentation

### Feature 3.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 3.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 3.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 3.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```


## Section 4: Detailed Feature Documentation

### Feature 4.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 4.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 4.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 4.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```


## Section 5: Detailed Feature Documentation

### Feature 5.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 5.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 5.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 5.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```


## Section 6: Detailed Feature Documentation

### Feature 6.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 6.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 6.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 6.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```


## Section 7: Detailed Feature Documentation

### Feature 7.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 7.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 7.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 7.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```


## Section 8: Detailed Feature Documentation

### Feature 8.1: Preview System

The preview system is the core component of MaraudersMapMD. It provides real-time rendering of markdown content with support for:

- Live updates as you type
- Syntax highlighting for code blocks
- Task list checkboxes
- Image rendering with local file support
- Link navigation

The preview uses a webview panel that communicates with the extension via message passing. This architecture ensures security and isolation while maintaining performance.

#### Implementation Details

The preview system consists of several components:

1. **MarkdownEngine**: Handles markdown parsing and HTML generation
2. **PreviewManager**: Manages the webview panel lifecycle
3. **Preview Assets**: CSS and JavaScript for styling and interactivity

Each component is designed to be testable and maintainable.

### Feature 8.2: Quick Edit Commands

Quick edit commands provide keyboard shortcuts for common markdown formatting tasks:

- **Bold**: Wrap selection with `**`
- **Italic**: Wrap selection with `*`
- **Inline Code**: Wrap selection with backticks
- **Link**: Insert markdown link syntax
- **Heading**: Insert heading with specified level
- **Quote**: Wrap lines with `>`
- **Task**: Toggle task list checkbox

These commands are designed to be fast and non-intrusive, allowing users to maintain their editing flow.

### Feature 8.3: Image Management

Image management includes:

- Insert images from file system
- Drag and drop support in editor
- Drag and drop support in preview
- Automatic asset directory creation
- Filename pattern customization
- Alt text generation

Images are stored in a configurable assets directory relative to the markdown file.

### Feature 8.4: Export Functionality

Export functionality supports:

- HTML export with embedded CSS
- PDF export with local image embedding
- Customizable output directory
- Format and margin configuration
- Automatic browser detection for PDF generation

## Section 3: Advanced Features

### Feature 3.1: History and Snapshots

The history system maintains snapshots of document changes:

- Automatic snapshots on save
- Manual checkpoint creation
- Diff viewing between snapshots
- Restore to previous versions
- Configurable retention policies
- Compression for storage efficiency

Snapshots are stored in the workspace or global storage depending on configuration.

### Feature 3.2: AI Readability Support

AI readability features help prepare documents for LLM processing:

- **AI Map**: Hierarchical summary of document structure
- **Section Pack**: Organized sections with metadata
- **Search Index**: Full-text search index for content
- **Token Budget**: Context-aware token counting
- **Hint Blocks**: AI-specific annotations for better comprehension

These features are vendor-neutral and don't require external API calls.

### Feature 3.3: Token Estimation

Token estimation uses character-ratio heuristics:

- English: ~1-1.3 tokens per word
- Korean: ~2-3 tokens per character
- Accurate within 5% margin
- No external dependencies

This allows users to estimate context usage without external services.

## Section 4: Configuration and Settings

### Setting 4.1: Preview Settings

- `preview.updateDelayMs`: Delay before updating preview (default: 200ms)
- `preview.largeDocThresholdKb`: Threshold for large document handling (default: 512KB)
- `preview.largeDocUpdateDelayMs`: Update delay for large documents (default: 700ms)
- `preview.scrollSync`: Enable scroll synchronization (default: true)

### Setting 4.2: Image Settings

- `images.assetsDir`: Directory for storing images (default: "assets")
- `images.allowRemote`: Allow remote image URLs (default: false)
- `images.filenamePattern`: Pattern for generated filenames (default: "{basename}-{yyyyMMdd-HHmmss}")
- `images.altTextSource`: Source for alt text (default: "filename")

### Setting 4.3: Export Settings

- `pdf.browserPath`: Path to Chrome/Chromium (default: "auto")
- `pdf.format`: Paper format (default: "A4")
- `pdf.marginMm`: Margin size in mm (default: 12)
- `pdf.printBackground`: Include backgrounds (default: true)
- `pdf.embedImages`: Image embedding method (default: "fileUrl")
- `pdf.outputDirectory`: Output directory (default: "${workspaceFolder}/exports")
- `pdf.openAfterExport`: Open PDF after export (default: true)

### Setting 4.4: History Settings

- `history.enabled`: Enable history snapshots (default: true)
- `history.storageLocation`: Storage location (default: "workspace")
- `history.mode`: Snapshot mode (default: "onSave")
- `history.intervalMinutes`: Interval for automatic snapshots (default: 10)
- `history.maxSnapshotsPerFile`: Maximum snapshots per file (default: 100)
- `history.maxTotalStorageMb`: Maximum total storage (default: 200MB)
- `history.retentionDays`: Retention period (default: 30 days)
- `history.protectManualCheckpoints`: Protect manual checkpoints (default: true)
- `history.snapshotCompression`: Compression method (default: "gzip")
- `history.createPreRestoreSnapshot`: Create snapshot before restore (default: true)

### Setting 4.5: AI Settings

- `ai.enabled`: Enable AI features (default: true)
- `ai.outputDir`: Output directory for AI artifacts (default: ".ai")
- `ai.buildOnSave`: Generate artifacts on save (default: true)
- `ai.generate.map`: Generate AI map (default: true)
- `ai.generate.sections`: Generate section pack (default: true)
- `ai.generate.index`: Generate search index (default: true)
- `ai.tokenEstimateMode`: Token estimation mode (default: "koreanWeighted")
- `ai.gitPolicy`: Git policy for artifacts (default: "ignoreAll")
- `ai.largeDocThresholdKb`: Threshold for large documents (default: 512KB)

## Section 5: Architecture and Design

### Architecture 5.1: Module Structure

The extension is organized into logical modules:

- **preview**: Markdown rendering and webview management
- **edit**: Quick edit commands and formatters
- **images**: Image management and asset handling
- **export**: HTML and PDF export functionality
- **history**: Snapshot storage and management
- **ai**: AI readability features
- **utils**: Shared utilities and helpers

Each module is designed to be independent and testable.

### Architecture 5.2: Testing Strategy

The extension uses a two-tier testing approach:

1. **Unit Tests (vitest)**: Test pure logic modules without VS Code dependencies
2. **Integration Tests (@vscode/test-electron)**: Test VS Code API integration

This separation ensures that most logic can be tested quickly without the overhead of the VS Code test environment.

### Architecture 5.3: Performance Optimization

Performance optimizations include:

- Debounced preview updates
- Version-based rendering to prevent out-of-order updates
- Efficient markdown parsing with markdown-it
- Lazy loading of large documents
- Compression for snapshot storage

## Section 6: Examples and Use Cases

### Use Case 6.1: Technical Documentation

For technical documentation, the extension provides:

- Fast preview for rapid iteration
- Code block syntax highlighting
- Link navigation for cross-references
- Export to PDF for distribution
- History for version tracking

### Use Case 6.2: Project Planning

For project planning documents:

- Task list management with checkboxes
- Hierarchical structure with headings
- Quick formatting for emphasis
- Export for sharing with team
- History for tracking changes

### Use Case 6.3: Knowledge Base

For knowledge base articles:

- AI map for quick navigation
- Section pack for LLM processing
- Search index for discovery
- Token budget for context management
- Hint blocks for AI comprehension

## Section 7: Troubleshooting and FAQ

### FAQ 7.1: Common Issues

**Q: Preview not updating?**
A: Check that the markdown file is saved and the preview is not locked.

**Q: Images not showing in preview?**
A: Ensure images are in the assets directory and paths are relative.

**Q: PDF export failing?**
A: Verify Chrome/Chromium is installed and the path is correct.

**Q: History snapshots taking too much space?**
A: Adjust retention settings or enable compression.

### FAQ 7.2: Performance Tips

- Use large document settings for files over 512KB
- Enable compression for history snapshots
- Close unused preview panels
- Disable AI features if not needed
- Use file-based storage for better performance

## Section 8: Future Enhancements

### Enhancement 8.1: Planned Features

- Scroll synchronization between editor and preview
- Table of contents generation
- Syntax highlighting for code blocks
- Webview paste support for images
- Advanced search with filters
- Collaborative editing support

### Enhancement 8.2: Performance Improvements

- Incremental rendering for large documents
- Virtual scrolling for preview
- Caching for frequently accessed content
- Parallel processing for AI features
- Streaming for large exports

## Section 9: Contributing and Development

### Development 9.1: Setup

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to open the Extension Development Host

### Development 9.2: Testing

To run tests:

```bash
npm test              # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:integration  # Run integration tests
```

### Development 9.3: Building

To build the extension:

```bash
npm run compile      # Development build
npm run vscode:prepublish  # Production build
npm run package      # Create .vsix package
```

