import { describe, it, expect, vi } from 'vitest';
import { exportToPdf, PdfExportOptions, BrowserLauncher } from '../../src/export/pdfExporter';

function createMockLauncher(overrides?: {
  goto?: ReturnType<typeof vi.fn>;
  evaluate?: ReturnType<typeof vi.fn>;
  pdf?: ReturnType<typeof vi.fn>;
  close?: ReturnType<typeof vi.fn>;
  newPage?: ReturnType<typeof vi.fn>;
}) {
  const mockPdf = overrides?.pdf ?? vi.fn().mockResolvedValue(Buffer.from(''));
  const mockGoto = overrides?.goto ?? vi.fn().mockResolvedValue(undefined);
  const mockEvaluate = overrides?.evaluate ?? vi.fn().mockResolvedValue(undefined);
  const mockPage = {
    goto: mockGoto,
    evaluate: mockEvaluate,
    pdf: mockPdf,
  };
  const mockClose = overrides?.close ?? vi.fn().mockResolvedValue(undefined);
  const mockNewPage = overrides?.newPage ?? vi.fn().mockResolvedValue(mockPage);
  const mockBrowser = {
    newPage: mockNewPage,
    close: mockClose,
  };
  const mockLaunch: BrowserLauncher = vi.fn().mockResolvedValue(mockBrowser);

  return {
    mockLaunch,
    mockBrowser,
    mockPage,
    mockPdf,
    mockGoto,
    mockEvaluate,
    mockClose,
    mockNewPage,
  };
}

const defaultOptions: PdfExportOptions = {
  html: '<html><body>Hello</body></html>',
  outputPath: '/tmp/output.pdf',
  browserPath: '/usr/bin/google-chrome',
  format: 'A4',
  marginMm: 12,
  printBackground: true,
};

describe('pdfExporter', () => {
  describe('exportToPdf', () => {
    it('calls launcher with correct executablePath and args', async () => {
      const { mockLaunch } = createMockLauncher();

      await exportToPdf(defaultOptions, mockLaunch);

      expect(mockLaunch).toHaveBeenCalledWith({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--allow-file-access-from-files'],
      });
    });

    it('loads temp HTML file and waits for page load', async () => {
      const { mockLaunch, mockGoto } = createMockLauncher();

      await exportToPdf(defaultOptions, mockLaunch);

      expect(mockGoto).toHaveBeenCalledWith(
        expect.stringMatching(/^file:\/\//),
        { waitUntil: 'load', timeout: 30000 }
      );
    });

    it('passes format and margin settings to page.pdf()', async () => {
      const { mockLaunch, mockPdf } = createMockLauncher();

      await exportToPdf(
        { ...defaultOptions, format: 'Letter', marginMm: 20, printBackground: false },
        mockLaunch
      );

      expect(mockPdf).toHaveBeenCalledWith({
        path: '/tmp/output.pdf',
        format: 'Letter',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: false,
      });
    });

    it('passes A4 format and default margin settings', async () => {
      const { mockLaunch, mockPdf } = createMockLauncher();

      await exportToPdf(defaultOptions, mockLaunch);

      expect(mockPdf).toHaveBeenCalledWith({
        path: '/tmp/output.pdf',
        format: 'A4',
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm',
        },
        printBackground: true,
      });
    });

    it('closes browser after successful export', async () => {
      const { mockLaunch, mockClose } = createMockLauncher();

      await exportToPdf(defaultOptions, mockLaunch);

      expect(mockClose).toHaveBeenCalled();
    });

    it('closes browser even when page.pdf() throws', async () => {
      const mockPdf = vi.fn().mockRejectedValue(new Error('PDF generation failed'));
      const { mockLaunch, mockClose } = createMockLauncher({ pdf: mockPdf });

      await expect(exportToPdf(defaultOptions, mockLaunch)).rejects.toThrow('PDF generation failed');
      expect(mockClose).toHaveBeenCalled();
    });

    it('closes browser even when goto throws', async () => {
      const mockGoto = vi.fn().mockRejectedValue(new Error('Timeout'));
      const { mockLaunch, mockClose } = createMockLauncher({ goto: mockGoto });

      await expect(exportToPdf(defaultOptions, mockLaunch)).rejects.toThrow('Timeout');
      expect(mockClose).toHaveBeenCalled();
    });

    it('throws descriptive error when browser path is invalid (launch fails)', async () => {
      const mockLaunch: BrowserLauncher = vi.fn().mockRejectedValue(
        new Error('Failed to launch the browser process')
      );

      await expect(exportToPdf(defaultOptions, mockLaunch)).rejects.toThrow(
        /failed to launch.*browser/i
      );
    });

    it('wraps launch errors with descriptive message', async () => {
      const mockLaunch: BrowserLauncher = vi.fn().mockRejectedValue(
        new Error('ENOENT: no such file or directory')
      );

      await expect(exportToPdf(defaultOptions, mockLaunch)).rejects.toThrow(
        /could not launch browser/i
      );
    });
  });
});
