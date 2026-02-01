export interface HintBlock {
  type: 'RULE' | 'DECISION' | 'TODO' | 'CONTEXT';
  content: string;
  line: number;
}

/**
 * Parses AI hint blocks from markdown text.
 * Finds lines matching: > [AI RULE], > [AI DECISION], > [AI TODO], > [AI CONTEXT]
 * @param text - The markdown text to parse
 * @returns Array of HintBlock objects with type, content, and line number
 */
export function parseHintBlocks(text: string): HintBlock[] {
  const pattern = /^>\s*\[AI\s+(RULE|DECISION|TODO|CONTEXT)\]\s*(.+)$/gm;
  const hints: HintBlock[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Calculate line number by counting newlines before match position
    const beforeMatch = text.substring(0, match.index);
    const lineNumber = beforeMatch.split('\n').length - 1;

    hints.push({
      type: match[1] as 'RULE' | 'DECISION' | 'TODO' | 'CONTEXT',
      content: match[2],
      line: lineNumber,
    });
  }

  return hints;
}

/**
 * Formats a hint block into markdown blockquote syntax.
 * @param type - The hint type (RULE, DECISION, TODO, CONTEXT)
 * @param content - The hint content
 * @returns Formatted string: > [AI {TYPE}] {content}
 */
export function formatHintBlock(type: string, content: string): string {
  return `> [AI ${type}] ${content}`;
}
