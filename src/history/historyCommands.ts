import * as vscode from 'vscode';
import {
  Snapshot,
  SnapshotIndex,
  SnapshotCompression,
  computeHash,
  compressContent,
  decompressContent,
  createSnapshotId,
  buildSnapshotPath,
  buildIndexPath,
  isDuplicate,
} from './snapshotStore';
import { getSnapshotsToDelete, RetentionPolicy } from './retentionEngine';
import { getMarkdownEditor } from '../utils/editorUtils';
import { getHistoryDirectory } from './historyPaths';
import { HistoryPanel } from './historyPanel';

/**
 * TextDocumentContentProvider for snapshot URIs (maraudersMapMd: scheme)
 */
class SnapshotContentProvider implements vscode.TextDocumentContentProvider {
  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    try {
      const snapshotPath = uri.fsPath;
      const snapshotUri = vscode.Uri.file(snapshotPath);
      const data = await vscode.workspace.fs.readFile(snapshotUri);
      return decompressContent(Buffer.from(data));
    } catch (error) {
      return `Error reading snapshot: ${error}`;
    }
  }
}

/**
 * Register history-related event listeners and providers
 */
export function registerHistoryListeners(context: vscode.ExtensionContext): void {
  // Register TextDocumentContentProvider for snapshot URIs
  const snapshotProvider = new SnapshotContentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('maraudersMapMd', snapshotProvider)
  );
  const intervalTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
      await createSnapshotForDocument(context, document);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const document = event.document;
      if (document.languageId !== 'markdown' || event.contentChanges.length === 0) {
        return;
      }

      const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
      const enabled = config.get<boolean>('enabled', true);
      const mode = config.get<string>('mode', 'onSave');
      if (!enabled || mode !== 'interval') {
        return;
      }

      const intervalMinutes = config.get<number>('intervalMinutes', 10);
      const delayMs = Math.max(1, intervalMinutes) * 60 * 1000;
      const key = document.uri.toString();
      const existing = intervalTimers.get(key);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(async () => {
        intervalTimers.delete(key);
        try {
          const latestDocument = await vscode.workspace.openTextDocument(document.uri);
          await createSnapshotForDocument(context, latestDocument);
        } catch {
          // Ignore: document may no longer exist.
        }
      }, delayMs);
      intervalTimers.set(key, timer);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      const key = document.uri.toString();
      const timer = intervalTimers.get(key);
      if (!timer) {
        return;
      }
      clearTimeout(timer);
      intervalTimers.delete(key);
    })
  );

  context.subscriptions.push({
    dispose: () => {
      for (const timer of intervalTimers.values()) {
        clearTimeout(timer);
      }
      intervalTimers.clear();
    },
  });
}

/**
 * Create a snapshot on save (with deduplication)
 */
function getSnapshotCompressionMode(): SnapshotCompression {
  const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
  const mode = config.get<string>('snapshotCompression', 'gzip');
  return mode === 'none' ? 'none' : 'gzip';
}

async function createSnapshotForDocument(
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
    const compressionMode = getSnapshotCompressionMode();
    const compressed = compressContent(content, compressionMode);
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
      compressed: compressionMode === 'gzip' && content.length >= 1024,
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
// getHistoryDirectory moved to historyPaths.ts

/**
 * Command: maraudersMapMd.history.open
 * Show QuickPick with snapshot history for current file
 */
export async function openHistoryCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showWarningMessage('No active markdown file');
    return;
  }

  HistoryPanel.show(context, editor.document);
}


/**
 * Command: maraudersMapMd.history.createCheckpoint
 * Create a manual checkpoint with user label
 */
export async function createCheckpointCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
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
    const compressionMode = getSnapshotCompressionMode();

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
    const compressed = compressContent(content, compressionMode);
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
      compressed: compressionMode === 'gzip' && content.length >= 1024,
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
  const editor = getMarkdownEditor();
  if (!editor) {
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
    const indexEntries = await collectAllIndexes(historyDir);
    if (indexEntries.length === 0) {
      vscode.window.showInformationMessage('No history found');
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

    const allSnapshots = indexEntries.flatMap((entry) => entry.index.snapshots);
    if (allSnapshots.length === 0) {
      vscode.window.showInformationMessage('No snapshots to prune');
      return;
    }

    // Get snapshots to delete across entire history directory
    const now = Date.now();
    const toDelete = getSnapshotsToDelete(allSnapshots, policy, now);

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

    const toDeleteKeys = new Set(toDelete.map((s) => `${s.filePath}::${s.id}`));
    let updatedIndexes = 0;
    for (const entry of indexEntries) {
      const before = entry.index.snapshots.length;
      entry.index.snapshots = entry.index.snapshots.filter(
        (s) => !toDeleteKeys.has(`${s.filePath}::${s.id}`)
      );
      if (entry.index.snapshots.length !== before) {
        const indexContent = JSON.stringify(entry.index, null, 2);
        await vscode.workspace.fs.writeFile(entry.uri, Buffer.from(indexContent, 'utf8'));
        updatedIndexes++;
      }
    }

    vscode.window.showInformationMessage(
      `Pruned ${toDelete.length} snapshot(s) from ${updatedIndexes} index file(s)`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to prune snapshots: ${error}`);
  }
}

interface IndexedSnapshots {
  uri: vscode.Uri;
  index: SnapshotIndex;
}

async function collectAllIndexes(historyDir: string): Promise<IndexedSnapshots[]> {
  const root = vscode.Uri.file(historyDir);
  const indexUris = await collectIndexUrisRecursive(root);
  const result: IndexedSnapshots[] = [];

  for (const uri of indexUris) {
    try {
      const data = await vscode.workspace.fs.readFile(uri);
      const parsed = JSON.parse(Buffer.from(data).toString('utf8')) as SnapshotIndex;
      if (!Array.isArray(parsed.snapshots)) {
        continue;
      }
      result.push({
        uri,
        index: { version: 1, snapshots: parsed.snapshots },
      });
    } catch {
      // Ignore invalid index files.
    }
  }
  return result;
}

async function collectIndexUrisRecursive(dir: vscode.Uri): Promise<vscode.Uri[]> {
  let entries: [string, vscode.FileType][] = [];
  try {
    entries = await vscode.workspace.fs.readDirectory(dir);
  } catch {
    return [];
  }

  const result: vscode.Uri[] = [];
  for (const [name, type] of entries) {
    const child = vscode.Uri.joinPath(dir, name);
    if (type === vscode.FileType.Directory) {
      const nested = await collectIndexUrisRecursive(child);
      result.push(...nested);
      continue;
    }
    if (type === vscode.FileType.File && name.endsWith('.index.json')) {
      result.push(child);
    }
  }
  return result;
}
