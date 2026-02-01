import * as vscode from 'vscode';
import {
  toggleWrap,
  createLink,
  createHeading,
  createBlockquote,
  toggleTask,
} from './formatters';

export function registerEditCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.format.bold', () => {
      formatBold();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.format.italic', () => {
      formatItalic();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.format.inlineCode', () => {
      formatInlineCode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.insert.link', () => {
      insertLink();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.insert.heading', () => {
      insertHeading();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.insert.quote', () => {
      insertQuote();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.toggle.task', () => {
      toggleTaskCheckbox();
    })
  );
}

function formatBold(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      const selectedText = editor.document.getText(selection);
      const formatted = toggleWrap(selectedText, '**', '**');
      editBuilder.replace(selection, formatted);
    }
  });
}

function formatItalic(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      const selectedText = editor.document.getText(selection);
      const formatted = toggleWrap(selectedText, '*', '*');
      editBuilder.replace(selection, formatted);
    }
  });
}

function formatInlineCode(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      const selectedText = editor.document.getText(selection);
      const formatted = toggleWrap(selectedText, '`', '`');
      editBuilder.replace(selection, formatted);
    }
  });
}

async function insertLink(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  const url = await vscode.window.showInputBox({
    prompt: 'Enter URL',
    placeHolder: 'https://example.com',
  });

  if (url === undefined) {
    return;
  }

  const link = createLink(selectedText, url);
  editor.edit((editBuilder) => {
    editBuilder.replace(selection, link);
  });
}

async function insertHeading(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  const levelItem = await vscode.window.showQuickPick(
    ['1', '2', '3', '4', '5', '6'].map((level) => ({
      label: `Heading ${level}`,
      description: `${'#'.repeat(parseInt(level))} Heading`,
      level: parseInt(level),
    })),
    {
      placeHolder: 'Select heading level',
    }
  );

  if (!levelItem) {
    return;
  }

  const heading = createHeading(levelItem.level, selectedText);
  editor.edit((editBuilder) => {
    editBuilder.replace(selection, heading);
  });
}

function insertQuote(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      const selectedText = editor.document.getText(selection);
      const quoted = createBlockquote(selectedText);
      editBuilder.replace(selection, quoted);
    }
  });
}

function toggleTaskCheckbox(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      const line = editor.document.lineAt(selection.start.line);
      const toggled = toggleTask(line.text);
      editBuilder.replace(line.range, toggled);
    }
  });
}
