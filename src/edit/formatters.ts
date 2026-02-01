export function wrapSelection(text: string, before: string, after: string): string {
  return before + text + after;
}

export function toggleWrap(text: string, before: string, after: string): string {
  const isAlreadyWrapped = text.startsWith(before) && text.endsWith(after);
  if (isAlreadyWrapped) {
    return text.slice(before.length, -after.length);
  }
  return before + text + after;
}

export function insertAtLineStart(text: string, prefix: string): string {
  const lines = text.split('\n');
  return lines.map((line) => prefix + line).join('\n');
}

export function createLink(text: string, url: string): string {
  return `[${text}](${url})`;
}

export function createHeading(level: number, text: string): string {
  const validLevel = Math.max(1, Math.min(6, level));
  const hashes = '#'.repeat(validLevel);
  return `${hashes} ${text}`;
}

export function createBlockquote(text: string): string {
  return insertAtLineStart(text, '> ');
}

export function isTaskLine(line: string): boolean {
  const taskPattern = /^\s*[-*]\s+\[[xX\s]\]/;
  return taskPattern.test(line);
}

export function toggleTask(line: string): string {
  if (!isTaskLine(line)) {
    return line;
  }

  const uncheckedPattern = /^(\s*[-*]\s+)\[\s\]/;
  const checkedPattern = /^(\s*[-*]\s+)\[[xX]\]/;

  if (uncheckedPattern.test(line)) {
    return line.replace(uncheckedPattern, '$1[x]');
  }

  if (checkedPattern.test(line)) {
    return line.replace(checkedPattern, '$1[ ]');
  }

  return line;
}
