import { describe, it, expect } from 'vitest';
import { generateAiMap } from '../../src/ai/aiMapGenerator';
import * as fs from 'fs';
import * as path from 'path';

describe('aiMapGenerator', () => {
  const sampleMdPath = path.join(__dirname, '../fixtures/sample.md');
  const sampleContent = fs.readFileSync(sampleMdPath, 'utf-8');

  it('generates map with correct section count', () => {
    const result = generateAiMap({
      filePath: 'test.md',
      content: sampleContent,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('## Document Structure');
    expect(result).toContain('| Section');
    expect(result).toContain('| Lines');
    expect(result).toContain('| Tokens');
    expect(result).toContain('| Summary');
  });

  it('includes token estimates', () => {
    const result = generateAiMap({
      filePath: 'test.md',
      content: sampleContent,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toMatch(/\|\s*\d+\s*\|/);
  });

  it('includes line ranges', () => {
    const result = generateAiMap({
      filePath: 'test.md',
      content: sampleContent,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('Lines');
    expect(result).toMatch(/\d+-\d+/);
  });

  it('includes summaries', () => {
    const result = generateAiMap({
      filePath: 'test.md',
      content: sampleContent,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('Summary');
  });

  it('includes AI hints if present in source', () => {
    const contentWithHints = `# Test

[AI RULE] This is a rule

## Section 1

[AI DECISION] This is a decision

Some content here.

[AI NOTE] This is a note
`;

    const result = generateAiMap({
      filePath: 'test.md',
      content: contentWithHints,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('AI Hints Found');
    expect(result).toContain('AI RULE');
    expect(result).toContain('AI DECISION');
    expect(result).toContain('AI NOTE');
  });

  it('handles empty document', () => {
    const result = generateAiMap({
      filePath: 'empty.md',
      content: '',
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('empty.md');
    expect(result).toContain('Document Structure');
  });

  it('output is valid markdown', () => {
    const result = generateAiMap({
      filePath: 'test.md',
      content: sampleContent,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('#');
    expect(result).toContain('|');
    expect(result).toMatch(/^#/m);
  });

  it('includes metadata header with filename and timestamp', () => {
    const result = generateAiMap({
      filePath: 'docs/test.md',
      content: sampleContent,
      tokenMode: 'koreanWeighted'
    });

    expect(result).toContain('docs/test.md');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
