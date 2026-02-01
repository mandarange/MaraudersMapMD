const vscode = acquireVsCodeApi();

function applyThemeClass(cls) {
  const themeClasses = ['vscode-dark', 'vscode-light', 'vscode-high-contrast', 'vscode-high-contrast-light'];
  const root = document.documentElement;
  themeClasses.forEach((name) => {
    document.body.classList.remove(name);
    root.classList.remove(name);
  });
  if (cls) {
    document.body.classList.add(cls);
    root.classList.add(cls);
  }
}

function ensureThemeClass() {
  const themeClasses = ['vscode-dark', 'vscode-light', 'vscode-high-contrast', 'vscode-high-contrast-light'];
  const root = document.documentElement;

  const existing = themeClasses.find((cls) =>
    document.body.classList.contains(cls) || root.classList.contains(cls)
  );

  const kind = document.body.dataset.vscodeThemeKind || root.dataset.vscodeThemeKind;
  const kindClass = kind && themeClasses.includes(kind) ? kind : undefined;

  if (existing) {
    applyThemeClass(existing);
    return;
  }

  if (kindClass) {
    applyThemeClass(kindClass);
    return;
  }

  const bg = getComputedStyle(document.body).backgroundColor;
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) {
    applyThemeClass('vscode-dark');
    return;
  }

  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  applyThemeClass(luminance > 0.6 ? 'vscode-light' : 'vscode-dark');
}

ensureThemeClass();

let currentVersion = 0;
let activeEditor = null;
let suppressNextUpdate = false;

window.addEventListener('message', event => {
  const message = event.data;

  switch (message.type) {
    case 'update':
      if (message.version < currentVersion) return;
      currentVersion = message.version;
      if (suppressNextUpdate) {
        suppressNextUpdate = false;
        return;
      }
      if (activeEditor) closeInlineEditor(true);
      const root = document.getElementById('preview-root');
      if (root) root.innerHTML = message.html;
      break;

    case 'theme':
      if (message.className) {
        applyThemeClass(message.className);
      } else {
        ensureThemeClass();
      }
      break;

    case 'rawText':
      if (activeEditor && activeEditor.textarea) {
        activeEditor.textarea.value = message.text;
        activeEditor.startLine = message.startLine;
        activeEditor.endLine = message.endLine;
        autoResizeTextarea(activeEditor.textarea);
        activeEditor.textarea.focus();
      }
      break;
  }
});

document.addEventListener('click', event => {
  const btn = event.target.closest('.toolbar-btn');
  if (btn) {
    const command = btn.getAttribute('data-command');
    if (command) vscode.postMessage({ type: 'toolbarCommand', command: command });
    return;
  }
});

document.addEventListener('click', event => {
  const target = event.target;
  if (target.type === 'checkbox' && target.closest('.task-list-item')) {
    let parent = target.parentElement;
    while (parent && !parent.hasAttribute('data-source-line')) {
      parent = parent.parentElement;
    }
    if (parent) {
      const line = parseInt(parent.getAttribute('data-source-line'), 10);
      if (!isNaN(line)) {
        vscode.postMessage({ type: 'toggleCheckbox', line: line });
      }
    }
  }
});

function findSourceBlock(el) {
  let node = el;
  while (node && node.id !== 'preview-root') {
    if (node.hasAttribute && node.hasAttribute('data-source-line')) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function getBlockEndLine(block) {
  const allBlocks = document.querySelectorAll('[data-source-line]');
  const blockLine = parseInt(block.getAttribute('data-source-line'), 10);
  let nextLine = -1;

  for (const b of allBlocks) {
    const line = parseInt(b.getAttribute('data-source-line'), 10);
    if (line > blockLine) {
      if (nextLine === -1 || line < nextLine) nextLine = line;
    }
  }
  return nextLine;
}

function autoResizeTextarea(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

function openInlineEditor(block) {
  if (activeEditor) closeInlineEditor(true);

  const sourceLine = parseInt(block.getAttribute('data-source-line'), 10);
  if (isNaN(sourceLine)) return;

  const endLine = getBlockEndLine(block);

  const wrapper = document.createElement('div');
  wrapper.className = 'inline-editor-wrapper';

  const textarea = document.createElement('textarea');
  textarea.className = 'inline-editor';
  textarea.value = 'Loading...';
  textarea.spellcheck = false;

  const hint = document.createElement('div');
  hint.className = 'inline-editor-hint';
  hint.textContent = 'Esc: cancel · Cmd+Enter: save';

  wrapper.appendChild(textarea);
  wrapper.appendChild(hint);

  block.style.display = 'none';
  block.parentNode.insertBefore(wrapper, block.nextSibling);

  activeEditor = {
    block: block,
    wrapper: wrapper,
    textarea: textarea,
    startLine: sourceLine,
    endLine: endLine
  };

  textarea.addEventListener('input', () => autoResizeTextarea(textarea));

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeInlineEditor(true);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveAndClose();
    }
  });

  textarea.addEventListener('blur', (e) => {
    setTimeout(() => {
      if (activeEditor && !activeEditor.wrapper.contains(document.activeElement)) {
        saveAndClose();
      }
    }, 150);
  });

  vscode.postMessage({
    type: 'requestRawText',
    startLine: sourceLine,
    endLine: endLine
  });
}

function saveAndClose() {
  if (!activeEditor) return;

  const newText = activeEditor.textarea.value;
  suppressNextUpdate = true;

  vscode.postMessage({
    type: 'applyEdit',
    startLine: activeEditor.startLine,
    endLine: activeEditor.endLine,
    newText: newText
  });

  closeInlineEditor(false);
}

function closeInlineEditor(cancel) {
  if (!activeEditor) return;

  activeEditor.block.style.display = '';
  if (activeEditor.wrapper.parentNode) {
    activeEditor.wrapper.parentNode.removeChild(activeEditor.wrapper);
  }
  activeEditor = null;
}

document.addEventListener('dblclick', event => {
  if (event.target.closest('#toolbar')) return;
  if (event.target.closest('.inline-editor-wrapper')) return;
  if (event.target.type === 'checkbox') return;

  const block = findSourceBlock(event.target);
  if (block) {
    event.preventDefault();
    openInlineEditor(block);
  }
});

let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    vscode.setState({ scrollTop: window.scrollY, version: currentVersion });
  }, 100);
});

const previousState = vscode.getState();
if (previousState) {
  currentVersion = previousState.version || 0;
  if (previousState.scrollTop) window.scrollTo(0, previousState.scrollTop);
}
