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
  const { body, nonce, cspSource, cssUri, jsUri, codiconsUri, themeClass } = params;
  const codiconsLink = codiconsUri
    ? `<link rel="stylesheet" href="${codiconsUri}">`
    : '';
  const bodyClass = themeClass ? ` class="${themeClass}"` : '';
  const themeAttr = themeClass ? ` data-vscode-theme-kind="${themeClass}"` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https: data: file:; script-src 'nonce-${nonce}'; font-src ${cspSource};">
  <link rel="stylesheet" href="${cssUri}">
  ${codiconsLink}
  <title>MaraudersMapMD Preview</title>
</head>
<body${bodyClass}${themeAttr}>
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
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}
