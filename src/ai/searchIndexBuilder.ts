import { parseStructure, extractKeyTerms, extractSummary } from './markdownParser';
import { estimateTokens } from './tokenEstimator';
import { generateSlug } from './sectionPackGenerator';

export interface IndexEntry {
  section: string;
  slug: string;
  lineRange: [number, number];
  tokens: number;
  keywords: string[];
  links: string[];
  summary: string;
  aiHints: string[];
}

export interface SearchIndex {
  version: 1;
  source: string;
  generated: string;
  totalTokens: number;
  entries: IndexEntry[];
}

export interface BuildSearchIndexOptions {
  filePath: string;
  content: string;
  tokenMode: 'koreanWeighted' | 'simple';
}

function extractLinks(content: string): string[] {
  const links = new Set<string>();
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2];
    if (url && !url.startsWith('#')) {
      links.add(url);
    }
  }

  return Array.from(links);
}

function extractAiHints(content: string): string[] {
  const hints: string[] = [];
  const hintPattern = /\[AI\s+(RULE|DECISION|TODO|CONTEXT)\][^\n]*/g;
  let match;

  while ((match = hintPattern.exec(content)) !== null) {
    hints.push(match[0]);
  }

  return hints;
}

export function buildSearchIndex(options: BuildSearchIndexOptions): SearchIndex {
  const { filePath, content, tokenMode } = options;
  const sections = parseStructure(content);

  const entries: IndexEntry[] = [];
  let totalTokens = 0;

  for (const section of sections) {
    if (section.heading === 'preamble') {
      continue;
    }

    const tokens = estimateTokens(section.content, tokenMode);
    const keywords = extractKeyTerms(section);
    const links = extractLinks(section.content);
    const summary = extractSummary(section);
    const aiHints = extractAiHints(section.content);
    const slug = generateSlug(section.heading);

    entries.push({
      section: section.heading,
      slug,
      lineRange: [section.startLine, section.endLine],
      tokens,
      keywords,
      links,
      summary,
      aiHints
    });

    totalTokens += tokens;
  }

  return {
    version: 1,
    source: filePath,
    generated: new Date().toISOString(),
    totalTokens,
    entries
  };
}
