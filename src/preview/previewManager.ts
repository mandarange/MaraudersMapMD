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
  private webviewInitialized = false;
  private currentDocument: vscode.TextDocument | undefined;
  private suppressNextAutoOpen = false;
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

  shouldAutoOpenFor(editor: vscode.TextEditor | undefined): editor is vscode.TextEditor {
    if (this.suppressNextAutoOpen) {
      this.suppressNextAutoOpen = false;
      return false;
    }
    return !!(editor && editor.document.languageId === 'markdown');
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

    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        if (!this.panel) {
          return;
        }
        this.panel.webview.postMessage({
          type: 'theme',
          className: this.getThemeClass(),
        });
      })
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      this.locked = false;
      this.lockedDocument = undefined;
      this.webviewInitialized = false;
      this.currentDocument = undefined;
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = undefined;
      }
    }, null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.type === 'toggleCheckbox') {
          await this.handleToggleCheckbox(message.line);
        } else if (message.type === 'toolbarCommand') {
          await this.handleToolbarCommand(message.command);
        } else if (message.type === 'requestRawText') {
          await this.handleRequestRawText(message.startLine, message.endLine);
        } else if (message.type === 'applyEdit') {
          await this.handleApplyEdit(message.startLine, message.endLine, message.newText);
        }
      },
      null,
      this.disposables,
    );
  }

  private async handleToolbarCommand(command: string): Promise<void> {
    if (command !== 'ai.copyReadabilityPrompt') {
      // Ensure the markdown editor is active so command handlers can find activeTextEditor
      const mdEditor = vscode.window.visibleTextEditors.find(
        (e) => e.document.languageId === 'markdown',
      );
      const doc = this.currentDocument ?? mdEditor?.document;
      if (doc && !mdEditor) {
        this.suppressNextAutoOpen = true;
        try {
          await vscode.window.showTextDocument(doc.uri, { preserveFocus: true, preview: true });
        } catch { /* document may have been closed */ }
      }
    }
    try {
      await vscode.commands.executeCommand(`maraudersMapMd.${command}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Command failed: ${errMsg}`);
    }
  }

  private async handleToggleCheckbox(lineNumber: number): Promise<void> {
    const document = this.getActiveMarkdownDocument();
    if (!document) {
      return;
    }

    if (lineNumber < 0 || lineNumber >= document.lineCount) {
      return;
    }

    const line = document.lineAt(lineNumber);
    const text = line.text;
    let newText: string;

    if (text.includes('- [ ]')) {
      newText = text.replace('- [ ]', '- [x]');
    } else if (text.includes('- [x]')) {
      newText = text.replace('- [x]', '- [ ]');
    } else if (text.includes('* [ ]')) {
      newText = text.replace('* [ ]', '* [x]');
    } else if (text.includes('* [x]')) {
      newText = text.replace('* [x]', '* [ ]');
    } else {
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, line.range, newText);
    await vscode.workspace.applyEdit(edit);
  }

  private getActiveMarkdownDocument(): vscode.TextDocument | undefined {
    if (this.locked && this.lockedDocument) {
      return this.lockedDocument;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      return editor.document;
    }
    if (this.currentDocument && this.currentDocument.languageId === 'markdown') {
      return this.currentDocument;
    }
    return undefined;
  }

  private async handleRequestRawText(startLine: number, endLine: number): Promise<void> {
    const document = this.getActiveMarkdownDocument();
    if (!document || !this.panel) return;

    const lastLine = endLine === -1 ? document.lineCount : endLine;
    const clampedEnd = Math.min(lastLine, document.lineCount);
    const lines: string[] = [];
    for (let i = startLine; i < clampedEnd; i++) {
      lines.push(document.lineAt(i).text);
    }

    this.panel.webview.postMessage({
      type: 'rawText',
      text: lines.join('\n'),
      startLine,
      endLine: clampedEnd,
    });
  }

  private async handleApplyEdit(startLine: number, endLine: number, newText: string): Promise<void> {
    const document = this.getActiveMarkdownDocument();
    if (!document) return;

    const clampedEnd = Math.min(endLine, document.lineCount);
    const startPos = new vscode.Position(startLine, 0);
    const endPos = clampedEnd >= document.lineCount
      ? document.lineAt(document.lineCount - 1).range.end
      : new vscode.Position(clampedEnd, 0);

    const range = new vscode.Range(startPos, endPos);
    const trailingNewline = clampedEnd < document.lineCount ? '\n' : '';

    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, newText + trailingNewline);
    await vscode.workspace.applyEdit(edit);
  }

  private updatePreview(document: vscode.TextDocument): void {
    if (!this.panel) {
      return;
    }

    this.currentDocument = document;
    this.version++;
    const currentVersion = this.version;
    const html = this.markdownEngine.render(document.getText());

    if (!this.webviewInitialized) {
      this.setWebviewHtml(html);
      this.webviewInitialized = true;
    } else {
      this.panel.webview.postMessage({
        type: 'update',
        html,
        version: currentVersion,
      });
    }

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

    const themeClass = this.getThemeClass();

    webview.html = buildPreviewHtml({
      body,
      nonce,
      cspSource,
      cssUri,
      jsUri,
      themeClass,
    });
  }

  private getThemeClass(): string {
    const kind = vscode.window.activeColorTheme.kind;
    switch (kind) {
      case vscode.ColorThemeKind.Light:
        return 'vscode-light';
      case vscode.ColorThemeKind.HighContrastLight:
        return 'vscode-high-contrast-light';
      case vscode.ColorThemeKind.HighContrast:
        return 'vscode-high-contrast';
      case vscode.ColorThemeKind.Dark:
      default:
        return 'vscode-dark';
    }
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
