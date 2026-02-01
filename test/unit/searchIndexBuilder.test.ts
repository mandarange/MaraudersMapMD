import { describe, it, expect } from 'vitest';
import { buildSearchIndex, IndexEntry, SearchIndex } from '../../src/ai/searchIndexBuilder';

describe('searchIndexBuilder', () => {
  const sampleMarkdown = `# Main Title

## Section One

This is **important concept** here. Check out [this link](https://example.com).

[AI RULE] This is a critical rule for AI.

### Subsection

More content with **another keyword**.

## Section Two

Content with [another link](https://docs.example.com) and **key term**.

[AI DECISION] Important decision made here.

## Section Three

Final section with **final keyword**.
`;

  it('should create correct entry count matching section count', () => {
    const index = buildSearchIndex({
      filePath: 'test.md',
      content: sampleMarkdown,
      tokenMode: 'koreanWeighted'
    });

    expect(index.entries.length).toBe(3);
    expect(index.entries[0].section).toBe('Section One');
    expect(index.entries[1].section).toBe('Section Two');
    expect(index.entries[2].section).toBe('Section Three');
  });

  it('should extract keywords from bold text', () => {
    const index = buildSearchIndex({
      filePath: 'test.md',
      content: sampleMarkdown,
      tokenMode: 'koreanWeighted'
    });

    const entry1 = index.entries[0];
    expect(entry1.keywords).toContain('important concept');
    expect(entry1.keywords).toContain('another keyword');

    const entry2 = index.entries[1];
    expect(entry2.keywords).toContain('key term');
  });

  it('should extract links from markdown link syntax', () => {
    const index = buildSearchIndex({
      filePath: 'test.md',
      content: sampleMarkdown,
      tokenMode: 'koreanWeighted'
    });

    const entry1 = index.entries[0];
    expect(entry1.links).toContain('https://example.com');

    const entry2 = index.entries[1];
    expect(entry2.links).toContain('https://docs.example.com');
  });

  it('should detect AI hints per section', () => {
    const index = buildSearchIndex({
      filePath: 'test.md',
      content: sampleMarkdown,
      tokenMode: 'koreanWeighted'
    });

    const entry1 = index.entries[0];
    expect(entry1.aiHints.length).toBeGreaterThan(0);
    expect(entry1.aiHints[0]).toContain('[AI RULE]');

    const entry2 = index.entries[1];
    expect(entry2.aiHints.length).toBeGreaterThan(0);
    expect(entry2.aiHints[0]).toContain('[AI DECISION]');

    const entry3 = index.entries[2];
    expect(entry3.aiHints.length).toBe(0);
  });

  it('should calculate total tokens as sum of section tokens', () => {
    const index = buildSearchIndex({
      filePath: 'test.md',
      content: sampleMarkdown,
      tokenMode: 'koreanWeighted'
    });

    const sumOfSectionTokens = index.entries.reduce((sum, entry) => sum + entry.tokens, 0);
    expect(index.totalTokens).toBe(sumOfSectionTokens);
  });

  it('should produce valid output schema', () => {
    const index = buildSearchIndex({
      filePath: 'test.md',
      content: sampleMarkdown,
      tokenMode: 'koreanWeighted'
    });

    expect(index.version).toBe(1);
    expect(index.source).toBe('test.md');
    expect(typeof index.generated).toBe('string');
    expect(index.totalTokens).toBeGreaterThan(0);
    expect(Array.isArray(index.entries)).toBe(true);

    for (const entry of index.entries) {
      expect(typeof entry.section).toBe('string');
      expect(typeof entry.slug).toBe('string');
      expect(Array.isArray(entry.lineRange)).toBe(true);
      expect(entry.lineRange.length).toBe(2);
      expect(typeof entry.tokens).toBe('number');
      expect(Array.isArray(entry.keywords)).toBe(true);
      expect(Array.isArray(entry.links)).toBe(true);
      expect(typeof entry.summary).toBe('string');
      expect(Array.isArray(entry.aiHints)).toBe(true);
    }
  });
});
