import * as vscode from 'vscode';
import { join } from 'path';
import {
  Snapshot,
  SnapshotIndex,
  computeHash,
  compressContent,
  decompressContent,
  createSnapshotId,
  buildSnapshotPath,
  buildIndexPath,
  isDuplicate,
} from './snapshotStore';
import { getSnapshotsToDelete, RetentionPolicy } from './retentionEngine';

/**
 * Register history-related event listeners (onSave snapshots)
 */
export function registerHistoryListeners(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      // Only process markdown files
      if (document.languageId !== 'markdown') {
        return;
      }

      // Check if history is enabled
      const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
      const enabled = config.get<boolean>('enabled', true);
      if (!enabled) {
        return;
      }

      // Check if mode is onSave
      const mode = config.get<string>('mode', 'onSave');
      if (mode !== 'onSave') {
        return;
      }

      // Create snapshot
      await createSnapshotOnSave(context, document);
    })
  );
}

/**
 * Create a snapshot on save (with deduplication)
 */
async function createSnapshotOnSave(
  context: vscode.ExtensionContext,
  document: vscode.TextDocument
): Promise<void> {
  try {
    const content = document.getText();
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return;
    }

    // Get history directory
    const historyDir = getHistoryDirectory(context, workspaceFolder);

    // Get relative file path
    const relativePath = vscode.workspace.asRelativePath(document.uri, false);

    // Read existing index
    const indexPath = buildIndexPath(historyDir, relativePath);
    const indexUri = vscode.Uri.file(indexPath);

    let index: SnapshotIndex;
    try {
      const indexData = await vscode.workspace.fs.readFile(indexUri);
      index = JSON.parse(Buffer.from(indexData).toString('utf8'));
    } catch {
      index = { version: 1, snapshots: [] };
    }

    // Check for duplicates
    const latestSnapshot = index.snapshots.length > 0 ? index.snapshots[index.snapshots.length - 1] : undefined;
    if (isDuplicate(content, latestSnapshot?.hash)) {
      return; // Skip duplicate
    }

    // Create new snapshot
    const snapshotId = createSnapshotId();
    const hash = computeHash(content);
    const compressed = compressContent(content);
    const snapshotPath = buildSnapshotPath(historyDir, relativePath, snapshotId);
    const snapshotUri = vscode.Uri.file(snapshotPath);

    // Ensure directory exists
    const snapshotDir = vscode.Uri.file(snapshotPath.substring(0, snapshotPath.lastIndexOf('/')));
    await vscode.workspace.fs.createDirectory(snapshotDir);

    // Write snapshot file
    await vscode.workspace.fs.writeFile(snapshotUri, compressed);

    // Add to index
    const snapshot: Snapshot = {
      id: snapshotId,
      filePath: relativePath,
      timestamp: Date.now(),
      isCheckpoint: false,
      hash,
      sizeBytes: compressed.length,
      compressed: content.length >= 1024,
    };
    index.snapshots.push(snapshot);

    // Write index
    const indexContent = JSON.stringify(index, null, 2);
    await vscode.workspace.fs.writeFile(indexUri, Buffer.from(indexContent, 'utf8'));
  } catch (error) {
    console.error('Failed to create snapshot on save:', error);
  }
}

/**
 * Get history directory based on storage location setting
 */
function getHistoryDirectory(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): string {
  const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
  const storageLocation = config.get<string>('storageLocation', 'workspace');

  if (storageLocation === 'globalStorage') {
    return context.globalStorageUri.fsPath;
  } else {
    return join(workspaceFolder.uri.fsPath, '.maraudersmapmd', 'history');
  }
}

/**
 * Command: maraudersMapMd.history.open
 * Show QuickPick with snapshot history for current file
 */
