import { parseStructure } from './markdownParser';

export interface SectionFile {
  filename: string;
  content: string;
  heading: string;
  lineRange: [number, number];
}

export function generateSlug(heading: string): string {
  if (!heading || heading.trim().length === 0) {
    return '';
  }

  let slug = heading
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u0080-\uFFFF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length > 50) {
    slug = slug.substring(0, 50);
    slug = slug.replace(/-+$/, '');
  }

  return slug;
}

export function generateSectionPack(options: {
  filePath: string;
  content: string;
}): SectionFile[] {
  const { filePath, content } = options;
  const sections = parseStructure(content);

  if (sections.length === 0) {
    return [];
  }

  const hasH2Sections = sections.some(s => s.heading !== 'preamble');
  const sectionsToProcess = hasH2Sections
    ? sections.filter(s => s.heading !== 'preamble')
    : sections;

  const sectionFiles: SectionFile[] = [];

  sectionsToProcess.forEach((section, index) => {
    const paddedNumber = String(index + 1).padStart(2, '0');
    const slug = section.heading === 'preamble' ? 'preamble' : generateSlug(section.heading);
    const filename = `${paddedNumber}-${slug}.md`;
    const metadataComment = `<!-- Section from: ${filePath} | Lines: ${section.startLine + 1}-${section.endLine + 1} -->\n\n`;
    const fileContent = metadataComment + section.content;

    sectionFiles.push({
      filename,
      content: fileContent,
      heading: section.heading,
      lineRange: [section.startLine, section.endLine]
    });
  });

  return sectionFiles;
}
