import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

export interface ExportHtmlOptions {
  title: string;
  body: string;
  css: string;
  embedImages?: boolean;
  bodyClass?: string;
}

export function buildExportHtml(options: ExportHtmlOptions): string {
  const { title, body, css, bodyClass } = options;
  const classAttr = bodyClass ? ` class="${bodyClass}"` : '';

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
<body${classAttr}>
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
    if (isAbsoluteUrl(src) || isDataUri(src) || isFileUrl(src)) {
      return match;
    }

    const normalizedSrc = normalizeLocalSrcForFs(src);
    if (isRelativePath(normalizedSrc) || isLocalAbsolutePath(normalizedSrc)) {
      const absolutePath = isLocalAbsolutePath(normalizedSrc)
        ? normalizedSrc
        : resolveRelativePath(mdFileDir, normalizedSrc);
      if (mode === 'dataUri') {
        const dataUri = toDataUri(absolutePath);
        if (dataUri) {
          return `src="${dataUri}"`;
        }
      }
      return `src="${toFileUrl(absolutePath)}"`;
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

function isFileUrl(src: string): boolean {
  return /^file:\/\//.test(src);
}

function isLocalAbsolutePath(src: string): boolean {
  return path.isAbsolute(src) && !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(src);
}

function isRelativePath(src: string): boolean {
  if (
    src.startsWith('./') ||
    src.startsWith('../') ||
    src.startsWith('.\\') ||
    src.startsWith('..\\')
  ) {
    return true;
  }

  if (path.isAbsolute(src)) {
    return false;
  }

  return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(src);
}

function resolveRelativePath(mdFileDir: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  return path.resolve(mdFileDir, normalized);
}

function normalizeLocalSrcForFs(src: string): string {
  const trimmed = src.trim();
  const withoutQueryHash = trimmed.split(/[?#]/, 1)[0];
  try {
    return decodeURI(withoutQueryHash);
  } catch {
    return withoutQueryHash;
  }
}

function toFileUrl(filePath: string): string {
  return pathToFileURL(filePath).toString();
}

function toDataUri(filePath: string): string | null {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = getMimeType(ext);
    if (!mimeType) {
      return null;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to embed image as data URI: ${message}`);
    return null;
  }
}

function getMimeType(ext: string): string | null {
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.bmp':
      return 'image/bmp';
    default:
      return null;
  }
}
