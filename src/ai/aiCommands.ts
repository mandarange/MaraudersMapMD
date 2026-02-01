import * as vscode from 'vscode';
import { formatHintBlock } from './hintBlockParser';
import { getMarkdownEditor } from '../utils/editorUtils';

export function registerAiCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.insertHintRule', () => {
      insertHintAtCursor('RULE');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.insertHintDecision', () => {
      insertHintAtCursor('DECISION');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.insertHintNote', () => {
      insertHintAtCursor('CONTEXT');
    })
  );
}

function insertHintAtCursor(type: 'RULE' | 'DECISION' | 'CONTEXT'): void {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showErrorMessage('Please open a markdown file first');
    return;
  }

  const hintText = formatHintBlock(type, '');
  const cursorPos = editor.selection.active;

  editor.edit((editBuilder) => {
    editBuilder.insert(cursorPos, hintText);
  });

  // Position cursor after the prefix for user to type content
  const newPos = cursorPos.translate(0, hintText.length);
  editor.selection = new vscode.Selection(newPos, newPos);
}
