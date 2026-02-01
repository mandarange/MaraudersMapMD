// MaraudersMapMD Preview Script

// CRITICAL: Call acquireVsCodeApi ONCE
const vscode = acquireVsCodeApi();

// Track current version to prevent out-of-order updates
let currentVersion = 0;

// Message listener for updates from extension
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.type) {
    case 'update':
      // Ignore out-of-order updates
      if (message.version < currentVersion) {
        console.log(`Ignoring out-of-order update: ${message.version} < ${currentVersion}`);
        return;
      }
      
      currentVersion = message.version;
      const root = document.getElementById('preview-root');
      if (root) {
        root.innerHTML = message.html;
      }
      break;
  }
});

// Checkbox toggle handler
document.addEventListener('click', event => {
  const target = event.target;
  
  // Check if clicked element is a checkbox in a task list
  if (target.type === 'checkbox' && target.closest('.task-list-item')) {
    // Find the parent element with data-source-line attribute
    let parent = target.parentElement;
    while (parent && !parent.hasAttribute('data-source-line')) {
      parent = parent.parentElement;
    }
    
    if (parent) {
      const line = parseInt(parent.getAttribute('data-source-line'), 10);
      if (!isNaN(line)) {
        // Send message to extension to toggle checkbox in source
        vscode.postMessage({
          type: 'toggleCheckbox',
          line: line
        });
      }
    }
  }
});

// State persistence: save scroll position
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    vscode.setState({
      scrollTop: window.scrollY,
      version: currentVersion
    });
  }, 100);
});

// Restore previous state on load
const previousState = vscode.getState();
if (previousState) {
  currentVersion = previousState.version || 0;
  if (previousState.scrollTop) {
    window.scrollTo(0, previousState.scrollTop);
  }
}
