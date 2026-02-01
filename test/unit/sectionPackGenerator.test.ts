import { describe, it, expect } from 'vitest';
import { generateSectionPack, generateSlug, SectionFile } from '../../src/ai/sectionPackGenerator';

describe('sectionPackGenerator', () => {
  describe('generateSlug', () => {
    it('converts heading to lowercase', () => {
      expect(generateSlug('Introduction')).toBe('introduction');
    });

    it('replaces spaces with hyphens', () => {
      expect(generateSlug('Getting Started')).toBe('getting-started');
    });

    it('removes non-alphanumeric characters', () => {
      expect(generateSlug('API Reference & Guide')).toBe('api-reference-guide');
    });

    it('handles Korean headings', () => {
      expect(generateSlug('시작하기')).toBe('시작하기');
    });

    it('handles mixed Korean and English', () => {
      expect(generateSlug('시작하기 Getting Started')).toBe('시작하기-getting-started');
    });

    it('limits slug to 50 characters', () => {
      const longHeading = 'This is a very long heading that should be truncated to fifty characters maximum';
      const slug = generateSlug(longHeading);
      expect(slug.length).toBeLessThanOrEqual(50);
    });

    it('handles empty heading', () => {
      expect(generateSlug('')).toBe('');
    });

    it('removes multiple consecutive hyphens', () => {
      expect(generateSlug('Hello  --  World')).toBe('hello-world');
    });

    it('removes leading and trailing hyphens', () => {
      expect(generateSlug('---Hello World---')).toBe('hello-world');
    });

    it('handles special characters', () => {
      expect(generateSlug('C++ Programming')).toBe('c-programming');
    });
  });

  describe('generateSectionPack', () => {
    it('generates correct number of section files', () => {
      const content = `# Main Title

## Introduction
This is the introduction section.

## Requirements
This is the requirements section.

## Implementation
This is the implementation section.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections.length).toBe(3);
    });

    it('uses zero-padded numbering in filenames', () => {
      const content = `# Main Title

## Section One
Content one.

## Section Two
Content two.

## Section Three
Content three.

## Section Four
Content four.

## Section Five
Content five.

## Section Six
Content six.

## Section Seven
Content seven.

## Section Eight
Content eight.

## Section Nine
Content nine.

## Section Ten
Content ten.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].filename).toMatch(/^01-/);
      expect(sections[8].filename).toMatch(/^09-/);
      expect(sections[9].filename).toMatch(/^10-/);
    });

    it('generates slugified filenames from headings', () => {
      const content = `# Main Title

## Getting Started
Content here.

## API Reference
Content here.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].filename).toBe('01-getting-started.md');
      expect(sections[1].filename).toBe('02-api-reference.md');
    });

    it('includes source metadata comment in content', () => {
      const content = `# Main Title

## Introduction
This is the introduction.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].content).toContain('<!-- Section from: test.md');
      expect(sections[0].content).toContain('Lines:');
    });

    it('includes original section content after metadata', () => {
      const content = `# Main Title

## Introduction
This is the introduction.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].content).toContain('## Introduction');
      expect(sections[0].content).toContain('This is the introduction.');
    });

    it('handles document with no H2 sections', () => {
      const content = `# Main Title

This is just content without H2 sections.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections.length).toBe(1);
      expect(sections[0].heading).toBe('preamble');
    });

    it('handles empty sections', () => {
      const content = `# Main Title

## Section One

## Section Two
Content here.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections.length).toBe(2);
      expect(sections[0].content).toContain('## Section One');
    });

    it('preserves line numbers in metadata', () => {
      const content = `# Main Title

## Introduction
Content here.

## Requirements
More content.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].content).toMatch(/Lines: \d+-\d+/);
    });

    it('returns SectionFile interface with all required properties', () => {
      const content = `# Main Title

## Test Section
Content here.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      const section = sections[0];

      expect(section).toHaveProperty('filename');
      expect(section).toHaveProperty('content');
      expect(section).toHaveProperty('heading');
      expect(section).toHaveProperty('lineRange');
      expect(Array.isArray(section.lineRange)).toBe(true);
      expect(section.lineRange.length).toBe(2);
    });

    it('handles Korean headings in filenames', () => {
      const content = `# Main Title

## 시작하기
Korean content.

## 요구사항
More Korean content.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].filename).toMatch(/^01-.*\.md$/);
      expect(sections[1].filename).toMatch(/^02-.*\.md$/);
      expect(sections[0].heading).toBe('시작하기');
      expect(sections[1].heading).toBe('요구사항');
    });

    it('handles special characters in filenames', () => {
      const content = `# Main Title

## API & Reference
Content here.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      expect(sections[0].filename).toBe('01-api-reference.md');
    });

    it('handles very long headings with truncation', () => {
      const longHeading = 'This is an extremely long heading that should be truncated to the maximum allowed length';
      const content = `# Main Title

## ${longHeading}
Content here.`;

      const sections = generateSectionPack({ filePath: 'test.md', content });
      const filename = sections[0].filename;
      const slug = filename.replace(/^01-/, '').replace(/\.md$/, '');
      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });
});
