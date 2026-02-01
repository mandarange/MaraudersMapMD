import { describe, it, expect } from 'vitest';
import { parseHintBlocks, formatHintBlock } from '../../src/ai/hintBlockParser';

describe('hintBlockParser', () => {
  describe('parseHintBlocks', () => {
    it('finds all hint types', () => {
      const text = `
> [AI RULE] Section 4 schema is SSOT
> [AI DECISION] Use async/await pattern
> [AI TODO] Implement error handling
> [AI CONTEXT] This is a critical path
`;
      const hints = parseHintBlocks(text);
      expect(hints).toHaveLength(4);
      expect(hints[0]).toEqual({
        type: 'RULE',
        content: 'Section 4 schema is SSOT',
        line: 1,
      });
      expect(hints[1]).toEqual({
        type: 'DECISION',
        content: 'Use async/await pattern',
        line: 2,
      });
      expect(hints[2]).toEqual({
        type: 'TODO',
        content: 'Implement error handling',
        line: 3,
      });
      expect(hints[3]).toEqual({
        type: 'CONTEXT',
        content: 'This is a critical path',
        line: 4,
      });
    });

    it('ignores hints not in blockquote', () => {
      const text = `
[AI RULE] Not a blockquote
> [AI RULE] This is a blockquote
[AI DECISION] Also not a blockquote
`;
      const hints = parseHintBlocks(text);
      expect(hints).toHaveLength(1);
      expect(hints[0].type).toBe('RULE');
      expect(hints[0].content).toBe('This is a blockquote');
    });

    it('handles multiple hints', () => {
      const text = `
> [AI RULE] First rule
> [AI RULE] Second rule
> [AI DECISION] A decision
> [AI RULE] Third rule
`;
      const hints = parseHintBlocks(text);
      expect(hints).toHaveLength(4);
      expect(hints.filter((h) => h.type === 'RULE')).toHaveLength(3);
      expect(hints.filter((h) => h.type === 'DECISION')).toHaveLength(1);
    });

    it('returns empty array for no hints', () => {
      const text = `
# Heading
Some paragraph text
> Regular blockquote without AI hints
`;
      const hints = parseHintBlocks(text);
      expect(hints).toHaveLength(0);
    });

    it('handles whitespace variations', () => {
      const text = `
> [AI RULE]Content with no space
> [AI DECISION]  Extra spaces
>  [AI TODO] Space after marker
`;
      const hints = parseHintBlocks(text);
      expect(hints).toHaveLength(3);
      expect(hints[0].content).toBe('Content with no space');
      expect(hints[1].content).toBe('Extra spaces');
      expect(hints[2].content).toBe('Space after marker');
    });

    it('tracks correct line numbers', () => {
      const text = `Line 0
> [AI RULE] Line 1
Line 2
> [AI DECISION] Line 3
Line 4`;
      const hints = parseHintBlocks(text);
      expect(hints[0].line).toBe(1);
      expect(hints[1].line).toBe(3);
    });
  });

  describe('formatHintBlock', () => {
    it('produces correct format for RULE', () => {
      const result = formatHintBlock('RULE', 'Section 4 schema is SSOT');
      expect(result).toBe('> [AI RULE] Section 4 schema is SSOT');
    });

    it('produces correct format for DECISION', () => {
      const result = formatHintBlock('DECISION', 'Use async/await pattern');
      expect(result).toBe('> [AI DECISION] Use async/await pattern');
    });

    it('produces correct format for TODO', () => {
      const result = formatHintBlock('TODO', 'Implement error handling');
      expect(result).toBe('> [AI TODO] Implement error handling');
    });

    it('produces correct format for CONTEXT', () => {
      const result = formatHintBlock('CONTEXT', 'This is important');
      expect(result).toBe('> [AI CONTEXT] This is important');
    });

    it('handles empty content', () => {
      const result = formatHintBlock('RULE', '');
      expect(result).toBe('> [AI RULE] ');
    });

    it('preserves special characters in content', () => {
      const result = formatHintBlock('RULE', 'Use $var and @decorator');
      expect(result).toBe('> [AI RULE] Use $var and @decorator');
    });
  });
});
