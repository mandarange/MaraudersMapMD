import { parseStructure } from './markdownParser';
import { estimateTokens, TokenEstimationMode } from './tokenEstimator';

export interface ExportOptions {
  content: string;
  budget: number;
  tokenMode: string;
}

export const PRESET_BUDGETS = {
  '1k': 1000,
  '2k': 2000,
  '4k': 4000,
  '8k': 8000
} as const;

const AI_HINT_PATTERNS = [
  />\s*\[AI RULE\][^\n]*/g,
  />\s*\[AI DECISION\][^\n]*/g,
  />\s*\[AI TODO\][^\n]*/g,
  />\s*\[AI CONTEXT\][^\n]*/g
];

function extractAIHints(content: string): string[] {
  const hints: string[] = [];
  
  for (const pattern of AI_HINT_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      hints.push(match[0]);
    }
  }
  
  return hints;
}

function truncateAtSentenceBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength);
  
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const boundary = Math.max(lastPeriod, lastNewline);
  
  if (boundary > 0) {
    return truncated.substring(0, boundary + 1);
  }
  
  return truncated;
}

function removeAIHintsFromContent(content: string): string {
  let result = content;
  
  for (const pattern of AI_HINT_PATTERNS) {
    result = result.replace(pattern, '');
  }
  
  return result;
}

export function exportWithBudget(options: ExportOptions): string {
  const { content, budget, tokenMode } = options;
  
  if (!content || content.trim().length === 0) {
    return '';
  }
  
  const mode = tokenMode as TokenEstimationMode;
  
  const totalTokens = estimateTokens(content, mode);
  if (totalTokens <= budget) {
    return content;
  }
  
  const sections = parseStructure(content);
  const result: string[] = [];
  let usedTokens = 0;
  
  for (const section of sections) {
    const sectionHeading = section.level === 2 ? `## ${section.heading}` : '';
    const sectionHints = extractAIHints(section.content);
    
    const sectionContentWithoutHints = removeAIHintsFromContent(section.content);
    const contentWithoutHeadingAndHints = sectionContentWithoutHints
      .replace(/^##\s+.+$/m, '')
      .trim();
    
    const sectionParts: string[] = [];
    
    if (sectionHeading) {
      sectionParts.push(sectionHeading);
    }
    
    if (sectionHints.length > 0) {
      sectionParts.push(...sectionHints);
    }
    
    const headingAndHintsText = sectionParts.join('\n\n');
    const headingAndHintsTokens = estimateTokens(headingAndHintsText, mode);
    
    if (usedTokens + headingAndHintsTokens > budget) {
      break;
    }
    
    const remainingBudget = budget - usedTokens - headingAndHintsTokens;
    
    if (contentWithoutHeadingAndHints.length > 0) {
      const estimatedCharsAvailable = Math.floor(remainingBudget * 4);
      
      const truncatedContent = truncateAtSentenceBoundary(
        contentWithoutHeadingAndHints,
        estimatedCharsAvailable
      );
      
      const wasTruncated = truncatedContent.trim().length > 0 && 
                          truncatedContent.length < contentWithoutHeadingAndHints.length;
      
      if (truncatedContent.trim().length > 0) {
        sectionParts.push(truncatedContent);
        
        if (wasTruncated) {
          sectionParts.push(`[... truncated, see full section: ${section.heading}]`);
        }
      }
    }
    
    const sectionOutput = sectionParts.join('\n\n');
    const sectionTokens = estimateTokens(sectionOutput, mode);
    
    if (usedTokens + sectionTokens <= budget) {
      result.push(sectionOutput);
      usedTokens += sectionTokens;
    } else if (sectionHeading) {
      result.push(sectionHeading);
      if (sectionHints.length > 0) {
        result.push(sectionHints.join('\n\n'));
      }
      break;
    } else {
      break;
    }
  }
  
  return result.join('\n\n');
}
