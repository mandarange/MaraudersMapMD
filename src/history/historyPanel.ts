import * as vscode from 'vscode';
import { getNonce } from '../preview/getNonce';
import { Snapshot, buildIndexPath } from './snapshotStore';
import { getHistoryDirectory } from './historyPaths';
import { copySnapshot, diffSnapshot, restoreSnapshot, viewSnapshot } from './historyActions';

interface SnapshotViewModel {
  id: string;
  timestamp: number;
  label?: string;
  isCheckpoint: boolean;
  sizeBytes: number;
  compressed: boolean;
}

export class HistoryPanel implements vscode.Disposable {
  private static currentPanel: HistoryPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private readonly disposables: vscode.Disposable[] = [];
  private document: vscode.TextDocument;
  private snapshots: Snapshot[] = [];

  static show(context: vscode.ExtensionContext, document: vscode.TextDocument): void {
    if (HistoryPanel.currentPanel) {
      HistoryPanel.currentPanel.setDocument(document);
      HistoryPanel.currentPanel.panel.reveal(HistoryPanel.currentPanel.panel.viewColumn);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'maraudersMapMd.history',
      'MaraudersMapMD History',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    HistoryPanel.currentPanel = new HistoryPanel(panel, context, document);
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, document: vscode.TextDocument) {
    this.panel = panel;
    this.context = context;
    this.document = document;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.buildHtml();

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (!message) return;
        if (message.type === 'ready') {
          await this.refresh();
          return;
        }
        if (message.type === 'refresh') {
          await this.refresh();
          return;
        }
        if (message.type === 'action') {
          await this.handleAction(message.action, message.id);
        }
      },
      null,
      this.disposables,
    );

    void this.refresh();
  }

  dispose(): void {
    HistoryPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) disposable.dispose();
    }
  }

  private setDocument(document: vscode.TextDocument): void {
    this.document = document;
    void this.refresh();
  }

  private async refresh(): Promise<void> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.document.uri);
    if (!workspaceFolder) {
      this.postEmpty('File is not in a workspace.');
      return;
    }

    const historyDir = getHistoryDirectory(this.context, workspaceFolder);
    const relativePath = vscode.workspace.asRelativePath(this.document.uri, false);
    const indexPath = buildIndexPath(historyDir, relativePath);
    const indexUri = vscode.Uri.file(indexPath);

    try {
      const indexData = await vscode.workspace.fs.readFile(indexUri);
      const index = JSON.parse(Buffer.from(indexData).toString('utf8')) as { snapshots?: Snapshot[] };
      const snapshots = Array.isArray(index.snapshots) ? index.snapshots : [];
      this.snapshots = snapshots.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      this.snapshots = [];
    }

    this.postHeader(relativePath);

    if (this.snapshots.length === 0) {
      this.postEmpty('No snapshots found for this file.');
      return;
    }

    const viewModels: SnapshotViewModel[] = this.snapshots.map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      label: s.label,
      isCheckpoint: s.isCheckpoint,
      sizeBytes: s.sizeBytes,
      compressed: s.compressed,
    }));

    this.panel.webview.postMessage({
      type: 'snapshots',
      snapshots: viewModels,
    });
  }

  private postHeader(relativePath: string): void {
    this.panel.webview.postMessage({
      type: 'header',
      title: 'History',
      subtitle: relativePath,
    });
  }

  private postEmpty(message: string): void {
    this.panel.webview.postMessage({
      type: 'empty',
      message,
    });
  }

  private async handleAction(action: string, id: string): Promise<void> {
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) {
      vscode.window.showErrorMessage('Snapshot not found');
      return;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(this.document.uri);
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('File is not in a workspace');
      return;
    }

    switch (action) {
      case 'view':
        await viewSnapshot(this.context, workspaceFolder, snapshot);
        break;
      case 'diff':
        await diffSnapshot(this.context, workspaceFolder, snapshot, this.document);
        break;
      case 'restore':
        await restoreSnapshot(this.context, workspaceFolder, snapshot, this.document);
        await this.refresh();
        break;
      case 'copy':
        await copySnapshot(this.context, workspaceFolder, snapshot);
        break;
      default:
        vscode.window.showErrorMessage(`Unknown action: ${action}`);
        break;
    }
  }

  private buildHtml(): string {
    const webview = this.panel.webview;
    const nonce = getNonce();
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'history.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'history.js')
    );

    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${cssUri}">
  <title>MaraudersMapMD History</title>
</head>
<body>
  <header>
    <div class="header-left">
      <div class="title" id="history-title">History</div>
      <div class="subtitle" id="history-subtitle"></div>
    </div>
    <div class="header-actions">
      <button class="secondary" data-action="refresh">Refresh</button>
    </div>
  </header>
  <main>
    <div id="history-root"></div>
  </main>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}
