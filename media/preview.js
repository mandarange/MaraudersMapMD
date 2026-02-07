const vscode = acquireVsCodeApi();

/* ── Force Light Mode ── */

const LIGHT_VARS = {
  '--vscode-editor-background': '#ffffff',
  '--vscode-editor-foreground': '#1f2328',
  '--vscode-panel-border': '#d0d7de',
  '--vscode-descriptionForeground': '#57606a',
  '--vscode-textLink-foreground': '#0969da',
  '--vscode-textLink-activeForeground': '#0550ae',
  '--vscode-focusBorder': '#0969da',
  '--vscode-input-background': '#ffffff',
  '--vscode-input-foreground': '#1f2328',
  '--vscode-charts-blue': '#0550ae',
  '--vscode-charts-green': '#116329',
  '--vscode-charts-yellow': '#6f3800',
  '--vscode-charts-purple': '#8250df',
  '--vscode-charts-lightBlue': '#0969da',
  '--vscode-charts-orange': '#c4432b',
  '--vscode-toolbar-hoverBackground': 'rgba(175, 184, 193, 0.3)',
  '--vscode-toolbar-activeBackground': 'rgba(175, 184, 193, 0.5)',
  '--vscode-editor-inactiveSelectionBackground': '#e2e8f0',
  '--vscode-textCodeBlock-background': '#f6f8fa',
  '--vscode-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

let isApplyingLightMode = false;

function forceLightMode() {
  if (isApplyingLightMode) return;
  isApplyingLightMode = true;

  try {
    const root = document.documentElement;
    const body = document.body;

    // Remove dark/HC theme classes
    ['vscode-dark', 'vscode-high-contrast', 'vscode-high-contrast-light'].forEach((cls) => {
      body.classList.remove(cls);
      root.classList.remove(cls);
    });

    // Force light mode class
    body.classList.add('vscode-light');
    root.classList.add('vscode-light');

    // Override all VS Code CSS variables with light mode values
    Object.entries(LIGHT_VARS).forEach(([key, value]) => {
      root.style.setProperty(key, value, 'important');
    });

    // Force white background directly on html and body
    root.style.setProperty('background-color', '#ffffff', 'important');
    root.style.setProperty('color', '#1f2328', 'important');
    body.style.setProperty('background-color', '#ffffff', 'important');
    body.style.setProperty('color', '#1f2328', 'important');
  } finally {
    isApplyingLightMode = false;
  }
}

// Apply immediately
forceLightMode();

// Watch for VS Code re-injecting dark theme styles/classes
const observer = new MutationObserver((mutations) => {
  if (isApplyingLightMode) return;
  for (const m of mutations) {
    if (m.type === 'attributes') {
      const target = m.target;
      if (target === document.documentElement || target === document.body) {
        // VS Code changed style or class — re-force light mode
        forceLightMode();
        return;
      }
    }
  }
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['style', 'class', 'data-vscode-theme-kind', 'data-vscode-theme-name'],
});
observer.observe(document.body, {
  attributes: true,
  attributeFilter: ['style', 'class', 'data-vscode-theme-kind', 'data-vscode-theme-name'],
});

/* ── Mermaid Rendering ── */

let mermaidLoaded = false;
let pendingMermaidRender = false;

window.addEventListener('mermaid-ready', () => {
  mermaidLoaded = true;
  if (pendingMermaidRender) {
    pendingMermaidRender = false;
    renderMermaid();
  }
});

async function renderMermaid() {
  if (!window.__mermaid) {
    pendingMermaidRender = true;
    return;
  }
  const blocks = document.querySelectorAll('pre.mermaid:not([data-processed])');
  if (blocks.length === 0) return;
  try {
    await window.__mermaid.run({ nodes: Array.from(blocks) });
  } catch (e) {
    console.error('Mermaid render error:', e);
  }
}

/* ── State ── */

let currentVersion = 0;
let activeEditor = null;
let suppressNextUpdate = false;

/* ── Message Handling ── */

window.addEventListener('message', (event) => {
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
      if (root) {
        root.innerHTML = message.html;
        renderMermaid();
      }
      break;

    case 'theme':
      // Always force light mode regardless of VS Code theme changes
      forceLightMode();
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

/* ── Toolbar ── */

document.addEventListener('click', (event) => {
  const btn = event.target.closest('.toolbar-btn');
  if (btn) {
    const command = btn.getAttribute('data-command');
    if (command) vscode.postMessage({ type: 'toolbarCommand', command: command });
    return;
  }
});

/* ── Checkbox Toggle ── */

document.addEventListener('click', (event) => {
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

/* ── Inline Editor ── */

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
    endLine: endLine,
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
    endLine: endLine,
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
    newText: newText,
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

document.addEventListener('dblclick', (event) => {
  if (event.target.closest('#toolbar')) return;
  if (event.target.closest('.inline-editor-wrapper')) return;
  if (event.target.type === 'checkbox') return;
  // Don't open inline editor for mermaid diagrams
  if (event.target.closest('.mermaid')) return;

  const block = findSourceBlock(event.target);
  if (block) {
    event.preventDefault();
    openInlineEditor(block);
  }
});

/* ── Scroll Sync ── */

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

/* ── Initial Mermaid Render ── */

renderMermaid();
