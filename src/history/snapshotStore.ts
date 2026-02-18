import { createHash } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { join } from 'path';

export interface Snapshot {
  id: string;
  filePath: string;
  timestamp: number;
  label?: string;
  isCheckpoint: boolean;
  hash: string;
  sizeBytes: number;
  compressed: boolean;
}

export interface SnapshotIndex {
  version: 1;
  snapshots: Snapshot[];
}

const COMPRESSION_THRESHOLD = 1024;
export type SnapshotCompression = 'none' | 'gzip';

export function computeHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function compressContent(content: string, mode: SnapshotCompression = 'gzip'): Buffer {
  if (mode === 'none') {
    return Buffer.from(content, 'utf8');
  }
  if (content.length < COMPRESSION_THRESHOLD) {
    return Buffer.from(content, 'utf8');
  }
  return gzipSync(content, { level: 6 });
}

export function decompressContent(buffer: Buffer): string {
  try {
    return gunzipSync(buffer).toString('utf8');
  } catch {
    return buffer.toString('utf8');
  }
}

export function createSnapshotId(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
}

export function buildSnapshotPath(
  historyDir: string,
  filePath: string,
  snapshotId: string
): string {
  const fileDir = filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
  const fileName = filePath.replace(/\\/g, '/').split('/').pop() || 'snapshot';
  const baseName = fileName.replace(/\.[^.]+$/, '');

  if (fileDir) {
    return join(historyDir, fileDir, `${baseName}.${snapshotId}.md`);
  }
  return join(historyDir, `${baseName}.${snapshotId}.md`);
}

export function buildIndexPath(historyDir: string, filePath: string): string {
  const fileDir = filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
  const fileName = filePath.replace(/\\/g, '/').split('/').pop() || 'snapshot';
  const baseName = fileName.replace(/\.[^.]+$/, '');

  if (fileDir) {
    return join(historyDir, fileDir, `${baseName}.index.json`);
  }
  return join(historyDir, `${baseName}.index.json`);
}

export function isDuplicate(content: string, latestHash: string | undefined): boolean {
  if (latestHash === undefined) {
    return false;
  }
  const currentHash = computeHash(content);
  return currentHash === latestHash;
}

export function readIndex(
  indexPath: string,
  readFile: (path: string) => string
): SnapshotIndex {
  try {
    const content = readFile(indexPath);
    const parsed = JSON.parse(content);
    return {
      version: 1,
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    };
  } catch {
    return {
      version: 1,
      snapshots: [],
    };
  }
}

export function writeIndex(
  indexPath: string,
  index: SnapshotIndex,
  writeFile: (path: string, content: string) => void
): void {
  const content = JSON.stringify(index, null, 2);
  writeFile(indexPath, content);
}
