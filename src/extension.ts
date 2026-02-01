import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  console.log('MaraudersMapMD extension activated');

  // Preview commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.openPreviewToSide', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.togglePreviewLock', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // Format commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.format.bold', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.format.italic', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.format.inlineCode', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // Insert commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.insert.link', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.insert.heading', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.insert.quote', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // Toggle commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.toggle.task', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

  // Image commands
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.images.insertFromFile', () => {
      vscode.window.showInformationMessage('Not implemented yet');
    })
  );

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
