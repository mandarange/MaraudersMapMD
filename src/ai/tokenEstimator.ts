export type TokenEstimationMode = 'koreanWeighted' | 'simple';

export interface Section {
  heading: string;
  level: number;
  startLine: number;
  endLine: number;
  content: string;
}

export interface SectionWithTokens extends Section {
  tokens: number;
}

const KOREAN_HANGUL_START = 0xAC00;
const KOREAN_HANGUL_END = 0xD7AF;
const KOREAN_JAMO_START = 0x3130;
const KOREAN_JAMO_END = 0x318F;

const KOREAN_CHAR_WEIGHT = 2.5;
const ENGLISH_WORD_WEIGHT = 1.3;
const PUNCTUATION_WEIGHT = 0.25;

function isKoreanChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= KOREAN_HANGUL_START && code <= KOREAN_HANGUL_END) ||
         (code >= KOREAN_JAMO_START && code <= KOREAN_JAMO_END);
}

function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

function isPunctuation(char: string): boolean {
  return /[^\w\s\uAC00-\uD7AF\u3130-\u318F]/.test(char);
}

export function estimateTokens(text: string, mode: TokenEstimationMode): number {
  if (text.length === 0) {
    return 0;
  }

  if (mode === 'simple') {
    return Math.ceil(text.length / 4);
  }

  let tokenCount = 0;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (isKoreanChar(char)) {
      tokenCount += KOREAN_CHAR_WEIGHT;
      i++;
    } else if (isWhitespace(char)) {
      tokenCount += PUNCTUATION_WEIGHT;
      i++;
    } else if (isPunctuation(char)) {
      tokenCount += PUNCTUATION_WEIGHT;
      i++;
    } else {
      let wordEnd = i;
      while (wordEnd < text.length && 
             !isWhitespace(text[wordEnd]) && 
             !isPunctuation(text[wordEnd]) &&
             !isKoreanChar(text[wordEnd])) {
        wordEnd++;
      }
      
      if (wordEnd > i) {
        tokenCount += ENGLISH_WORD_WEIGHT;
        i = wordEnd;
      } else {
        i++;
      }
    }
  }

  return Math.ceil(tokenCount);
}

export function estimateTokensPerSection(sections: Section[]): SectionWithTokens[] {
  return sections.map(section => ({
    ...section,
    tokens: estimateTokens(section.content, 'koreanWeighted')
  }));
}
