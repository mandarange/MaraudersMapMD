import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

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
    this.md = new MarkdownIt({
      html: options.allowHtml,
      linkify: true,
      typographer: false,
      breaks: false,
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
