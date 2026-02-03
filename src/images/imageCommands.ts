import * as vscode from 'vscode';
import * as path from 'path';
import {
  generateImageFilename,
  buildRelativePath,
  buildMarkdownImageLink,
  getAltText,
} from './pathUtils';
import { EditorDropProvider, EditorPasteProvider } from './editorDropProvider';
import { getMarkdownEditor } from '../utils/editorUtils';

export function registerImageCommands(context: vscode.ExtensionContext): void {
  const dropProvider = new EditorDropProvider();
  const pasteProvider = new EditorPasteProvider();

  context.subscriptions.push(
    vscode.languages.registerDocumentDropEditProvider({ language: 'markdown' }, dropProvider),
    vscode.languages.registerDocumentPasteEditProvider(
      { language: 'markdown' },
      pasteProvider,
      { providedPasteEditKinds: [vscode.DocumentDropOrPasteEditKind.Empty], pasteMimeTypes: ['image/*'] }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.images.insertFromFile', async () => {
      const editor = getMarkdownEditor();
      if (!editor) {
        vscode.window.showErrorMessage('Please open a markdown file first');
        return;
      }

      const mdFileUri = editor.document.uri;
      const mdFileDir = vscode.Uri.file(mdFileUri.fsPath).fsPath;
      const mdFileDirPath = mdFileDir.substring(0, mdFileDir.lastIndexOf('/'));

      const config = vscode.workspace.getConfiguration('maraudersMapMd.images');
      const assetsDir = config.get<string>('assetsDir') || 'assets';
      const filenamePattern = config.get<string>('filenamePattern') || '{basename}-{yyyyMMdd-HHmmss}';
      const altTextSource = config.get<'filename' | 'prompt'>('altTextSource') || 'filename';

      const imageUris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          Images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
        },
      });

      if (!imageUris || imageUris.length === 0) {
        return;
      }

      const selectedImageUri = imageUris[0];
      const originalFilename = selectedImageUri.fsPath.split('/').pop() || 'image';

      const assetsDirUri = vscode.Uri.joinPath(vscode.Uri.file(mdFileDirPath), assetsDir);

      try {
        await vscode.workspace.fs.createDirectory(assetsDirUri);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create assets directory: ${error}`);
        return;
      }

      const generatedFilename = generateImageFilename(originalFilename, filenamePattern);
      const targetImageUri = vscode.Uri.joinPath(assetsDirUri, generatedFilename);

      try {
        await vscode.workspace.fs.copy(selectedImageUri, targetImageUri, { overwrite: false });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy image: ${error}`);
        return;
      }

      const altText = getAltText(generatedFilename, altTextSource);
      const relativePath = buildRelativePath(mdFileDirPath, assetsDir, generatedFilename);
      const markdownLink = buildMarkdownImageLink(altText, relativePath);

      await editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, markdownLink);
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.images.copyForMaraudersMap', async (uri?: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage('Please right-click an image file in the Explorer');
        return;
      }

      const extension = path.extname(uri.fsPath).toLowerCase();
      const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
      if (!allowedExtensions.has(extension)) {
        vscode.window.showErrorMessage('Unsupported image type');
        return;
      }

      const editor = getMarkdownEditor();
      if (!editor) {
        vscode.window.showErrorMessage('Please open a markdown file first');
        return;
      }

      const config = vscode.workspace.getConfiguration('maraudersMapMd.images');
      const altTextSource = config.get<string>('altTextSource') || 'filename';
      const normalizedAltTextSource = altTextSource === 'empty' ? 'prompt' : altTextSource;

      const filename = path.basename(uri.fsPath);
      const altText = getAltText(filename, normalizedAltTextSource as 'filename' | 'prompt');

      const mdFileDirPath = path.dirname(editor.document.uri.fsPath);
      const relativePath = buildRelativePathFromMd(mdFileDirPath, uri.fsPath);
      const markdownLink = buildMarkdownImageLink(altText, relativePath);

      await vscode.env.clipboard.writeText(markdownLink);
      vscode.window.showInformationMessage('Image markdown copied to clipboard');
    })
  );
}

function buildRelativePathFromMd(mdFileDirPath: string, targetPath: string): string {
  const relative = path.relative(mdFileDirPath, targetPath).replace(/\\/g, '/');
  if (!relative.startsWith('.') && !relative.startsWith('/')) {
    return `./${relative}`;
  }
  return relative;
}
