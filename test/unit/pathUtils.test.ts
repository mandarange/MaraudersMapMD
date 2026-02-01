import { describe, it, expect } from 'vitest';
import {
  generateImageFilename,
  buildRelativePath,
  buildMarkdownImageLink,
  getAltText,
} from '../../src/images/pathUtils';

describe('pathUtils', () => {
  describe('generateImageFilename', () => {
    it('applies basename pattern', () => {
      const result = generateImageFilename('photo.jpg', '{basename}');
      expect(result).toBe('photo.jpg');
    });

    it('applies basename without extension', () => {
      const result = generateImageFilename('photo.jpg', '{basename}');
      expect(result).toBe('photo.jpg');
    });

    it('applies timestamp pattern yyyyMMdd-HHmmss', () => {
      const result = generateImageFilename('photo.jpg', '{yyyyMMdd-HHmmss}');
      // Should match format: 20240115-143025.jpg
      expect(result).toMatch(/^\d{8}-\d{6}\.jpg$/);
    });

    it('applies combined basename and timestamp pattern', () => {
      const result = generateImageFilename('photo.jpg', '{basename}-{yyyyMMdd-HHmmss}');
      // Should match: photo-20240115-143025.jpg
      expect(result).toMatch(/^photo-\d{8}-\d{6}\.jpg$/);
    });

    it('preserves file extension', () => {
      const result = generateImageFilename('screenshot.png', '{basename}-{yyyyMMdd-HHmmss}');
      expect(result).toMatch(/\.png$/);
    });

    it('handles uppercase extension', () => {
      const result = generateImageFilename('image.JPG', '{basename}-{yyyyMMdd-HHmmss}');
      expect(result).toMatch(/\.JPG$/);
    });

    it('handles filename with multiple dots', () => {
      const result = generateImageFilename('my.photo.jpg', '{basename}-{yyyyMMdd-HHmmss}');
      expect(result).toMatch(/^my\.photo-\d{8}-\d{6}\.jpg$/);
    });

    it('handles filename without extension', () => {
      const result = generateImageFilename('photo', '{basename}-{yyyyMMdd-HHmmss}');
      expect(result).toMatch(/^photo-\d{8}-\d{6}$/);
    });
  });

  describe('buildRelativePath', () => {
    it('produces correct POSIX path for same directory', () => {
      const result = buildRelativePath('/home/user/docs', 'assets', 'photo.jpg');
      expect(result).toBe('./assets/photo.jpg');
    });

    it('produces correct POSIX path for nested asset directory', () => {
      const result = buildRelativePath('/home/user/docs', 'assets/images', 'photo.jpg');
      expect(result).toBe('./assets/images/photo.jpg');
    });

    it('converts Windows backslashes to forward slashes', () => {
      const result = buildRelativePath('C:\\Users\\docs', 'assets', 'photo.jpg');
      expect(result).toBe('./assets/photo.jpg');
    });

    it('handles nested Windows paths', () => {
      const result = buildRelativePath('C:\\Users\\docs', 'assets\\images', 'photo.jpg');
      expect(result).toBe('./assets/images/photo.jpg');
    });

    it('handles filename with special characters', () => {
      const result = buildRelativePath('/home/user/docs', 'assets', 'my-photo_2024.jpg');
      expect(result).toBe('./assets/my-photo_2024.jpg');
    });

    it('handles deeply nested asset directories', () => {
      const result = buildRelativePath('/home/user/docs', 'assets/2024/january', 'photo.jpg');
      expect(result).toBe('./assets/2024/january/photo.jpg');
    });
  });

  describe('buildMarkdownImageLink', () => {
    it('formats basic image link', () => {
      const result = buildMarkdownImageLink('My Photo', './assets/photo.jpg');
      expect(result).toBe('![My Photo](./assets/photo.jpg)');
    });

    it('formats link with empty alt text', () => {
      const result = buildMarkdownImageLink('', './assets/photo.jpg');
      expect(result).toBe('![](./assets/photo.jpg)');
    });

    it('formats link with special characters in alt text', () => {
      const result = buildMarkdownImageLink('Photo (2024)', './assets/photo.jpg');
      expect(result).toBe('![Photo (2024)](./assets/photo.jpg)');
    });

    it('formats link with nested path', () => {
      const result = buildMarkdownImageLink('Screenshot', './assets/2024/january/screenshot.png');
      expect(result).toBe('![Screenshot](./assets/2024/january/screenshot.png)');
    });
  });

  describe('getAltText', () => {
    it('returns filename as alt text when source is filename', () => {
      const result = getAltText('photo-20240115-143025.jpg', 'filename');
      expect(result).toBe('photo-20240115-143025.jpg');
    });

    it('returns empty string when source is prompt', () => {
      const result = getAltText('photo-20240115-143025.jpg', 'prompt');
      expect(result).toBe('');
    });

    it('handles filename without extension', () => {
      const result = getAltText('photo-20240115-143025', 'filename');
      expect(result).toBe('photo-20240115-143025');
    });

    it('preserves special characters in filename alt text', () => {
      const result = getAltText('my-photo_2024.jpg', 'filename');
      expect(result).toBe('my-photo_2024.jpg');
    });
  });
});
