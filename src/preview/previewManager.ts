import * as vscode from 'vscode';
import { MarkdownEngine } from './markdownEngine';
import { getNonce } from './getNonce';
import { buildPreviewHtml } from './htmlTemplate';

export class PreviewManager implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private markdownEngine: MarkdownEngine;
  private version = 0;
  private updateTimeout: ReturnType<typeof setTimeout> | undefined;
  private locked = false;
  private lockedDocument: vscode.TextDocument | undefined;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
    const config = vscode.workspace.getConfiguration('maraudersMapMd.render');
    this.markdownEngine = new MarkdownEngine({
      allowHtml: config.get<boolean>('allowHtml', false),
    });
  }

  openPreview(document: vscode.TextDocument): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside, true);
    } else {
      this.createPanel();
    }
    this.updatePreview(document);
  }

  toggleLock(): void {
    this.locked = !this.locked;
    if (this.locked) {
      const editor = vscode.window.activeTextEditor;
      this.lockedDocument = editor?.document;
    } else {
      this.lockedDocument = undefined;
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        this.updatePreview(editor.document);
      }
    }
    this.updatePanelTitle();
  }

  scheduleUpdate(document: vscode.TextDocument): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    const delay = this.getDebounceDelay(document);
    this.updateTimeout = setTimeout(() => {
      this.updatePreview(document);
    }, delay);
  }

  onActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
    if (this.locked) {
      return;
    }
    if (!this.panel) {
      return;
    }
    if (editor && editor.document.languageId === 'markdown') {
      this.updatePreview(editor.document);
    }
  }

  onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    if (!this.panel) {
      return;
    }

    const document = event.document;
    if (document.languageId !== 'markdown') {
      return;
    }

    if (this.locked && this.lockedDocument) {
      if (document.uri.toString() === this.lockedDocument.uri.toString()) {
        this.scheduleUpdate(document);
      }
      return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.toString() === document.uri.toString()) {
      this.scheduleUpdate(document);
    }
  }

  dispose(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.panel?.dispose();
    this.disposables.forEach(d => d.dispose());
    this.disposables.length = 0;
  }

  private createPanel(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const localResourceRoots: vscode.Uri[] = [
      vscode.Uri.joinPath(this.extensionUri, 'media'),
    ];
    if (workspaceFolders && workspaceFolders.length > 0) {
      localResourceRoots.push(workspaceFolders[0].uri);
    }

    this.panel = vscode.window.createWebviewPanel(
      'maraudersMapMd.preview',
      'MaraudersMapMD Preview',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots,
      },
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.locked = false;
      this.lockedDocument = undefined;
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = undefined;
      }
    }, null, this.disposables);
  }

  private updatePreview(document: vscode.TextDocument): void {
    if (!this.panel) {
      return;
    }

    this.version++;
    const currentVersion = this.version;
    const html = this.markdownEngine.render(document.getText());

    this.panel.webview.postMessage({
      type: 'update',
      html,
      version: currentVersion,
    });

    this.setWebviewHtml(html);
    this.updatePanelTitle();
  }

  private setWebviewHtml(body: string): void {
    if (!this.panel) {
      return;
    }

    const webview = this.panel.webview;
    const nonce = getNonce();
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'preview.css'),
    ).toString();
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'preview.js'),
    ).toString();
    const cspSource = webview.cspSource;

    webview.html = buildPreviewHtml({
      body,
      nonce,
      cspSource,
      cssUri,
      jsUri,
    });
  }

  private getDebounceDelay(document: vscode.TextDocument): number {
    const config = vscode.workspace.getConfiguration('maraudersMapMd.preview');
    const normalDelay = config.get<number>('updateDelayMs', 200);
    const largeThresholdKb = config.get<number>('largeDocThresholdKb', 512);
    const largeDelay = config.get<number>('largeDocUpdateDelayMs', 700);

    const sizeKb = Buffer.byteLength(document.getText(), 'utf8') / 1024;
    return sizeKb > largeThresholdKb ? largeDelay : normalDelay;
  }

  private updatePanelTitle(): void {
    if (!this.panel) {
      return;
    }
    const lockIcon = this.locked ? '🔒 ' : '';
    this.panel.title = `${lockIcon}MaraudersMapMD Preview`;
  }
}