export async function openHistoryCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('No active markdown file');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!workspaceFolder) {
    vscode.window.showWarningMessage('File is not in a workspace');
    return;
  }

  const historyDir = getHistoryDirectory(context, workspaceFolder);
  const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
  const indexPath = buildIndexPath(historyDir, relativePath);
  const indexUri = vscode.Uri.file(indexPath);

  // Read index
  let index: SnapshotIndex;
  try {
    const indexData = await vscode.workspace.fs.readFile(indexUri);
    index = JSON.parse(Buffer.from(indexData).toString('utf8'));
  } catch {
    vscode.window.showInformationMessage('No history found for this file');
    return;
  }

  if (index.snapshots.length === 0) {
    vscode.window.showInformationMessage('No snapshots found for this file');
    return;
  }

  // Sort snapshots newest first
  const sortedSnapshots = [...index.snapshots].sort((a, b) => b.timestamp - a.timestamp);

  // Create QuickPick items
  const items: vscode.QuickPickItem[] = sortedSnapshots.map((snapshot) => {
    const date = new Date(snapshot.timestamp);
    const label = date.toLocaleString();
    const description = snapshot.isCheckpoint && snapshot.label ? snapshot.label : 'auto';
    const sizeKb = (snapshot.sizeBytes / 1024).toFixed(2);
    const detail = `${sizeKb} KB${snapshot.compressed ? ' (compressed)' : ''}`;

    return {
      label,
      description,
      detail,
      // Store snapshot ID in buttons for later use
      buttons: [
        { iconPath: new vscode.ThemeIcon('eye'), tooltip: 'View' },
        { iconPath: new vscode.ThemeIcon('diff'), tooltip: 'Diff' },
        { iconPath: new vscode.ThemeIcon('discard'), tooltip: 'Restore' },
        { iconPath: new vscode.ThemeIcon('copy'), tooltip: 'Copy' },
      ],
    };
  });

  // Show QuickPick
  const quickPick = vscode.window.createQuickPick();
  quickPick.items = items;
  quickPick.placeholder = 'Select a snapshot to view, diff, restore, or copy';
  quickPick.title = `History: ${relativePath}`;

  quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0];
    if (selected) {
      const index = items.indexOf(selected);
      const snapshot = sortedSnapshots[index];
      // Default action: View
      viewSnapshot(context, workspaceFolder, snapshot);
    }
    quickPick.hide();
  });

  quickPick.onDidTriggerItemButton(async (event) => {
    const index = items.indexOf(event.item);
    const snapshot = sortedSnapshots[index];
    const buttonIndex = event.item.buttons?.indexOf(event.button) ?? -1;

    switch (buttonIndex) {
      case 0: // View
        await viewSnapshot(context, workspaceFolder, snapshot);
        break;
      case 1: // Diff
        await diffSnapshot(context, workspaceFolder, snapshot, editor.document);
        break;
      case 2: // Restore
        await restoreSnapshot(context, workspaceFolder, snapshot, editor.document);
        break;
      case 3: // Copy
        await copySnapshot(context, workspaceFolder, snapshot);
        break;
    }
  });

  quickPick.show();
}

/**
 * View snapshot in read-only editor
 */
