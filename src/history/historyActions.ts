import * as vscode from 'vscode';
import {
  Snapshot,
  SnapshotIndex,
  SnapshotCompression,
  buildIndexPath,
  buildSnapshotPath,
  compressContent,
  computeHash,
  createSnapshotId,
  decompressContent,
} from './snapshotStore';
import { getHistoryDirectory } from './historyPaths';

function getSnapshotCompressionMode(): SnapshotCompression {
  const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
  const mode = config.get<string>('snapshotCompression', 'gzip');
  return mode === 'none' ? 'none' : 'gzip';
}

export async function viewSnapshot(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder,
  snapshot: Snapshot
): Promise<void> {
  try {
    const historyDir = getHistoryDirectory(context, workspaceFolder);
    const snapshotPath = buildSnapshotPath(historyDir, snapshot.filePath, snapshot.id);
    const snapshotUri = vscode.Uri.file(snapshotPath);

    const data = await vscode.workspace.fs.readFile(snapshotUri);
    const content = decompressContent(Buffer.from(data));

    const doc = await vscode.workspace.openTextDocument({
      content,
      language: 'markdown',
    });

    await vscode.window.showTextDocument(doc, { preview: true });
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to view snapshot: ${error}`);
  }
}

export async function diffSnapshot(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder,
  snapshot: Snapshot,
  currentDocument: vscode.TextDocument
): Promise<void> {
  try {
    const historyDir = getHistoryDirectory(context, workspaceFolder);
    const snapshotPath = buildSnapshotPath(historyDir, snapshot.filePath, snapshot.id);
    const snapshotUri = vscode.Uri.file(snapshotPath);

    const data = await vscode.workspace.fs.readFile(snapshotUri);
    const content = decompressContent(Buffer.from(data));

    const tempDoc = await vscode.workspace.openTextDocument({
      content,
      language: 'markdown',
    });

    const date = new Date(snapshot.timestamp).toLocaleString();
    const title = `${snapshot.filePath} (${date}) ↔ Current`;

    await vscode.commands.executeCommand('vscode.diff', tempDoc.uri, currentDocument.uri, title);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to diff snapshot: ${error}`);
  }
}

export async function restoreSnapshot(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder,
  snapshot: Snapshot,
  currentDocument: vscode.TextDocument
): Promise<void> {
  try {
    const answer = await vscode.window.showWarningMessage(
      `Restore snapshot from ${new Date(snapshot.timestamp).toLocaleString()}? This will replace the current content.`,
      { modal: true },
      'Restore'
    );

    if (answer !== 'Restore') {
      return;
    }

    const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
    const createPreRestore = config.get<boolean>('createPreRestoreSnapshot', true);

    if (createPreRestore) {
      try {
        const currentContent = currentDocument.getText();
        const historyDir = getHistoryDirectory(context, workspaceFolder);
        const relativePath = vscode.workspace.asRelativePath(currentDocument.uri, false);
        const compressionMode = getSnapshotCompressionMode();
        const indexPath = buildIndexPath(historyDir, relativePath);
        const indexUri = vscode.Uri.file(indexPath);

        let index: SnapshotIndex;
        try {
          const indexData = await vscode.workspace.fs.readFile(indexUri);
          index = JSON.parse(Buffer.from(indexData).toString('utf8'));
        } catch {
          index = { version: 1, snapshots: [] };
        }

        const preRestoreId = createSnapshotId();
        const hash = computeHash(currentContent);
        const compressed = compressContent(currentContent, compressionMode);
        const snapshotPath = buildSnapshotPath(historyDir, relativePath, preRestoreId);
        const snapshotUri = vscode.Uri.file(snapshotPath);

        const snapshotDir = vscode.Uri.file(snapshotPath.substring(0, snapshotPath.lastIndexOf('/')));
        await vscode.workspace.fs.createDirectory(snapshotDir);

        await vscode.workspace.fs.writeFile(snapshotUri, compressed);

        const preRestoreSnapshot: Snapshot = {
          id: preRestoreId,
          filePath: relativePath,
          timestamp: Date.now(),
          label: 'pre-restore',
          isCheckpoint: false,
          hash,
          sizeBytes: compressed.length,
          compressed: compressionMode === 'gzip' && currentContent.length >= 1024,
        };
        index.snapshots.push(preRestoreSnapshot);

        const indexContent = JSON.stringify(index, null, 2);
        await vscode.workspace.fs.writeFile(indexUri, Buffer.from(indexContent, 'utf8'));
      } catch (error) {
        console.error('Failed to create pre-restore snapshot:', error);
      }
    }

    const historyDir = getHistoryDirectory(context, workspaceFolder);
    const snapshotPath = buildSnapshotPath(historyDir, snapshot.filePath, snapshot.id);
    const snapshotUri = vscode.Uri.file(snapshotPath);

    const data = await vscode.workspace.fs.readFile(snapshotUri);
    const content = decompressContent(Buffer.from(data));

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      currentDocument.positionAt(0),
      currentDocument.positionAt(currentDocument.getText().length)
    );
    edit.replace(currentDocument.uri, fullRange, content);

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      await currentDocument.save();
      vscode.window.showInformationMessage('Snapshot restored successfully');
    } else {
      vscode.window.showErrorMessage('Failed to restore snapshot');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to restore snapshot: ${error}`);
  }
}

export async function copySnapshot(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder,
  snapshot: Snapshot
): Promise<void> {
  try {
    const historyDir = getHistoryDirectory(context, workspaceFolder);
    const snapshotPath = buildSnapshotPath(historyDir, snapshot.filePath, snapshot.id);
    const snapshotUri = vscode.Uri.file(snapshotPath);

    const data = await vscode.workspace.fs.readFile(snapshotUri);
    const content = decompressContent(Buffer.from(data));

    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage('Snapshot content copied to clipboard');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to copy snapshot: ${error}`);
  }
}
