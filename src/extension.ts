import * as vscode from 'vscode';
import { PreviewManager } from './preview/previewManager';
import { registerEditCommands } from './edit/editCommands';
import { registerImageCommands } from './images/imageCommands';
import { registerExportCommands } from './export/exportCommands';
import {
  registerHistoryListeners,
  openHistoryCommand,
  createCheckpointCommand,
  pruneNowCommand,
} from './history/historyCommands';
import { registerAiCommands } from './ai/aiCommands';
import { registerAiListeners } from './ai/aiService';

export function activate(context: vscode.ExtensionContext): void {
  const previewManager = new PreviewManager(context.extensionUri);
  context.subscriptions.push(previewManager);

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.openPreviewToSide', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        previewManager.openPreview(editor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.togglePreviewLock', () => {
      previewManager.toggleLock();
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (previewManager.shouldAutoOpenFor(editor)) {
        previewManager.openPreview(editor.document);
      }
      previewManager.onActiveEditorChanged(editor);
    })
  );

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.languageId === 'markdown') {
    previewManager.openPreview(activeEditor.document);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      previewManager.onDocumentChanged(event);
    })
  );

  registerEditCommands(context);
  registerImageCommands(context);
  registerExportCommands(context);
  registerHistoryListeners(context);
  registerAiCommands(context);
  registerAiListeners(context);

  // Paste to assets (deferred to v1.0)
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.images.pasteToAssets', () => {
      vscode.window.showInformationMessage('Paste to Assets is not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.open', () => openHistoryCommand(context))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.createCheckpoint', () =>
      createCheckpointCommand(context)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.diffWithCurrent', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.restoreSnapshot', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.pruneNow', () => pruneNowCommand(context))
  );

}

export function deactivate(): void {
  console.log('MaraudersMapMD extension deactivated');
}
