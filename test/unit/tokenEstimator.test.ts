import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateTokensPerSection } from '../../src/ai/tokenEstimator';

describe('estimateTokens', () => {
  describe('simple mode', () => {
    it('should estimate tokens for English text', () => {
      const text = 'Hello world this is a test';
      const tokens = estimateTokens(text, 'simple');
      // 26 chars / 4 = 6.5 → ceil = 7
      expect(tokens).toBe(7);
    });

    it('should estimate tokens for Korean text', () => {
      const text = '안녕하세요 세계';
      const tokens = estimateTokens(text, 'simple');
      // 8 chars / 4 = 2 → ceil = 2
      expect(tokens).toBe(2);
    });

    it('should handle empty string', () => {
      const tokens = estimateTokens('', 'simple');
      expect(tokens).toBe(0);
    });

    it('should round up fractional tokens', () => {
      const text = 'abc'; // 3 chars / 4 = 0.75 → ceil = 1
      const tokens = estimateTokens(text, 'simple');
      expect(tokens).toBe(1);
    });

    it('should handle large text', () => {
      const text = 'a'.repeat(1000);
      const tokens = estimateTokens(text, 'simple');
      // 1000 / 4 = 250
      expect(tokens).toBe(250);
    });
  });

  describe('koreanWeighted mode', () => {
    it('should estimate tokens for pure English text', () => {
      const text = 'Hello world this is a test';
      // 6 words * 1.3 = 7.8 + spaces/punctuation ≈ 9-10
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThanOrEqual(7);
      expect(tokens).toBeLessThanOrEqual(11);
    });

    it('should estimate tokens for pure Korean text', () => {
      const text = '안녕하세요';
      // 5 Korean chars * 2.5 = 12.5 → ceil = 13
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThanOrEqual(12);
      expect(tokens).toBeLessThanOrEqual(14);
    });

    it('should estimate tokens for mixed Korean and English', () => {
      const text = '안녕 hello 세계 world';
      // 2 Korean chars * 2.5 = 5
      // 2 Korean chars * 2.5 = 5
      // 2 English words * 1.3 = 2.6
      // 3 spaces * 0.25 = 0.75
      // Total ≈ 13.35 → ceil = 14
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThanOrEqual(12);
      expect(tokens).toBeLessThanOrEqual(16);
    });

    it('should handle Korean Hangul characters (AC00-D7AF)', () => {
      const text = '가나다라마바사'; // 7 Korean chars
      // 7 * 2.5 = 17.5 → ceil = 18
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThanOrEqual(17);
      expect(tokens).toBeLessThanOrEqual(19);
    });

    it('should handle Korean Jamo characters (3130-318F)', () => {
      const text = 'ㄱㄴㄷㄹㅁ'; // 5 Jamo chars
      // 5 * 2.5 = 12.5 → ceil = 13
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThanOrEqual(12);
      expect(tokens).toBeLessThanOrEqual(14);
    });

    it('should count punctuation correctly', () => {
      const text = '...!!!???'; // 9 punctuation chars
      // 9 * 0.25 = 2.25 → ceil = 3
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThanOrEqual(2);
      expect(tokens).toBeLessThanOrEqual(4);
    });

    it('should handle empty string', () => {
      const tokens = estimateTokens('', 'koreanWeighted');
      expect(tokens).toBe(0);
    });

    it('should handle text with code blocks', () => {
      const text = '```typescript\nfunction test() {}\n```';
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle markdown formatting', () => {
      const text = '**bold** *italic* `code`';
      const tokens = estimateTokens(text, 'koreanWeighted');
      expect(tokens).toBeGreaterThan(0);
    });
  });
});

describe('estimateTokensPerSection', () => {
  it('should annotate sections with token counts', () => {
    const sections = [
      {
        heading: 'Introduction',
        level: 2,
        startLine: 0,
        endLine: 5,
        content: 'This is a test section with some content.'
      },
      {
        heading: 'Conclusion',
        level: 2,
        startLine: 6,
        endLine: 10,
        content: 'This is the conclusion.'
      }
    ];

    const result = estimateTokensPerSection(sections);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('heading', 'Introduction');
    expect(result[0]).toHaveProperty('tokens');
    expect(result[0].tokens).toBeGreaterThan(0);
    expect(result[1]).toHaveProperty('heading', 'Conclusion');
    expect(result[1]).toHaveProperty('tokens');
    expect(result[1].tokens).toBeGreaterThan(0);
  });

  it('should handle empty sections array', () => {
    const result = estimateTokensPerSection([]);
    expect(result).toEqual([]);
  });

  it('should handle sections with Korean content', () => {
    const sections = [
      {
        heading: '소개',
        level: 2,
        startLine: 0,
        endLine: 5,
        content: '이것은 한글 테스트 섹션입니다.'
      }
    ];

    const result = estimateTokensPerSection(sections);

    expect(result).toHaveLength(1);
    expect(result[0].tokens).toBeGreaterThan(0);
  });

  it('should preserve all section properties', () => {
    const sections = [
      {
        heading: 'Test',
        level: 2,
        startLine: 10,
        endLine: 20,
        content: 'Test content'
      }
    ];

    const result = estimateTokensPerSection(sections);

    expect(result[0]).toHaveProperty('heading', 'Test');
    expect(result[0]).toHaveProperty('level', 2);
    expect(result[0]).toHaveProperty('startLine', 10);
    expect(result[0]).toHaveProperty('endLine', 20);
    expect(result[0]).toHaveProperty('content', 'Test content');
    expect(result[0]).toHaveProperty('tokens');
  });
});
