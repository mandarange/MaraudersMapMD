import * as vscode from 'vscode';
import {
  generateImageFilename,
  buildRelativePath,
  buildMarkdownImageLink,
  getAltText,
} from './pathUtils';
import { EditorDropProvider, EditorPasteProvider } from './editorDropProvider';

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
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
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
}
