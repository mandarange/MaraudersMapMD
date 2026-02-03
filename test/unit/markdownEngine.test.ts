import { describe, it, expect } from 'vitest';
import { MarkdownEngine } from '../../src/preview/markdownEngine';

describe('MarkdownEngine', () => {
  describe('render()', () => {
    it('should render basic markdown to HTML', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const result = engine.render('# Hello\n\nWorld');
      
      expect(result).toContain('<h1');
      expect(result).toContain('Hello');
      expect(result).toContain('<p');
      expect(result).toContain('World');
    });

    it('should inject data-source-line attributes on block elements', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '# Heading\n\nParagraph text\n\n- List item';
      const result = engine.render(markdown);
      
      // Heading should have data-source-line="0"
      expect(result).toMatch(/<h1[^>]*data-source-line="0"/);
      
      // Paragraph should have data-source-line="2"
      expect(result).toMatch(/<p[^>]*data-source-line="2"/);
      
      // List item should have data-source-line="4"
      expect(result).toMatch(/<li[^>]*data-source-line="4"/);
    });

    it('should render task lists with checkboxes', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '- [ ] Unchecked task\n- [x] Checked task';
      const result = engine.render(markdown);
      
      expect(result).toContain('type="checkbox"');
      expect(result).toContain('disabled');
      expect(result).toMatch(/checked/);
    });

    it('should escape HTML when allowHtml is false', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '<script>alert("xss")</script>\n\n<div>test</div>';
      const result = engine.render(markdown);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;div&gt;');
    });

    it('should allow HTML when allowHtml is true', () => {
      const engine = new MarkdownEngine({ allowHtml: true });
      const markdown = '<div class="custom">test</div>';
      const result = engine.render(markdown);
      
      expect(result).toContain('<div class="custom">');
    });

    it('should highlight bash fences with command tokens', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '```bash\nnpm install --save\n```';
      const result = engine.render(markdown);

      expect(result).toContain('hljs-keyword');
      expect(result).toContain('hljs-attr');
    });

    it('should highlight json fences with language tokens', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '```json\n{"name":"demo","count":2}\n```';
      const result = engine.render(markdown);

      expect(result).toContain('hljs');
    });

    it('should handle empty input', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const result = engine.render('');
      
      expect(result).toBe('');
    });

    it('should handle frontmatter-like content without crashing', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '---\ntitle: Test\n---\n\n# Content';
      const result = engine.render(markdown);
      
      // Should not crash and should render something
      expect(result).toBeTruthy();
      expect(result).toContain('Content');
    });
  });

  describe('renderWithMeta()', () => {
    it('should return html, headings, and lineCount', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '# Heading 1\n\nParagraph\n\n## Heading 2';
      const result = engine.renderWithMeta(markdown);
      
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('headings');
      expect(result).toHaveProperty('lineCount');
      expect(result.lineCount).toBe(5);
    });

    it('should extract heading structure with level, text, line, and slug', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = '# First Heading\n\nSome text\n\n## Second Heading\n\n### Third Heading';
      const result = engine.renderWithMeta(markdown);
      
      expect(result.headings).toHaveLength(3);
      
      expect(result.headings[0]).toMatchObject({
        level: 1,
        text: 'First Heading',
        line: 0,
      });
      expect(result.headings[0].slug).toBeTruthy();
      
      expect(result.headings[1]).toMatchObject({
        level: 2,
        text: 'Second Heading',
        line: 4,
      });
      
      expect(result.headings[2]).toMatchObject({
        level: 3,
        text: 'Third Heading',
        line: 6,
      });
    });

    it('should handle documents with no headings', () => {
      const engine = new MarkdownEngine({ allowHtml: false });
      const markdown = 'Just a paragraph\n\nAnother paragraph';
      const result = engine.renderWithMeta(markdown);
      
      expect(result.headings).toHaveLength(0);
      expect(result.html).toBeTruthy();
    });
  });
});
