import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import puppeteer from 'puppeteer-core';
import { MarkdownEngine } from '../preview/markdownEngine';
import { buildExportHtml, resolveLocalImages } from './htmlTemplate';
import { detectChrome } from './chromeDetector';
import { exportToPdf } from './pdfExporter';
import { getMarkdownEditor } from '../utils/editorUtils';

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
  background-color: var(--vscode-textCodeBlock-background, #f1f5f9);
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


.hljs-keyword,
.hljs-selector-tag,
.hljs-title,
.hljs-section {
  color: var(--vscode-charts-purple, #c586c0);
}

.hljs-built_in,
.hljs-type,
.hljs-title.class_ {
  color: var(--vscode-charts-blue, #569cd6);
}

.hljs-number,
.hljs-literal {
  color: var(--vscode-charts-green, #4ec9b0);
}

.hljs-string {
  color: var(--vscode-charts-orange, #ce9178);
}

.hljs-attr,
.hljs-property {
  color: var(--vscode-charts-lightBlue, #9cdcfe);
}

.hljs-function,
.hljs-params {
  color: var(--vscode-charts-yellow, #dcdcaa);
}

.hljs-comment,
.hljs-quote {
  color: var(--vscode-descriptionForeground, #9da5b4);
}

body.vscode-dark pre code .hljs-keyword,
body.vscode-dark pre code .hljs-selector-tag,
body.vscode-dark pre code .hljs-title,
body.vscode-dark pre code .hljs-section {
  color: #d2a8ff;
}

body.vscode-dark pre code .hljs-built_in,
body.vscode-dark pre code .hljs-type,
body.vscode-dark pre code .hljs-title.class_ {
  color: #79c0ff;
}

body.vscode-dark pre code .hljs-number,
body.vscode-dark pre code .hljs-literal {
  color: #7ee787;
}

body.vscode-dark pre code .hljs-string {
  color: #ffa657;
}

body.vscode-dark pre code .hljs-attr,
body.vscode-dark pre code .hljs-property {
  color: #a5d6ff;
}

body.vscode-dark pre code .hljs-function,
body.vscode-dark pre code .hljs-params {
  color: #f2cc60;
}

body.vscode-dark pre code .hljs-comment,
body.vscode-dark pre code .hljs-quote {
  color: #8b949e;
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
  background-color: var(--vscode-editor-inactiveSelectionBackground, #e2e8f0);
}

table th,
table td {
  border: 1px solid var(--vscode-panel-border, #cbd5e1);
  padding: 6px 13px;
}

table tr {
  background-color: var(--vscode-editor-background);
  border-top: 1px solid var(--vscode-panel-border, #cbd5e1);
}

table tr:nth-child(2n) {
  background-color: var(--vscode-editor-inactiveSelectionBackground, #f8fafc);
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
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
  }
  pre code {
    color: #111827;
  }
  
  table th,
  table td {
    border: 1px solid #cbd5e1;
  }
  table th {
    background: #e2e8f0;
    color: #0f172a;
  }
  table tr {
    background: white;
  }
  table tr:nth-child(2n) {
    background: #f8fafc;
  }
  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-title,
  .hljs-section { color: #7c3aed; }
  .hljs-built_in,
  .hljs-type,
  .hljs-title.class_ { color: #1d4ed8; }
  .hljs-number,
  .hljs-literal { color: #16a34a; }
  .hljs-string { color: #c2410c; }
  .hljs-attr,
  .hljs-property { color: #1f6feb; }
  .hljs-function,
  .hljs-params { color: #b45309; }
  .hljs-comment,
  .hljs-quote { color: #6b7280; }
  }
}`;

let exportCssOverride: string | null = null;

export function registerExportCommands(context: vscode.ExtensionContext): void {
  try {
    const cssPath = path.join(context.extensionUri.fsPath, 'media', 'preview.css');
    exportCssOverride = fs.readFileSync(cssPath, 'utf8');
  } catch {
    exportCssOverride = null;
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.export.html', async () => {
      await exportHtml();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.export.pdf', async () => {
      await exportPdf();
    })
  );
}

function getExportDir(mdFileUri: vscode.Uri, mdFileName: string): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(mdFileUri);
  const root = workspaceFolder?.uri.fsPath ?? path.dirname(mdFileUri.fsPath);
  return path.join(root, 'docs', 'MaraudersMap', mdFileName);
}

function getThemeClass(): string {
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

function getThemeVars(themeClass: string): string {
  if (themeClass === 'vscode-light') {
    return `:root {
  --vscode-editor-background: #ffffff;
  --vscode-editor-foreground: #1f2328;
  --vscode-panel-border: #d0d7de;
  --vscode-descriptionForeground: #57606a;
  --vscode-textLink-foreground: #0969da;
  --vscode-textLink-activeForeground: #0550ae;
  --vscode-textCodeBlock-background: #f6f8fa;
  --vscode-toolbar-hoverBackground: rgba(175, 184, 193, 0.3);
  --vscode-toolbar-activeBackground: rgba(175, 184, 193, 0.5);
  --vscode-charts-blue: #0550ae;
  --vscode-charts-green: #116329;
  --vscode-charts-yellow: #6f3800;
  --vscode-charts-purple: #8250df;
  --vscode-charts-lightBlue: #0969da;
  --vscode-charts-orange: #c4432b;
}`;
  }
  if (themeClass === 'vscode-high-contrast' || themeClass === 'vscode-high-contrast-light') {
    return `:root {
  --vscode-editor-background: #000000;
  --vscode-editor-foreground: #ffffff;
  --vscode-panel-border: #ffffff;
  --vscode-descriptionForeground: #ffffff;
  --vscode-textLink-foreground: #3794ff;
  --vscode-textLink-activeForeground: #9cdcfe;
  --vscode-textCodeBlock-background: rgba(255, 255, 255, 0.1);
  --vscode-toolbar-hoverBackground: rgba(255, 255, 255, 0.2);
  --vscode-toolbar-activeBackground: rgba(255, 255, 255, 0.3);
  --vscode-charts-blue: #6fc3df;
  --vscode-charts-green: #3ff23f;
  --vscode-charts-yellow: #d7ba7d;
  --vscode-charts-purple: #d670d6;
  --vscode-charts-lightBlue: #9cdcfe;
  --vscode-charts-orange: #ce9178;
}`;
  }
  return `:root {
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  --vscode-panel-border: #30363d;
  --vscode-descriptionForeground: #9da5b4;
  --vscode-textLink-foreground: #4fc1ff;
  --vscode-textLink-activeForeground: #9cdcfe;
  --vscode-textCodeBlock-background: rgba(27, 31, 35, 0.3);
  --vscode-toolbar-hoverBackground: rgba(90, 93, 94, 0.31);
  --vscode-toolbar-activeBackground: rgba(90, 93, 94, 0.45);
  --vscode-charts-blue: #569cd6;
  --vscode-charts-green: #4ec9b0;
  --vscode-charts-yellow: #dcdcaa;
  --vscode-charts-purple: #c586c0;
  --vscode-charts-lightBlue: #9cdcfe;
  --vscode-charts-orange: #ce9178;
}`;
}

function getExportCss(): string {
  const themeClass = getThemeClass();
  const baseCss = exportCssOverride ?? previewCss;
  return `${getThemeVars(themeClass)}\n${baseCss}`;
}

async function exportHtml(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showErrorMessage('Please open a markdown file to export');
    return;
  }

  try {
    const renderConfig = vscode.workspace.getConfiguration('maraudersMapMd.render');
    const allowHtml = renderConfig.get<boolean>('allowHtml', true);
    const mdContent = editor.document.getText();
    const mdFileUri = editor.document.uri;
    const mdFileDir = path.dirname(mdFileUri.fsPath);
    const mdFileName = path.basename(mdFileUri.fsPath, '.md');

    const engine = new MarkdownEngine({ allowHtml });
    const rendered = engine.render(mdContent);

    let htmlContent = buildExportHtml({
      title: mdFileName,
      body: rendered,
      css: getExportCss(),
      bodyClass: getThemeClass(),
    });

    htmlContent = resolveLocalImages(htmlContent, mdFileDir, 'fileUrl');

    const exportDir = getExportDir(mdFileUri, mdFileName);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const outputPath = path.join(exportDir, `${mdFileName}.html`);
    const outputUri = vscode.Uri.file(outputPath);
    await vscode.workspace.fs.writeFile(outputUri, Buffer.from(htmlContent, 'utf8'));

    const openButton = 'Open';
    const result = await vscode.window.showInformationMessage(
      `HTML exported to docs/MaraudersMap/${mdFileName}/${mdFileName}.html`,
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

async function exportPdf(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showErrorMessage('Please open a markdown file to export');
    return;
  }

  const renderConfig = vscode.workspace.getConfiguration('maraudersMapMd.render');
  const allowHtml = renderConfig.get<boolean>('allowHtml', true);
  const config = vscode.workspace.getConfiguration('maraudersMapMd.pdf');
  const userBrowserPath = config.get<string>('browserPath', 'auto');
  const format = config.get<string>('format', 'A4');
  const marginMm = config.get<number>('marginMm', 12);
  const printBackground = config.get<boolean>('printBackground', true);
  const embedMode = config.get<string>('embedImages', 'fileUrl') as 'fileUrl' | 'dataUri';
  const openAfterExport = config.get<boolean>('openAfterExport', true);

  const browserPath = detectChrome(
    userBrowserPath === 'auto' ? null : userBrowserPath
  );

  if (!browserPath) {
    const choice = await vscode.window.showErrorMessage(
      'Chrome/Chromium browser not found. PDF export requires a Chromium-based browser.',
      'Configure Browser Path',
      'Export as HTML Instead'
    );

    if (choice === 'Configure Browser Path') {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'maraudersMapMd.pdf.browserPath'
      );
    } else if (choice === 'Export as HTML Instead') {
      await exportHtml();
    }
    return;
  }

  const mdFileUri = editor.document.uri;
  const mdFileDir = path.dirname(mdFileUri.fsPath);
  const mdFileName = path.basename(mdFileUri.fsPath, '.md');
  const mdContent = editor.document.getText();

  const exportDir = getExportDir(mdFileUri, mdFileName);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const outputPath = path.join(exportDir, `${mdFileName}.pdf`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Exporting ${mdFileName}.pdf...`,
      cancellable: false,
    },
    async () => {
      try {
        const engine = new MarkdownEngine({ allowHtml });
        const rendered = engine.render(mdContent);

        let htmlContent = buildExportHtml({
          title: mdFileName,
          body: rendered,
          css: getExportCss(),
          bodyClass: getThemeClass(),
        });

        htmlContent = resolveLocalImages(htmlContent, mdFileDir, embedMode);

        await exportToPdf(
          {
            html: htmlContent,
            outputPath,
            browserPath,
            format,
            marginMm,
            printBackground,
          },
          puppeteer.launch.bind(puppeteer)
        );

        if (openAfterExport) {
          const outputUri = vscode.Uri.file(outputPath);
          await vscode.commands.executeCommand('vscode.open', outputUri);
        } else {
          vscode.window.showInformationMessage(`PDF exported to ${outputPath}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to export PDF: ${message}`);
      }
    }
  );
}
