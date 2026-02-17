export interface HtmlTemplateParams {
  body: string;
  nonce: string;
  cspSource: string;
  cssUri: string;
  jsUri: string;
  codiconsUri?: string;
  themeClass?: string;
}

export function buildPreviewHtml(params: HtmlTemplateParams): string {
  const { body, nonce, cspSource, cssUri, jsUri, codiconsUri } = params;
  const codiconsLink = codiconsUri
    ? `<link rel="stylesheet" href="${codiconsUri}">`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="vscode-light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https: data: file:; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net; font-src ${cspSource};">
  <link rel="stylesheet" href="${cssUri}">
  ${codiconsLink}
  <title>MaraudersMapMD Preview</title>
</head>
<body class="vscode-light" data-vscode-theme-kind="vscode-light">
  <div id="toolbar">
    <div class="toolbar-group">
      <button class="toolbar-btn" data-command="export.html" title="Export to HTML">
        <span class="btn-icon">&#x1F4C4;</span><span class="btn-label">HTML</span>
      </button>
      <button class="toolbar-btn" data-command="export.pdf" title="Export to PDF">
        <span class="btn-icon">&#x1F4D1;</span><span class="btn-label">PDF</span>
      </button>
    </div>
    <div class="toolbar-separator"></div>
    <div class="toolbar-group">
      <button class="toolbar-btn" data-command="ai.copyReadabilityPrompt" title="Copy Readability Prompt">
        <span class="btn-icon">&#x1F4DD;</span><span class="btn-label">Rewrite Prompt</span>
      </button>
      <button class="toolbar-btn" data-command="ai.copyPptPrompt" title="Copy PPT Prompt">
        <span class="btn-icon">&#x1F4CA;</span><span class="btn-label">PPT Prompt</span>
      </button>
    </div>
    <div class="toolbar-separator"></div>
    <div class="toolbar-group">
      <button class="toolbar-btn" data-command="history.open" title="Open History">
        <span class="btn-icon">&#x1F553;</span><span class="btn-label">History</span>
      </button>
      <button class="toolbar-btn" data-command="history.createCheckpoint" title="Create Checkpoint">
        <span class="btn-icon">&#x1F516;</span><span class="btn-label">Checkpoint</span>
      </button>
      <button class="toolbar-btn" data-command="usage.open" title="Open Usage Guide">
        <span class="btn-icon">&#x1F4D6;</span><span class="btn-label">Guide</span>
      </button>
    </div>
  </div>
  <div id="preview-root">${body}</div>
  <script nonce="${nonce}" type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      flowchart: { useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: true }
    });
    window.__mermaid = mermaid;
    window.dispatchEvent(new Event('mermaid-ready'));
  </script>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}
