import { describe, it, expect } from 'vitest';
import { exportWithBudget } from '../../src/ai/tokenBudgetExporter';

describe('tokenBudgetExporter', () => {
  describe('exportWithBudget', () => {
    it('should return empty string for empty document', () => {
      const result = exportWithBudget({
        content: '',
        budget: 1000,
        tokenMode: 'simple'
      });
      
      expect(result).toBe('');
    });

    it('should return full content for small document under budget', () => {
      const content = `## Introduction

This is a small document.

## Conclusion

That's all.`;
      
      const result = exportWithBudget({
        content,
        budget: 8000,
        tokenMode: 'simple'
      });
      
      expect(result).toBe(content);
    });

    it('should preserve all headings even with tight budget', () => {
      const content = `## Section One

Content for section one with lots of text that should be truncated when budget is tight.

## Section Two

Content for section two with lots of text that should be truncated when budget is tight.

## Section Three

Content for section three with lots of text that should be truncated when budget is tight.`;
      
      const result = exportWithBudget({
        content,
        budget: 100,
        tokenMode: 'simple'
      });
      
      expect(result).toContain('## Section One');
      expect(result).toContain('## Section Two');
      expect(result).toContain('## Section Three');
    });

    it('should preserve all AI hint blocks', () => {
      const content = `## Introduction

Some content here.

> [AI RULE] This is a critical rule.

More content.

> [AI DECISION] This is an important decision.

## Implementation

> [AI TODO] This needs to be done.

Some implementation details.

> [AI CONTEXT] Background information.`;
      
      const result = exportWithBudget({
        content,
        budget: 200,
        tokenMode: 'simple'
      });
      
      expect(result).toContain('[AI RULE] This is a critical rule.');
      expect(result).toContain('[AI DECISION] This is an important decision.');
      expect(result).toContain('[AI TODO] This needs to be done.');
      expect(result).toContain('[AI CONTEXT] Background information.');
    });

    it('should add truncation markers when sections are cut', () => {
      const content = `## Long Section

This is a very long section with multiple sentences. It contains a lot of information that will exceed the token budget. We need to ensure that when this section is truncated, it happens at a sentence boundary and includes a truncation marker.

More content here that should be cut off.`;
      
      const result = exportWithBudget({
        content,
        budget: 50,
        tokenMode: 'simple'
      });
      
      expect(result).toMatch(/\[\.\.\..*truncated/i);
    });

    it('should produce smaller output for 1k budget than 8k budget', () => {
      const longParagraph = 'This is a sentence that adds content to reach the token budget. '.repeat(20);
      const content = `## Introduction

${longParagraph}

## Details

${longParagraph}

## Implementation

${longParagraph}

## Advanced Topics

${longParagraph}

## Conclusion

${longParagraph}`;
      
      const result1k = exportWithBudget({
        content,
        budget: 1000,
        tokenMode: 'simple'
      });
      
      const result8k = exportWithBudget({
        content,
        budget: 8000,
        tokenMode: 'simple'
      });
      
      expect(result1k.length).toBeLessThan(result8k.length);
    });

    it('should keep output token estimate within budget with 20% tolerance', () => {
      const content = `## Section One

Content for section one. This has some text.

## Section Two

Content for section two. This has more text that goes on for a while.

## Section Three

Content for section three with additional information.`;
      
      const budget = 100;
      const result = exportWithBudget({
        content,
        budget,
        tokenMode: 'simple'
      });
      
      // Simple token estimation: length / 4
      const estimatedTokens = Math.ceil(result.length / 4);
      const tolerance = budget * 0.2;
      
      expect(estimatedTokens).toBeLessThanOrEqual(budget + tolerance);
    });

    it('should truncate at sentence boundaries (last period or newline)', () => {
      const content = `## Section

First sentence here. Second sentence here. Third sentence here. Fourth sentence here.`;
      
      const result = exportWithBudget({
        content,
        budget: 30,
        tokenMode: 'simple'
      });
      
      // Should not cut mid-sentence
      const contentPart = result.split('[')[0]; // Before truncation marker
      if (contentPart.includes('sentence')) {
        // If any sentence is included, it should end with a period or be complete
        const lastChar = contentPart.trim().slice(-1);
        expect(['.', '\n', '']).toContain(lastChar);
      }
    });

    it('should handle koreanWeighted token mode', () => {
      const content = `## 소개

한글 콘텐츠입니다.

## Details

English content here.`;
      
      const result = exportWithBudget({
        content,
        budget: 2000,
        tokenMode: 'koreanWeighted'
      });
      
      expect(result).toContain('## 소개');
      expect(result).toContain('## Details');
    });

    it('should maintain section boundaries and not mix content from different sections', () => {
      const content = `## Section A

Content A1. Content A2.

## Section B

Content B1. Content B2.`;
      
      const result = exportWithBudget({
        content,
        budget: 50,
        tokenMode: 'simple'
      });
      
      // If Section A is included, its content should not be mixed with Section B
      const sections = result.split('##').filter(s => s.trim());
      sections.forEach(section => {
        const hasA = section.includes('Content A');
        const hasB = section.includes('Content B');
        // Should not have both A and B content in same section
        expect(hasA && hasB).toBe(false);
      });
    });
  });
});
