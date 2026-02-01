export function generateImageFilename(originalName: string, pattern: string): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const basename = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
  const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;

  let result = pattern
    .replace('{basename}', basename)
    .replace('{yyyyMMdd-HHmmss}', timestamp);

  return result + extension;
}

export function buildRelativePath(_mdFileDir: string, assetsDir: string, filename: string): string {
  const normalizedAssetsDir = assetsDir.replace(/\\/g, '/');
  return `./` + normalizedAssetsDir + '/' + filename;
}

export function buildMarkdownImageLink(altText: string, relativePath: string): string {
  return `![${altText}](${relativePath})`;
}

export function getAltText(filename: string, source: 'filename' | 'prompt'): string {
  if (source === 'filename') {
    return filename;
  }
  return '';
}
