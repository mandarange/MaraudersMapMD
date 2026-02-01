import * as vscode from 'vscode';
import { join } from 'path';

export function getHistoryDirectory(
  context: vscode.ExtensionContext,
  workspaceFolder: vscode.WorkspaceFolder
): string {
  const config = vscode.workspace.getConfiguration('maraudersMapMd.history');
  const storageLocation = config.get<string>('storageLocation', 'workspace');

  if (storageLocation === 'globalStorage') {
    return context.globalStorageUri.fsPath;
  }
  return join(workspaceFolder.uri.fsPath, '.maraudersmapmd', 'history');
}
