import * as vscode from 'vscode';
import { getNonce } from '../preview/getNonce';

export class UsagePanel implements vscode.Disposable {
  private static currentPanel: UsagePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private readonly disposables: vscode.Disposable[] = [];

  static show(context: vscode.ExtensionContext): void {
    if (UsagePanel.currentPanel) {
      UsagePanel.currentPanel.panel.reveal(UsagePanel.currentPanel.panel.viewColumn);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'maraudersMapMd.usage',
      'MaraudersMapMD Usage Guide',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    UsagePanel.currentPanel = new UsagePanel(panel, context);
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.context = context;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.buildHtml();

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        if (!message) return;
        if (message.type === 'command' && typeof message.command === 'string') {
          try {
            await vscode.commands.executeCommand(message.command);
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Command failed: ${msg}`);
          }
        }
      },
      null,
      this.disposables,
    );
  }

  dispose(): void {
    UsagePanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) disposable.dispose();
    }
  }

  private buildHtml(): string {
    const webview = this.panel.webview;
    const nonce = getNonce();
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'usage.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'usage.js')
    );
    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${cssUri}">
  <title>MaraudersMapMD Usage</title>
</head>
<body>
  <header>
    <h1>MaraudersMapMD Usage Guide</h1>
    <p>Practical usage patterns for preview, AI readability, history, and export.</p>
  </header>
  <main>
    <section>
      <h2>Quick Start</h2>
      <ul>
        <li>Open a Markdown file and use <code>Open Preview to Side</code>.</li>
        <li>Use the top toolbar for export, AI artifacts, history, and prompt tools.</li>
        <li>Keep files saved to enable AI artifacts and history.</li>
      </ul>
    </section>

    <section>
      <h2>Readability-First Markdown</h2>
      <h3>Structure</h3>
      <ul>
        <li>Use clean heading hierarchy (#, ##, ###) without skipping levels.</li>
        <li>Prefer short paragraphs and bullets for dense content.</li>
        <li>Use tables for settings, options, and comparisons.</li>
      </ul>
      <h3>Emphasis</h3>
      <ul>
        <li>Use bold for key terms, inline code for identifiers and commands.</li>
        <li>Use blockquotes for critical notes, not for general prose.</li>
        <li>Use AI Hint Blocks for must-read content: <code>&gt; [AI RULE]</code>, <code>&gt; [AI DECISION]</code>, <code>&gt; [AI TODO]</code>, <code>&gt; [AI CONTEXT]</code>.</li>
      </ul>
      <div class="tip">
        Tip: Use the Rewrite Prompt button in the preview toolbar to copy the readability prompt.
        <button data-action="copy-readability-prompt">Copy Prompt</button>
      </div>
    </section>

    <section>
      <h2>History & Checkpoints</h2>
      <ul>
        <li>Open History to view snapshots and restore or diff when needed.</li>
        <li>Create a checkpoint before major edits.</li>
      </ul>
    </section>

    <section>
      <h2>Export</h2>
      <ul>
        <li>Export HTML for shareable preview.</li>
        <li>Export PDF for distribution-ready documents.</li>
      </ul>
    </section>
  </main>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}
