import * as vscode from 'vscode';
import { PreviewManager } from './preview/previewManager';
import { registerEditCommands } from './edit/editCommands';
import { registerImageCommands } from './images/imageCommands';

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
      previewManager.onActiveEditorChanged(editor);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      previewManager.onDocumentChanged(event);
    })
  );

  registerEditCommands(context);
  registerImageCommands(context);

  // Toggle commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.toggle.task', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // Paste to assets (deferred to v1.0)
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.images.pasteToAssets', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // Export commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.export.html', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.export.pdf', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // History commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.open', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.history.createCheckpoint', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
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
    vscode.commands.registerCommand('maraudersMapMd.history.pruneNow', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // AI commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.generateMap', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.exportSectionPack', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.buildIndex', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.copyContextBudgeted', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.insertHintRule', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.insertHintDecision', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.insertHintNote', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );
}

export function deactivate(): void {
  console.log('MaraudersMapMD extension deactivated');
}