async function viewSnapshot(
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

/**
 * Diff snapshot with current document
 */
async function diffSnapshot(
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

    // Create temporary document for diff
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

/**
 * Restore snapshot to current document
 */
async function restoreSnapshot(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder,
  snapshot: Snapshot,
  currentDocument: vscode.TextDocument
): Promise<void> {
  try {
    // Confirm restore
    const answer = await vscode.window.showWarningMessage(
      `Restore snapshot from ${new Date(snapshot.timestamp).toLocaleString()}? This will replace the current content.`,
      { modal: true },
      'Restore'
    );

    if (answer !== 'Restore') {
      return;
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

/**
 * Copy snapshot content to clipboard
 */
async function copySnapshot(
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

/**
 * Command: maraudersMapMd.history.createCheckpoint
 * Create a manual checkpoint with user label
 */
export async function createCheckpointCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('No active markdown file');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!workspaceFolder) {
    vscode.window.showWarningMessage('File is not in a workspace');
    return;
  }

  // Prompt for label
  const label = await vscode.window.showInputBox({
    prompt: 'Enter a label for this checkpoint',
    placeHolder: 'e.g., Before major refactor',
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Label cannot be empty';
      }
      return null;
    },
  });

  if (!label) {
    return; // User cancelled
  }

  try {
    const content = editor.document.getText();
    const historyDir = getHistoryDirectory(context, workspaceFolder);
    const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);

    // Read existing index
    const indexPath = buildIndexPath(historyDir, relativePath);
    const indexUri = vscode.Uri.file(indexPath);

    let index: SnapshotIndex;
    try {
      const indexData = await vscode.workspace.fs.readFile(indexUri);
      index = JSON.parse(Buffer.from(indexData).toString('utf8'));
    } catch {
      index = { version: 1, snapshots: [] };
    }

    // Create checkpoint snapshot
    const snapshotId = createSnapshotId();
    const hash = computeHash(content);
    const compressed = compressContent(content);
    const snapshotPath = buildSnapshotPath(historyDir, relativePath, snapshotId);
    const snapshotUri = vscode.Uri.file(snapshotPath);

    // Ensure directory exists
    const snapshotDir = vscode.Uri.file(snapshotPath.substring(0, snapshotPath.lastIndexOf('/')));
    await vscode.workspace.fs.createDirectory(snapshotDir);

    // Write snapshot file
    await vscode.workspace.fs.writeFile(snapshotUri, compressed);

    // Add to index
    const snapshot: Snapshot = {
      id: snapshotId,
      filePath: relativePath,
      timestamp: Date.now(),
      label: label.trim(),
      isCheckpoint: true,
      hash,
      sizeBytes: compressed.length,
      compressed: content.length >= 1024,
    };
    index.snapshots.push(snapshot);

    // Write index
    const indexContent = JSON.stringify(index, null, 2);
    await vscode.workspace.fs.writeFile(indexUri, Buffer.from(indexContent, 'utf8'));

    vscode.window.showInformationMessage(`Checkpoint created: ${label}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create checkpoint: ${error}`);
  }
}

/**
 * Command: maraudersMapMd.history.pruneNow
 * Run retention engine on current file's snapshots
 */
export async function pruneNowCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('No active markdown file');
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!workspaceFolder) {
    vscode.window.showWarningMessage('File is not in a workspace');
    return;
  }

  try {
    const historyDir = getHistoryDirectory(context, workspaceFolder);
    const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    const indexPath = buildIndexPath(historyDir, relativePath);
    const indexUri = vscode.Uri.file(indexPath);

    // Read index
    let index: SnapshotIndex;
    try {
      const indexData = await vscode.workspace.fs.readFile(indexUri);
      index = JSON.parse(Buffer.from(indexData).toString('utf8'));
    } catch {
      vscode.window.showInformationMessage('No history found for this file');
      return;
    }

    if (index.snapshots.length === 0) {
      vscode.window.showInformationMessage('No snapshots to prune');
      return;
    }

    // Get retention policy from settings
    const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
    const policy: RetentionPolicy = {
      maxSnapshotsPerFile: config.get<number>('maxSnapshotsPerFile', 100),
      maxTotalStorageMb: config.get<number>('maxTotalStorageMb', 200),
      retentionDays: config.get<number>('retentionDays', 30),
      protectManualCheckpoints: config.get<boolean>('protectManualCheckpoints', true),
    };

    // Get snapshots to delete
    const now = Date.now();
    const toDelete = getSnapshotsToDelete(index.snapshots, policy, now);

    if (toDelete.length === 0) {
      vscode.window.showInformationMessage('No snapshots need to be pruned');
      return;
    }

    for (const snapshot of toDelete) {
      const snapshotPath = buildSnapshotPath(historyDir, snapshot.filePath, snapshot.id);
      const snapshotUri = vscode.Uri.file(snapshotPath);
      try {
        await vscode.workspace.fs.delete(snapshotUri);
      } catch {
        // Ignore errors (file may not exist)
      }
    }

    const toDeleteIds = new Set(toDelete.map((s) => s.id));
    index.snapshots = index.snapshots.filter((s) => !toDeleteIds.has(s.id));

    const indexContent = JSON.stringify(index, null, 2);
    await vscode.workspace.fs.writeFile(indexUri, Buffer.from(indexContent, 'utf8'));

    vscode.window.showInformationMessage(`Pruned ${toDelete.length} snapshot(s)`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to prune snapshots: ${error}`);
  }
}
