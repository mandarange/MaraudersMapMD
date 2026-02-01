import { parseStructure, extractSummary, extractKeyTerms } from './markdownParser';
import { estimateTokens, TokenEstimationMode } from './tokenEstimator';

export interface AiMapOptions {
  filePath: string;
  content: string;
  tokenMode: TokenEstimationMode;
}

export function generateAiMap(options: AiMapOptions): string {
  const { filePath, content, tokenMode } = options;
  
  const sections = parseStructure(content);
  const timestamp = new Date().toISOString().split('T')[0];
  
  let markdown = '';
  
  markdown += `# AI Map: ${filePath}\n\n`;
  markdown += `**Source Path**: ${filePath}\n`;
  markdown += `**Generated**: ${timestamp}\n`;
  
  const totalTokens = sections.reduce((sum, section) => {
    return sum + estimateTokens(section.content, tokenMode);
  }, 0);
  markdown += `**Total Tokens**: ${totalTokens}\n\n`;
  
  markdown += '## Document Structure\n\n';
  markdown += '| Section | Lines | Tokens | Summary |\n';
  markdown += '|---------|-------|--------|----------|\n';
  
  for (const section of sections) {
    const tokens = estimateTokens(section.content, tokenMode);
    const lineRange = `${section.startLine}-${section.endLine}`;
    const summary = extractSummary(section);
    const displaySummary = summary.length > 50 ? summary.substring(0, 50) + '...' : summary;
    
    markdown += `| ${section.heading} | ${lineRange} | ${tokens} | ${displaySummary} |\n`;
  }
  
  markdown += '\n';
  
  markdown += '## Section Details\n\n';
  
  for (const section of sections) {
    const tokens = estimateTokens(section.content, tokenMode);
    const keyTerms = extractKeyTerms(section);
    const summary = extractSummary(section);
    
    markdown += `### ${section.heading}\n\n`;
    markdown += `- **Lines**: ${section.startLine}-${section.endLine}\n`;
    markdown += `- **Tokens**: ${tokens}\n`;
    
    if (summary) {
      markdown += `- **Summary**: ${summary}\n`;
    }
    
    if (keyTerms.length > 0) {
      markdown += `- **Key Terms**: ${keyTerms.join(', ')}\n`;
    }
    
    markdown += '\n';
  }
  
  // AI Hints Found
  const aiHints = extractAiHints(content);
  if (aiHints.length > 0) {
    markdown += '## AI Hints Found\n\n';
    for (const hint of aiHints) {
      markdown += `- **${hint.type}** (Line ${hint.line}): ${hint.text}\n`;
    }
    markdown += '\n';
  }
  
  return markdown;
}

interface AiHint {
  type: string;
  line: number;
  text: string;
}

function extractAiHints(content: string): AiHint[] {
  const hints: AiHint[] = [];
  const lines = content.split('\n');
  
  const hintPatterns = [
    { regex: /^\s*\[AI RULE\]\s*(.+)$/, type: 'AI RULE' },
    { regex: /^\s*\[AI DECISION\]\s*(.+)$/, type: 'AI DECISION' },
    { regex: /^\s*\[AI NOTE\]\s*(.+)$/, type: 'AI NOTE' }
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of hintPatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        hints.push({
          type: pattern.type,
          line: i + 1,
          text: match[1]
        });
      }
    }
  }
  
  return hints;
}
