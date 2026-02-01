import * as vscode from 'vscode';
import * as path from 'path';
import { MarkdownEngine } from '../preview/markdownEngine';
import { buildExportHtml, resolveLocalImages } from './htmlTemplate';

const previewCss = `/* MaraudersMapMD Preview Styles */

/* VS Code Theme Integration */
body {
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
  font-size: 14px;
  line-height: 1.6;
  padding: 20px;
  margin: 0;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

h1 { font-size: 2em; border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8); padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8); padding-bottom: 0.3em; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; color: var(--vscode-descriptionForeground, #6a737d); }

/* Paragraphs */
p {
  margin-top: 0;
  margin-bottom: 16px;
}

/* Links */
a {
  color: var(--vscode-textLink-foreground, #0366d6);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Lists */
ul, ol {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

li + li {
  margin-top: 0.25em;
}

/* Task Lists */
.task-list-item {
  list-style-type: none;
}

.task-list-item input[type="checkbox"] {
  margin: 0 0.5em 0.25em -1.6em;
  vertical-align: middle;
  cursor: pointer;
}

/* Code */
code {
  background-color: var(--vscode-textCodeBlock-background, rgba(27, 31, 35, 0.05));
  border-radius: 3px;
  font-family: var(--vscode-editor-font-family, 'SF Mono', Monaco, Menlo, Consolas, monospace);
  font-size: 85%;
  padding: 0.2em 0.4em;
}

pre {
  background-color: var(--vscode-textCodeBlock-background, #f6f8fa);
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin-top: 0;
  margin-bottom: 16px;
}

pre code {
  background-color: transparent;
  border: 0;
  display: inline;
  line-height: inherit;
  margin: 0;
  padding: 0;
  overflow: visible;
  word-wrap: normal;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid var(--vscode-panel-border, #dfe2e5);
  color: var(--vscode-descriptionForeground, #6a737d);
  margin: 0 0 16px 0;
  padding: 0 1em;
}

blockquote > :first-child {
  margin-top: 0;
}

blockquote > :last-child {
  margin-bottom: 0;
}

/* Tables */
table {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  margin-top: 0;
  margin-bottom: 16px;
}

table th {
  font-weight: 600;
  background-color: var(--vscode-editor-inactiveSelectionBackground, #f6f8fa);
}

table th,
table td {
  border: 1px solid var(--vscode-panel-border, #dfe2e5);
  padding: 6px 13px;
}

table tr {
  background-color: var(--vscode-editor-background);
  border-top: 1px solid var(--vscode-panel-border, #c6cbd1);
}

table tr:nth-child(2n) {
  background-color: var(--vscode-editor-inactiveSelectionBackground, #f6f8fa);
}

/* Horizontal Rule */
hr {
  border: 0;
  border-top: 1px solid var(--vscode-panel-border, #e1e4e8);
  height: 0;
  margin: 24px 0;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px 0;
}

/* Print Styles */
@media print {
  body {
    background: white;
    color: black;
  }
  
  a {
    color: #0366d6;
  }
  
  pre, code {
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
  }
  
  table th,
  table td {
    border: 1px solid #dfe2e5;
  }
}`;

export function registerExportCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.export.html', async () => {
      await exportHtml();
    })
  );
}

async function exportHtml(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showErrorMessage('Please open a markdown file to export');
    return;
  }

  try {
    const mdContent = editor.document.getText();
    const mdFileUri = editor.document.uri;
    const mdFileDir = path.dirname(mdFileUri.fsPath);
    const mdFileName = path.basename(mdFileUri.fsPath, '.md');

    const engine = new MarkdownEngine({ allowHtml: false });
    const rendered = engine.render(mdContent);

    let htmlContent = buildExportHtml({
      title: mdFileName,
      body: rendered,
      css: previewCss,
    });

    htmlContent = resolveLocalImages(htmlContent, mdFileDir, 'fileUrl');

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(mdFileUri);
    const defaultUri = workspaceFolder
      ? vscode.Uri.joinPath(workspaceFolder.uri, 'exports', `${mdFileName}.html`)
      : vscode.Uri.file(path.join(mdFileDir, 'exports', `${mdFileName}.html`));

    const outputUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { 'HTML Files': ['html'] },
    });

    if (!outputUri) {
      return;
    }

    await vscode.workspace.fs.writeFile(outputUri, Buffer.from(htmlContent, 'utf8'));

    const openButton = 'Open';
    const result = await vscode.window.showInformationMessage(
      `HTML exported to ${path.basename(outputUri.fsPath)}`,
      openButton
    );

    if (result === openButton) {
      await vscode.commands.executeCommand('vscode.open', outputUri);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to export HTML: ${message}`);
  }
}
