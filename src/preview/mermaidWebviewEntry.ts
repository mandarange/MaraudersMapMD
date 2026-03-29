import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  flowchart: { useMaxWidth: true, htmlLabels: true },
  sequence: { useMaxWidth: true },
  gantt: { useMaxWidth: true },
});

declare global {
  interface Window {
    __mermaid: typeof mermaid;
  }
}

window.__mermaid = mermaid;
window.dispatchEvent(new Event('mermaid-ready'));
