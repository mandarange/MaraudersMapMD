const vscode = acquireVsCodeApi();

document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;

  const type = action.getAttribute('data-action');
  if (type === 'copy-readability-prompt') {
    vscode.postMessage({ type: 'command', command: 'maraudersMapMd.ai.copyReadabilityPrompt' });
  } else if (type === 'copy-ppt-prompt') {
    vscode.postMessage({ type: 'command', command: 'maraudersMapMd.ai.copyPptPrompt' });
  } else if (type === 'copy-fact-check-prompt') {
    vscode.postMessage({ type: 'command', command: 'maraudersMapMd.ai.copyFactCheckPrompt' });
  }
});
