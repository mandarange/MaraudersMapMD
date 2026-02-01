import { describe, it, expect, vi } from 'vitest';
import { detectChrome } from '../../src/export/chromeDetector';

describe('chromeDetector', () => {
  it('returns user-configured path when provided and exists', () => {
    const mockFsExistsSync = vi.fn((path: string) => path === '/custom/chrome');
    const mockExecSync = vi.fn();

    const result = detectChrome(
      '/custom/chrome',
      mockFsExistsSync,
      mockExecSync
    );

    expect(result).toBe('/custom/chrome');
    expect(mockFsExistsSync).toHaveBeenCalledWith('/custom/chrome');
  });

  it('returns null when user path does not exist', () => {
    const mockFsExistsSync = vi.fn(() => false);
    const mockExecSync = vi.fn(() => {
      throw new Error('not found');
    });

    const result = detectChrome(
      '/nonexistent/chrome',
      mockFsExistsSync,
      mockExecSync
    );

    expect(result).toBeNull();
  });

  it('auto-detects and returns first existing path from platform list', () => {
    const expectedPath = process.platform === 'darwin'
      ? '/Applications/Chromium.app/Contents/MacOS/Chromium'
      : '/usr/bin/chromium-browser';

    const mockFsExistsSync = vi.fn((path: string) => {
      return path === expectedPath;
    });
    const mockExecSync = vi.fn(() => {
      throw new Error('not found');
    });

    const result = detectChrome(
      null,
      mockFsExistsSync,
      mockExecSync
    );

    expect(result).toBe(expectedPath);
  });

  it('returns null when no browser found', () => {
    const mockFsExistsSync = vi.fn(() => false);
    const mockExecSync = vi.fn(() => {
      throw new Error('not found');
    });

    const result = detectChrome(
      null,
      mockFsExistsSync,
      mockExecSync
    );

    expect(result).toBeNull();
  });
});
