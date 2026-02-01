export interface ExportHtmlOptions {
  title: string;
  body: string;
  css: string;
  embedImages?: boolean;
}

export function buildExportHtml(options: ExportHtmlOptions): string {
  const { title, body, css } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${css}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

export function resolveLocalImages(
  html: string,
  mdFileDir: string,
  mode: 'fileUrl' | 'dataUri'
): string {
  const imageRegex = /src=["']([^"']+)["']/g;

  return html.replace(imageRegex, (match, src) => {
    if (isAbsoluteUrl(src) || isDataUri(src)) {
      return match;
    }

    if (isRelativePath(src)) {
      const absolutePath = resolveRelativePath(mdFileDir, src);
      const resolvedUrl = mode === 'fileUrl' ? toFileUrl(absolutePath) : src;
      return `src="${resolvedUrl}"`;
    }

    return match;
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function isAbsoluteUrl(src: string): boolean {
  return /^https?:\/\//.test(src);
}

function isDataUri(src: string): boolean {
  return /^data:/.test(src);
}

function isRelativePath(src: string): boolean {
  return src.startsWith('./') || src.startsWith('.\\');
}

function resolveRelativePath(mdFileDir: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  return `${mdFileDir}/${normalized}`;
}

function toFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  return `file://${normalized}`;
}
