const vscode = acquireVsCodeApi();

function formatSize(sizeBytes) {
  const kb = sizeBytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function renderEmpty(message) {
  const root = document.getElementById('history-root');
  if (!root) return;
  root.innerHTML = `<div class="empty">${message}</div>`;
}

function renderSnapshots(data) {
  const root = document.getElementById('history-root');
  if (!root) return;

  const items = data.snapshots || [];
  if (!items.length) {
    renderEmpty('No snapshots found for this file.');
    return;
  }

  const html = items.map((s) => {
    const date = new Date(s.timestamp).toLocaleString();
    const label = s.label ? s.label : (s.isCheckpoint ? 'checkpoint' : 'auto');
    const size = formatSize(s.sizeBytes);
    const badgeClass = s.isCheckpoint ? 'badge checkpoint' : 'badge';
    const compression = s.compressed ? 'compressed' : 'raw';

    return `
      <div class="item" data-id="${s.id}">
        <div class="item-header">
          <div class="item-title">${date}</div>
          <div class="badge ${badgeClass}">${label}</div>
        </div>
        <div class="item-meta">${size} · ${compression}</div>
        <div class="actions">
          <button data-action="view" data-id="${s.id}">View</button>
          <button data-action="diff" data-id="${s.id}">Diff</button>
          <button data-action="restore" data-id="${s.id}">Restore</button>
          <button data-action="copy" data-id="${s.id}">Copy</button>
        </div>
      </div>
    `;
  }).join('');

  root.innerHTML = `<div class="list">${html}</div>`;
}

document.addEventListener('click', (event) => {
  const refresh = event.target.closest('button[data-action="refresh"]');
  if (refresh) {
    vscode.postMessage({ type: 'refresh' });
    return;
  }

  const button = event.target.closest('button[data-action]');
  if (button) {
    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    if (action && id) {
      vscode.postMessage({ type: 'action', action, id });
    }
    return;
  }
});

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message) return;

  if (message.type === 'snapshots') {
    renderSnapshots(message);
  } else if (message.type === 'empty') {
    renderEmpty(message.message || 'No snapshots found for this file.');
  } else if (message.type === 'error') {
    renderEmpty(message.message || 'Failed to load snapshots.');
  } else if (message.type === 'header') {
    const title = document.getElementById('history-title');
    const subtitle = document.getElementById('history-subtitle');
    if (title) title.textContent = message.title || 'History';
    if (subtitle) subtitle.textContent = message.subtitle || '';
  }
});

vscode.postMessage({ type: 'ready' });
