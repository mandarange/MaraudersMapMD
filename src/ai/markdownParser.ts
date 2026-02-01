export interface Section {
  heading: string;
  level: number;
  startLine: number;
  endLine: number;
  content: string;
}

export function parseStructure(text: string): Section[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const lines = text.split('\n');
  const sections: Section[] = [];
  let inCodeBlock = false;
  let currentSectionStart = 0;
  let preambleContent: string[] = [];
  let foundFirstH2 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      if (!foundFirstH2) {
        if (preambleContent.length > 0) {
          sections.push({
            heading: 'preamble',
            level: 0,
            startLine: 0,
            endLine: i - 1,
            content: preambleContent.join('\n')
          });
        }
        foundFirstH2 = true;
      } else {
        const previousContent = lines.slice(currentSectionStart, i).join('\n');
        const previousHeading = lines[currentSectionStart].match(/^##\s+(.+)$/)?.[1] || '';
        
        sections.push({
          heading: previousHeading,
          level: 2,
          startLine: currentSectionStart,
          endLine: i - 1,
          content: previousContent
        });
      }
      
      currentSectionStart = i;
    } else if (!foundFirstH2) {
      preambleContent.push(line);
    }
  }

  if (foundFirstH2) {
    const lastContent = lines.slice(currentSectionStart).join('\n');
    const lastHeading = lines[currentSectionStart].match(/^##\s+(.+)$/)?.[1] || '';
    
    sections.push({
      heading: lastHeading,
      level: 2,
      startLine: currentSectionStart,
      endLine: lines.length - 1,
      content: lastContent
    });
  } else if (preambleContent.length > 0) {
    sections.push({
      heading: 'preamble',
      level: 0,
      startLine: 0,
      endLine: lines.length - 1,
      content: preambleContent.join('\n')
    });
  }

  return sections;
}

export function extractSummary(section: Section): string {
  if (!section.content || section.content.trim().length === 0) {
    return '';
  }

  const lines = section.content.split('\n');
  const parts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('```')) continue;
    if (trimmed.startsWith('#')) continue;

    const sentenceMatch = trimmed.match(/^[^.!?]+[.!?]/);
    if (sentenceMatch && parts.length === 0) {
      parts.push(sentenceMatch[0]);
    }

    const boldMatches = trimmed.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of boldMatches) {
      parts.push(match[1]);
    }
  }

  const summary = parts.join(' ');
  return summary.length > 200 ? summary.substring(0, 200) : summary;
}

export function extractKeyTerms(section: Section): string[] {
  if (!section.content || section.content.trim().length === 0) {
    return [];
  }

  const terms = new Set<string>();

  const boldMatches = section.content.matchAll(/\*\*([^*]+)\*\*/g);
  for (const match of boldMatches) {
    terms.add(match[1]);
  }

  const linkMatches = section.content.matchAll(/\[([^\]]+)\]\([^)]+\)/g);
  for (const match of linkMatches) {
    terms.add(match[1]);
  }

  const headingMatches = section.content.matchAll(/^###\s+(.+)$/gm);
  for (const match of headingMatches) {
    terms.add(match[1]);
  }

  return Array.from(terms);
}
