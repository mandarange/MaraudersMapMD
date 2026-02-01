import * as vscode from 'vscode';
import {
  generateImageFilename,
  buildRelativePath,
  buildMarkdownImageLink,
  getAltText,
} from './pathUtils';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']);

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? IMAGE_EXTENSIONS.has(ext) : false;
}

export class EditorDropProvider implements vscode.DocumentDropEditProvider {
  async provideDocumentDropEdits(
    document: vscode.TextDocument,
    _position: vscode.Position,
    dataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken
  ): Promise<vscode.DocumentDropEdit | undefined> {
    const uriListData = dataTransfer.get('text/uri-list');
    if (!uriListData) {
      return undefined;
    }

    const uriListText = await uriListData.asString();
    const uris = uriListText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    const imageUris = uris
      .map((uri) => vscode.Uri.parse(uri))
      .filter((uri) => {
        const filename = uri.fsPath.split('/').pop() || '';
        return isImageFile(filename);
      });

    if (imageUris.length === 0) {
      return undefined;
    }

    const mdFileDir = document.uri.fsPath.substring(0, document.uri.fsPath.lastIndexOf('/'));
    const config = vscode.workspace.getConfiguration('maraudersMapMd.images');
    const assetsDir = config.get<string>('assetsDir') || 'assets';
    const filenamePattern = config.get<string>('filenamePattern') || '{basename}-{yyyyMMdd-HHmmss}';
    const altTextSource = config.get<'filename' | 'prompt'>('altTextSource') || 'filename';

    const assetsDirUri = vscode.Uri.joinPath(vscode.Uri.file(mdFileDir), assetsDir);

    try {
      await vscode.workspace.fs.createDirectory(assetsDirUri);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create assets directory: ${error}`);
      return undefined;
    }

    const markdownLinks: string[] = [];

    for (const imageUri of imageUris) {
      const originalFilename = imageUri.fsPath.split('/').pop() || 'image';

      const generatedFilename = generateImageFilename(originalFilename, filenamePattern);
      const targetImageUri = vscode.Uri.joinPath(assetsDirUri, generatedFilename);

      try {
        await vscode.workspace.fs.copy(imageUri, targetImageUri, { overwrite: false });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy image: ${error}`);
        continue;
      }

      const altText = getAltText(generatedFilename, altTextSource);
      const relativePath = buildRelativePath(mdFileDir, assetsDir, generatedFilename);
      const markdownLink = buildMarkdownImageLink(altText, relativePath);
      markdownLinks.push(markdownLink);
    }

    if (markdownLinks.length === 0) {
      return undefined;
    }

    const insertText = markdownLinks.join('\n');
    const snippet = new vscode.SnippetString(insertText);

    return new vscode.DocumentDropEdit(snippet, 'Insert image', vscode.DocumentDropOrPasteEditKind.Empty);
  }
}

export class EditorPasteProvider implements vscode.DocumentPasteEditProvider {
  async provideDocumentPasteEdits(
    document: vscode.TextDocument,
    _ranges: readonly vscode.Range[],
    dataTransfer: vscode.DataTransfer,
    _context: vscode.DocumentPasteEditContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.DocumentPasteEdit[] | undefined> {
    const imageData = dataTransfer.get('image/png') ||
      dataTransfer.get('image/jpeg') ||
      dataTransfer.get('image/jpg') ||
      dataTransfer.get('image/gif') ||
      dataTransfer.get('image/webp') ||
      dataTransfer.get('image/svg+xml') ||
      dataTransfer.get('image/bmp');

    if (!imageData) {
      return undefined;
    }

    const mdFileDir = document.uri.fsPath.substring(0, document.uri.fsPath.lastIndexOf('/'));
    const config = vscode.workspace.getConfiguration('maraudersMapMd.images');
    const assetsDir = config.get<string>('assetsDir') || 'assets';
    const filenamePattern = config.get<string>('filenamePattern') || '{basename}-{yyyyMMdd-HHmmss}';
    const altTextSource = config.get<'filename' | 'prompt'>('altTextSource') || 'filename';

    const assetsDirUri = vscode.Uri.joinPath(vscode.Uri.file(mdFileDir), assetsDir);

    try {
      await vscode.workspace.fs.createDirectory(assetsDirUri);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create assets directory: ${error}`);
      return undefined;
    }

    const originalFilename = 'pasted-image.png';

    const generatedFilename = generateImageFilename(originalFilename, filenamePattern);
    const targetImageUri = vscode.Uri.joinPath(assetsDirUri, generatedFilename);

    try {
      const imageFile = await imageData.asFile();
      if (!imageFile) {
        return undefined;
      }
      const imageBytes = await imageFile.data();
      await vscode.workspace.fs.writeFile(targetImageUri, imageBytes);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save image: ${error}`);
      return undefined;
    }

    const altText = getAltText(generatedFilename, altTextSource);
    const relativePath = buildRelativePath(mdFileDir, assetsDir, generatedFilename);
    const markdownLink = buildMarkdownImageLink(altText, relativePath);

    const snippet = new vscode.SnippetString(markdownLink);

    return [new vscode.DocumentPasteEdit(snippet, 'Insert image', vscode.DocumentDropOrPasteEditKind.Empty)];
  }
}
