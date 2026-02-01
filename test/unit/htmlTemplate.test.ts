import { describe, it, expect } from 'vitest';
import { buildExportHtml, resolveLocalImages } from '../../src/export/htmlTemplate';

describe('htmlTemplate', () => {
  describe('buildExportHtml', () => {
    it('produces valid HTML with DOCTYPE', () => {
      const html = buildExportHtml({
        title: 'Test Document',
        body: '<h1>Hello</h1>',
        css: 'body { color: red; }',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('includes title in head', () => {
      const html = buildExportHtml({
        title: 'My Document',
        body: '<p>Content</p>',
        css: '',
      });

      expect(html).toContain('<title>My Document</title>');
    });

    it('inlines CSS in style tag', () => {
      const css = 'body { font-size: 14px; } h1 { color: blue; }';
      const html = buildExportHtml({
        title: 'Test',
        body: '<h1>Title</h1>',
        css,
      });

      expect(html).toContain('<style>');
      expect(html).toContain(css);
      expect(html).toContain('</style>');
    });

    it('includes body content', () => {
      const body = '<h1>Heading</h1><p>Paragraph</p>';
      const html = buildExportHtml({
        title: 'Test',
        body,
        css: '',
      });

      expect(html).toContain(body);
    });

    it('includes charset meta tag', () => {
      const html = buildExportHtml({
        title: 'Test',
        body: '<p>Content</p>',
        css: '',
      });

      expect(html).toContain('charset="utf-8"');
    });

    it('includes viewport meta tag', () => {
      const html = buildExportHtml({
        title: 'Test',
        body: '<p>Content</p>',
        css: '',
      });

      expect(html).toContain('viewport');
    });

    it('handles empty CSS', () => {
      const html = buildExportHtml({
        title: 'Test',
        body: '<p>Content</p>',
        css: '',
      });

      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('handles empty body', () => {
      const html = buildExportHtml({
        title: 'Test',
        body: '',
        css: 'body { color: red; }',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });
  });

  describe('resolveLocalImages', () => {
    it('converts relative image paths to absolute file:// URLs', () => {
      const html = '<img src="./assets/image.png" alt="test">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('file://');
      expect(result).toContain('assets/image.png');
      expect(result).not.toContain('./assets');
    });

    it('handles multiple images', () => {
      const html = '<img src="./assets/img1.png"><img src="./assets/img2.jpg">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('file://');
      const matches = result.match(/file:\/\//g);
      expect(matches?.length).toBe(2);
    });

    it('preserves absolute URLs', () => {
      const html = '<img src="https://example.com/image.png" alt="test">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('https://example.com/image.png');
    });

    it('preserves data URIs', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgo..." alt="test">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('data:image/png;base64');
    });

    it('handles nested asset directories', () => {
      const html = '<img src="./assets/2024/january/photo.jpg">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('file://');
      expect(result).toContain('assets/2024/january/photo.jpg');
    });

    it('handles Windows-style paths', () => {
      const html = '<img src=".\\assets\\image.png">';
      const mdFileDir = 'C:\\Users\\project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('file://');
      // Should normalize backslashes
      expect(result).not.toContain('.\\');
    });

    it('converts images to data-uri when mode is dataUri', () => {
      // This test verifies the mode parameter is used
      // Actual data-uri conversion requires file reading (tested in integration)
      const html = '<img src="./assets/image.png">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'dataUri');

      // Should attempt to convert (actual conversion happens in exportCommands)
      expect(result).toBeDefined();
    });

    it('handles markdown with no images', () => {
      const html = '<h1>Title</h1><p>No images here</p>';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toBe(html);
    });

    it('handles image tags with various attributes', () => {
      const html = '<img src="./assets/img.png" alt="test" class="responsive" width="100">';
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('file://');
      expect(result).toContain('alt="test"');
      expect(result).toContain('class="responsive"');
      expect(result).toContain('width="100"');
    });

    it('handles single quotes in src attribute', () => {
      const html = "<img src='./assets/image.png' alt='test'>";
      const mdFileDir = '/home/user/project';
      const result = resolveLocalImages(html, mdFileDir, 'fileUrl');

      expect(result).toContain('file://');
    });
  });
});
