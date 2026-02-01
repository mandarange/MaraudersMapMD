import { describe, it, expect } from 'vitest';
import { parseStructure, extractSummary, extractKeyTerms } from '../../src/ai/markdownParser';
import { readFileSync } from 'fs';
import { join } from 'path';

const sampleMd = readFileSync(join(__dirname, '../fixtures/sample.md'), 'utf-8');
const koreanSampleMd = readFileSync(join(__dirname, '../fixtures/korean-sample.md'), 'utf-8');

describe('parseStructure', () => {
  it('should parse H2 sections from sample.md', () => {
    const sections = parseStructure(sampleMd);
    
    expect(sections.length).toBeGreaterThan(0);
    
    const introSection = sections.find(s => s.heading === 'Introduction');
    expect(introSection).toBeDefined();
    expect(introSection?.level).toBe(2);
    expect(introSection?.startLine).toBeGreaterThanOrEqual(0);
    expect(introSection?.endLine).toBeGreaterThan(introSection!.startLine);
    expect(introSection?.content).toContain('purpose of this document');
  });

  it('should include preamble section for content before first H2', () => {
    const sections = parseStructure(sampleMd);
    
    const preamble = sections.find(s => s.heading === 'preamble');
    expect(preamble).toBeDefined();
    expect(preamble?.level).toBe(0);
    expect(preamble?.content).toContain('Sample Markdown Document');
  });

  it('should parse all H2 sections', () => {
    const sections = parseStructure(sampleMd);
    
    const headings = sections.map(s => s.heading);
    expect(headings).toContain('Introduction');
    expect(headings).toContain('Code Examples');
    expect(headings).toContain('Lists and Task Lists');
    expect(headings).toContain('Conclusion');
  });

  it('should ignore headings inside code blocks', () => {
    const text = `## Real Heading

\`\`\`markdown
## Fake Heading Inside Code
\`\`\`

## Another Real Heading`;

    const sections = parseStructure(text);
    
    const headings = sections.map(s => s.heading);
    expect(headings).toContain('Real Heading');
    expect(headings).toContain('Another Real Heading');
    expect(headings).not.toContain('Fake Heading Inside Code');
  });

  it('should handle documents with no H2 headings', () => {
    const text = `# H1 Only

Some content here.

### H3 Only

More content.`;

    const sections = parseStructure(text);
    
    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe('preamble');
    expect(sections[0].content).toContain('H1 Only');
  });

  it('should calculate correct line ranges', () => {
    const text = `Line 0
Line 1
## Section 1
Line 3
Line 4
## Section 2
Line 6
Line 7`;

    const sections = parseStructure(text);
    
    const section1 = sections.find(s => s.heading === 'Section 1');
    expect(section1?.startLine).toBe(2);
    expect(section1?.endLine).toBe(4);
    
    const section2 = sections.find(s => s.heading === 'Section 2');
    expect(section2?.startLine).toBe(5);
    expect(section2?.endLine).toBe(7);
  });

  it('should handle Korean H2 headings', () => {
    const sections = parseStructure(koreanSampleMd);
    
    const headings = sections.map(s => s.heading);
    expect(headings).toContain('소개');
    expect(headings).toContain('코드 예제');
    expect(headings).toContain('결론');
  });

  it('should preserve full content for each section', () => {
    const sections = parseStructure(sampleMd);
    
    const codeSection = sections.find(s => s.heading === 'Code Examples');
    expect(codeSection?.content).toContain('```typescript');
    expect(codeSection?.content).toContain('function greet');
    expect(codeSection?.content).toContain('```python');
  });

  it('should handle empty document', () => {
    const sections = parseStructure('');
    
    expect(sections).toHaveLength(0);
  });

  it('should handle document with only whitespace', () => {
    const sections = parseStructure('   \n\n   \n');
    
    expect(sections).toHaveLength(0);
  });
});

describe('extractSummary', () => {
  it('should extract first sentence', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: 'This is the first sentence. This is the second sentence.'
    };

    const summary = extractSummary(section);
    
    expect(summary).toContain('This is the first sentence');
    expect(summary.length).toBeLessThanOrEqual(200);
  });

  it('should include bold terms', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: 'Some text with **important term** and **another key term**.'
    };

    const summary = extractSummary(section);
    
    expect(summary).toContain('important term');
    expect(summary).toContain('another key term');
  });

  it('should trim to max 200 chars', () => {
    const longText = 'a'.repeat(300);
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: longText
    };

    const summary = extractSummary(section);
    
    expect(summary.length).toBeLessThanOrEqual(200);
  });

  it('should handle section with no sentences', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: '```code block only```'
    };

    const summary = extractSummary(section);
    
    expect(summary).toBeDefined();
    expect(summary.length).toBeLessThanOrEqual(200);
  });

  it('should handle empty content', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: ''
    };

    const summary = extractSummary(section);
    
    expect(summary).toBe('');
  });

  it('should handle Korean content', () => {
    const section = {
      heading: '소개',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: '이것은 첫 번째 문장입니다. 이것은 두 번째 문장입니다.'
    };

    const summary = extractSummary(section);
    
    expect(summary).toContain('이것은 첫 번째 문장입니다');
  });
});

describe('extractKeyTerms', () => {
  it('should extract bold text', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: 'Text with **bold term** and **another bold**.'
    };

    const terms = extractKeyTerms(section);
    
    expect(terms).toContain('bold term');
    expect(terms).toContain('another bold');
  });

  it('should extract link text', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: 'Check [this link](https://example.com) and [another](url).'
    };

    const terms = extractKeyTerms(section);
    
    expect(terms).toContain('this link');
    expect(terms).toContain('another');
  });

  it('should extract H3 headings within section', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 10,
      content: `## Main Heading

### Subheading 1

Content here.

### Subheading 2

More content.`
    };

    const terms = extractKeyTerms(section);
    
    expect(terms).toContain('Subheading 1');
    expect(terms).toContain('Subheading 2');
  });

  it('should return unique terms', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: '**term** and **term** again.'
    };

    const terms = extractKeyTerms(section);
    
    const uniqueTerms = [...new Set(terms)];
    expect(terms.length).toBe(uniqueTerms.length);
  });

  it('should handle section with no key terms', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: 'Plain text with no formatting.'
    };

    const terms = extractKeyTerms(section);
    
    expect(terms).toEqual([]);
  });

  it('should handle empty content', () => {
    const section = {
      heading: 'Test',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: ''
    };

    const terms = extractKeyTerms(section);
    
    expect(terms).toEqual([]);
  });

  it('should handle Korean bold text and links', () => {
    const section = {
      heading: '테스트',
      level: 2,
      startLine: 0,
      endLine: 5,
      content: '**굵은 텍스트**와 [링크 텍스트](url)가 있습니다.'
    };

    const terms = extractKeyTerms(section);
    
    expect(terms).toContain('굵은 텍스트');
    expect(terms).toContain('링크 텍스트');
  });
});
