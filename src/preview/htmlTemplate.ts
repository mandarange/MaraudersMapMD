export interface HtmlTemplateParams {
  body: string;
  nonce: string;
  cspSource: string;
  cssUri: string;
  jsUri: string;
}

export function buildPreviewHtml(params: HtmlTemplateParams): string {
  const { body, nonce, cspSource, cssUri, jsUri } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https: data: file:; script-src 'nonce-${nonce}'; font-src ${cspSource};">
  <link rel="stylesheet" href="${cssUri}">
  <title>MaraudersMapMD Preview</title>
</head>
<body>
  <div id="preview-root">${body}</div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}
