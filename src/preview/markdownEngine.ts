import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import hljs from 'highlight.js/lib/common';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';

export interface Heading {
  level: number;
  text: string;
  line: number;
  slug: string;
}

export interface RenderResult {
  html: string;
  headings: Heading[];
  lineCount: number;
}

export interface MarkdownEngineOptions {
  allowHtml: boolean;
}

export class MarkdownEngine {
  private md: MarkdownIt;

  constructor(options: MarkdownEngineOptions) {
    hljs.registerLanguage('bash', bash);
    hljs.registerLanguage('json', json);
    hljs.registerLanguage('typescript', typescript);
    this.md = new MarkdownIt({
      html: options.allowHtml,
      linkify: true,
      typographer: false,
      breaks: false,
      highlight: (code, lang) => {
        const normalized = (lang || '').trim().toLowerCase();
        if (!normalized) {
          return '';
        }
        if (normalized === 'mermaid') {
          return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
        }
        let language = normalized;
        if (normalized === 'sh' || normalized === 'shell' || normalized === 'shellscript') {
          language = 'bash';
        } else if (normalized === 'jsonc' || normalized === 'json5') {
          language = 'json';
        }
        const resolved = hljs.getLanguage(language) ? language : 'typescript';
        try {
          if (resolved === 'bash') {
            return highlightBash(code);
          }
          return hljs.highlight(code, { language: resolved }).value;
        } catch {
          return '';
        }
      },
    });

    this.md.use(taskLists, { enabled: false, label: true });

    this.md.core.ruler.push('source_line', (state) => {
      state.tokens.forEach((token) => {
        if (token.map && this.isBlockOpenToken(token.type)) {
          token.attrSet('data-source-line', String(token.map[0]));
        }
      });
    });
  }

  private isBlockOpenToken(type: string): boolean {
    return (
      type === 'paragraph_open' ||
      type === 'heading_open' ||
      type === 'list_item_open' ||
      type === 'blockquote_open' ||
      type === 'fence'
    );
  }

  render(text: string): string {
    if (!text) {
      return '';
    }
    return this.md.render(text);
  }

  renderWithMeta(text: string): RenderResult {
    const html = this.render(text);
    const headings = this.extractHeadings(text);
    const lineCount = text.split('\n').length;

    return {
      html,
      headings,
      lineCount,
    };
  }

  private extractHeadings(text: string): Heading[] {
    const headings: Heading[] = [];
    const tokens = this.md.parse(text, {});

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'heading_open' && token.map) {
        const level = parseInt(token.tag.substring(1), 10);
        const line = token.map[0];
        
        const inlineToken = tokens[i + 1];
        const text = inlineToken && inlineToken.type === 'inline' 
          ? inlineToken.content 
          : '';
        
        const slug = this.slugify(text);

        headings.push({
          level,
          text,
          line,
          slug,
        });
      }
    }

    return headings;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

function highlightBash(code: string): string {
  const lines = code.split('\n');
  return lines
    .map((line) => {
      if (!line.trim()) {
        return '';
      }
      const leading = line.match(/^\s*/)?.[0] ?? '';
      const rest = line.slice(leading.length);
      if (rest.startsWith('#')) {
        return `${leading}<span class="hljs-comment">${escapeHtml(rest)}</span>`;
      }
      const commentIndex = rest.indexOf(' #');
      const main = commentIndex === -1 ? rest : rest.slice(0, commentIndex);
      const comment = commentIndex === -1 ? '' : rest.slice(commentIndex + 1).trimStart();
      const match = main.match(/^(\S+)(.*)$/);
      if (!match) {
        return escapeHtml(line);
      }
      const command = `<span class="hljs-keyword">${escapeHtml(match[1])}</span>`;
      const tail = escapeHtml(match[2]).replace(
        /(--[\w-]+)/g,
        '<span class="hljs-attr">$1</span>'
      );
      const commentHtml = comment
        ? ` <span class="hljs-comment">${escapeHtml(comment)}</span>`
        : '';
      return `${leading}${command}${tail}${commentHtml}`;
    })
    .join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
