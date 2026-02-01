import { describe, it, expect } from 'vitest';
import {
  computeHash,
  compressContent,
  decompressContent,
  createSnapshotId,
  buildSnapshotPath,
  buildIndexPath,
  isDuplicate,
  readIndex,
  writeIndex,
  Snapshot,
  SnapshotIndex,
} from '../../src/history/snapshotStore';

describe('snapshotStore', () => {
  describe('computeHash', () => {
    it('produces consistent SHA-256 hash for same content', () => {
      const content = 'Hello, World!';
      const hash1 = computeHash(content);
      const hash2 = computeHash(content);
      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different content', () => {
      const hash1 = computeHash('content1');
      const hash2 = computeHash('content2');
      expect(hash1).not.toBe(hash2);
    });

    it('produces 64-character hex string (SHA-256)', () => {
      const hash = computeHash('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles empty string', () => {
      const hash = computeHash('');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles large content', () => {
      const largeContent = 'x'.repeat(10000);
      const hash = computeHash(largeContent);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('compressContent and decompressContent', () => {
    it('roundtrip: compress then decompress returns original content', () => {
      const original = 'This is test content that should be compressed and decompressed';
      const compressed = compressContent(original);
      const decompressed = decompressContent(compressed);
      expect(decompressed).toBe(original);
    });

    it('skips compression for content < 1KB', () => {
      const smallContent = 'small';
      const result = compressContent(smallContent);
      // Should return Buffer with original content (not compressed)
      expect(result.toString()).toBe(smallContent);
    });

    it('compresses content >= 1KB', () => {
      const largeContent = 'x'.repeat(2000);
      const compressed = compressContent(largeContent);
      // Compressed should be smaller than original
      expect(compressed.length).toBeLessThan(largeContent.length);
    });

    it('handles exactly 1024 bytes (compression threshold)', () => {
      const content = 'x'.repeat(1024);
      const compressed = compressContent(content);
      const decompressed = decompressContent(compressed);
      expect(decompressed).toBe(content);
    });

    it('handles content with special characters', () => {
      const content = '你好世界 🌍 Special chars: @#$%^&*()';
      const compressed = compressContent(content);
      const decompressed = decompressContent(compressed);
      expect(decompressed).toBe(content);
    });

    it('handles multiline content', () => {
      const content = 'Line 1\nLine 2\nLine 3\n'.repeat(100);
      const compressed = compressContent(content);
      const decompressed = decompressContent(compressed);
      expect(decompressed).toBe(content);
    });
  });

  describe('createSnapshotId', () => {
    it('creates ID in YYYYMMDD-HHmmss-SSS format', () => {
      const id = createSnapshotId();
      expect(id).toMatch(/^\d{8}-\d{6}-\d{3}$/);
    });

    it('creates IDs with millisecond precision', () => {
      const id1 = createSnapshotId();
      const id2 = createSnapshotId();
      expect(id1).toMatch(/^\d{8}-\d{6}-\d{3}$/);
      expect(id2).toMatch(/^\d{8}-\d{6}-\d{3}$/);
    });

    it('ID contains valid date components', () => {
      const id = createSnapshotId();
      const [datePart] = id.split('-');
      const year = parseInt(datePart.substring(0, 4), 10);
      const month = parseInt(datePart.substring(4, 6), 10);
      const day = parseInt(datePart.substring(6, 8), 10);

      expect(year).toBeGreaterThanOrEqual(2020);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it('ID contains valid time components', () => {
      const id = createSnapshotId();
      const [, timePart] = id.split('-');
      const hours = parseInt(timePart.substring(0, 2), 10);
      const minutes = parseInt(timePart.substring(2, 4), 10);
      const seconds = parseInt(timePart.substring(4, 6), 10);

      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThanOrEqual(59);
    });
  });

  describe('buildSnapshotPath', () => {
    it('produces valid path structure', () => {
      const path = buildSnapshotPath('/history', 'document.md', '20240101-120000-000');
      expect(path).toContain('/history');
      expect(path).toContain('document');
      expect(path).toContain('20240101-120000-000');
    });

    it('handles nested file paths', () => {
      const path = buildSnapshotPath('/history', 'docs/nested/file.md', '20240101-120000-000');
      expect(path).toContain('docs');
      expect(path).toContain('nested');
      expect(path).toContain('file');
    });

    it('produces consistent paths for same inputs', () => {
      const path1 = buildSnapshotPath('/history', 'doc.md', 'id123');
      const path2 = buildSnapshotPath('/history', 'doc.md', 'id123');
      expect(path1).toBe(path2);
    });

    it('produces different paths for different snapshot IDs', () => {
      const path1 = buildSnapshotPath('/history', 'doc.md', 'id1');
      const path2 = buildSnapshotPath('/history', 'doc.md', 'id2');
      expect(path1).not.toBe(path2);
    });
  });

  describe('buildIndexPath', () => {
    it('produces valid index path', () => {
      const path = buildIndexPath('/history', 'document.md');
      expect(path).toContain('/history');
      expect(path).toContain('document');
      expect(path).toContain('index.json');
    });

    it('handles nested file paths', () => {
      const path = buildIndexPath('/history', 'docs/nested/file.md');
      expect(path).toContain('docs');
      expect(path).toContain('nested');
      expect(path).toContain('file');
      expect(path).toContain('index.json');
    });

    it('produces consistent paths for same inputs', () => {
      const path1 = buildIndexPath('/history', 'doc.md');
      const path2 = buildIndexPath('/history', 'doc.md');
      expect(path1).toBe(path2);
    });

    it('produces different paths for different files', () => {
      const path1 = buildIndexPath('/history', 'doc1.md');
      const path2 = buildIndexPath('/history', 'doc2.md');
      expect(path1).not.toBe(path2);
    });
  });

  describe('isDuplicate', () => {
    it('returns true for identical content (same hash)', () => {
      const content = 'test content';
      const hash = computeHash(content);
      expect(isDuplicate(content, hash)).toBe(true);
    });

    it('returns false for different content', () => {
      const content = 'test content';
      const differentHash = computeHash('different content');
      expect(isDuplicate(content, differentHash)).toBe(false);
    });

    it('returns false when latestHash is undefined', () => {
      const content = 'test content';
      expect(isDuplicate(content, undefined)).toBe(false);
    });

    it('handles empty content', () => {
      const hash = computeHash('');
      expect(isDuplicate('', hash)).toBe(true);
    });

    it('handles large content', () => {
      const largeContent = 'x'.repeat(10000);
      const hash = computeHash(largeContent);
      expect(isDuplicate(largeContent, hash)).toBe(true);
    });
  });

  describe('readIndex', () => {
    it('parses valid JSON index', () => {
      const indexJson = JSON.stringify({
        version: 1,
        snapshots: [
          {
            id: '20240101-120000-000',
            filePath: 'doc.md',
            timestamp: 1704110400000,
            label: 'checkpoint',
            isCheckpoint: true,
            hash: 'abc123',
            sizeBytes: 1024,
            compressed: true,
          },
        ],
      });

      const readFile = () => indexJson;
      const index = readIndex('/path/to/index.json', readFile);

      expect(index.version).toBe(1);
      expect(index.snapshots).toHaveLength(1);
      expect(index.snapshots[0].id).toBe('20240101-120000-000');
      expect(index.snapshots[0].isCheckpoint).toBe(true);
    });

    it('returns empty index for missing file', () => {
      const readFile = () => {
        throw new Error('File not found');
      };

      const index = readIndex('/path/to/missing.json', readFile);

      expect(index.version).toBe(1);
      expect(index.snapshots).toEqual([]);
    });

    it('handles index with multiple snapshots', () => {
      const indexJson = JSON.stringify({
        version: 1,
        snapshots: [
          {
            id: 'id1',
            filePath: 'doc.md',
            timestamp: 1000,
            isCheckpoint: false,
            hash: 'hash1',
            sizeBytes: 100,
            compressed: false,
          },
          {
            id: 'id2',
            filePath: 'doc.md',
            timestamp: 2000,
            label: 'v1',
            isCheckpoint: true,
            hash: 'hash2',
            sizeBytes: 200,
            compressed: true,
          },
        ],
      });

      const readFile = () => indexJson;
      const index = readIndex('/path/to/index.json', readFile);

      expect(index.snapshots).toHaveLength(2);
      expect(index.snapshots[0].id).toBe('id1');
      expect(index.snapshots[1].id).toBe('id2');
      expect(index.snapshots[1].label).toBe('v1');
    });

    it('handles empty snapshots array', () => {
      const indexJson = JSON.stringify({
        version: 1,
        snapshots: [],
      });

      const readFile = () => indexJson;
      const index = readIndex('/path/to/index.json', readFile);

      expect(index.snapshots).toEqual([]);
    });
  });

  describe('writeIndex', () => {
    it('writes valid JSON index', () => {
      const index: SnapshotIndex = {
        version: 1,
        snapshots: [
          {
            id: '20240101-120000-000',
            filePath: 'doc.md',
            timestamp: 1704110400000,
            label: 'checkpoint',
            isCheckpoint: true,
            hash: 'abc123',
            sizeBytes: 1024,
            compressed: true,
          },
        ],
      };

      let writtenContent = '';
      const writeFile = (_path: string, content: string) => {
        writtenContent = content;
      };

      writeIndex('/path/to/index.json', index, writeFile);

      const parsed = JSON.parse(writtenContent);
      expect(parsed.version).toBe(1);
      expect(parsed.snapshots).toHaveLength(1);
      expect(parsed.snapshots[0].id).toBe('20240101-120000-000');
    });

    it('writes empty snapshots array', () => {
      const index: SnapshotIndex = {
        version: 1,
        snapshots: [],
      };

      let writtenContent = '';
      const writeFile = (_path: string, content: string) => {
        writtenContent = content;
      };

      writeIndex('/path/to/index.json', index, writeFile);

      const parsed = JSON.parse(writtenContent);
      expect(parsed.snapshots).toEqual([]);
    });

    it('preserves all snapshot properties', () => {
      const snapshot: Snapshot = {
        id: 'test-id',
        filePath: 'path/to/file.md',
        timestamp: 1234567890,
        label: 'my-checkpoint',
        isCheckpoint: true,
        hash: 'hash-value',
        sizeBytes: 5000,
        compressed: true,
      };

      const index: SnapshotIndex = {
        version: 1,
        snapshots: [snapshot],
      };

      let writtenContent = '';
      const writeFile = (_path: string, content: string) => {
        writtenContent = content;
      };

      writeIndex('/path/to/index.json', index, writeFile);

      const parsed = JSON.parse(writtenContent);
      const writtenSnapshot = parsed.snapshots[0];

      expect(writtenSnapshot.id).toBe('test-id');
      expect(writtenSnapshot.filePath).toBe('path/to/file.md');
      expect(writtenSnapshot.timestamp).toBe(1234567890);
      expect(writtenSnapshot.label).toBe('my-checkpoint');
      expect(writtenSnapshot.isCheckpoint).toBe(true);
      expect(writtenSnapshot.hash).toBe('hash-value');
      expect(writtenSnapshot.sizeBytes).toBe(5000);
      expect(writtenSnapshot.compressed).toBe(true);
    });

    it('calls writeFile with correct path', () => {
      const index: SnapshotIndex = { version: 1, snapshots: [] };
      const indexPath = '/custom/path/index.json';

      let capturedPath = '';
      const writeFile = (path: string, _content: string) => {
        capturedPath = path;
      };

      writeIndex(indexPath, index, writeFile);

      expect(capturedPath).toBe(indexPath);
    });
  });
});
