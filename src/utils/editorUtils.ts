import * as vscode from 'vscode';

export function getMarkdownEditor(): vscode.TextEditor | undefined {
  const active = vscode.window.activeTextEditor;
  if (active && active.document.languageId === 'markdown') {
    return active;
  }
  return vscode.window.visibleTextEditors.find(
    (e) => e.document.languageId === 'markdown',
  );
}
