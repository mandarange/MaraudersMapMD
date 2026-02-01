import { describe, it, expect } from 'vitest';
import {
  wrapSelection,
  toggleWrap,
  insertAtLineStart,
  createLink,
  createHeading,
  createBlockquote,
} from '../../src/edit/formatters';

describe('formatters', () => {
  describe('wrapSelection', () => {
    it('should wrap text with before and after strings', () => {
      const result = wrapSelection('hello', '**', '**');
      expect(result).toBe('**hello**');
    });

    it('should handle empty text', () => {
      const result = wrapSelection('', '**', '**');
      expect(result).toBe('****');
    });

    it('should wrap with different before and after', () => {
      const result = wrapSelection('link', '[', ']');
      expect(result).toBe('[link]');
    });
  });

  describe('toggleWrap', () => {
    it('should add wrap if not present', () => {
      const result = toggleWrap('hello', '**', '**');
      expect(result).toBe('**hello**');
    });

    it('should remove wrap if already present', () => {
      const result = toggleWrap('**hello**', '**', '**');
      expect(result).toBe('hello');
    });

    it('should handle empty text', () => {
      const result = toggleWrap('', '**', '**');
      expect(result).toBe('****');
    });

    it('should not remove partial wraps', () => {
      const result = toggleWrap('**hello*', '**', '**');
      expect(result).toBe('****hello***');
    });

    it('should toggle italic correctly', () => {
      const result = toggleWrap('*hello*', '*', '*');
      expect(result).toBe('hello');
    });
  });

  describe('insertAtLineStart', () => {
    it('should prepend prefix to single line', () => {
      const result = insertAtLineStart('hello world', '> ');
      expect(result).toBe('> hello world');
    });

    it('should prepend prefix to each line in multiline text', () => {
      const result = insertAtLineStart('line1\nline2\nline3', '> ');
      expect(result).toBe('> line1\n> line2\n> line3');
    });

    it('should handle empty text', () => {
      const result = insertAtLineStart('', '> ');
      expect(result).toBe('> ');
    });

    it('should handle text with trailing newline', () => {
      const result = insertAtLineStart('hello\n', '> ');
      expect(result).toBe('> hello\n> ');
    });
  });

  describe('createLink', () => {
    it('should create markdown link', () => {
      const result = createLink('Google', 'https://google.com');
      expect(result).toBe('[Google](https://google.com)');
    });

    it('should handle empty text', () => {
      const result = createLink('', 'https://example.com');
      expect(result).toBe('[](https://example.com)');
    });

    it('should handle empty URL', () => {
      const result = createLink('text', '');
      expect(result).toBe('[text]()');
    });
  });

  describe('createHeading', () => {
    it('should create level 1 heading', () => {
      const result = createHeading(1, 'Title');
      expect(result).toBe('# Title');
    });

    it('should create level 2 heading', () => {
      const result = createHeading(2, 'Subtitle');
      expect(result).toBe('## Subtitle');
    });

    it('should create level 3 heading', () => {
      const result = createHeading(3, 'Section');
      expect(result).toBe('### Section');
    });

    it('should create level 6 heading', () => {
      const result = createHeading(6, 'Small');
      expect(result).toBe('###### Small');
    });

    it('should handle empty text', () => {
      const result = createHeading(1, '');
      expect(result).toBe('# ');
    });

    it('should clamp level to valid range (1-6)', () => {
      const result = createHeading(7, 'Text');
      expect(result).toBe('###### Text');
    });

    it('should clamp level 0 to 1', () => {
      const result = createHeading(0, 'Text');
      expect(result).toBe('# Text');
    });
  });

  describe('createBlockquote', () => {
    it('should prepend > to single line', () => {
      const result = createBlockquote('This is a quote');
      expect(result).toBe('> This is a quote');
    });

    it('should prepend > to each line in multiline text', () => {
      const result = createBlockquote('Line 1\nLine 2\nLine 3');
      expect(result).toBe('> Line 1\n> Line 2\n> Line 3');
    });

    it('should handle empty text', () => {
      const result = createBlockquote('');
      expect(result).toBe('> ');
    });

    it('should handle text with trailing newline', () => {
      const result = createBlockquote('Quote\n');
      expect(result).toBe('> Quote\n> ');
    });
  });
});
