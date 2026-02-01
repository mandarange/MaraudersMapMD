export interface PdfExportOptions {
  html: string;
  outputPath: string;
  browserPath: string;
  format: string;
  marginMm: number;
  printBackground: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type BrowserLauncher = (options: {
  executablePath: string;
  headless: boolean;
  args: string[];
}) => Promise<{ newPage(): Promise<any>; close(): Promise<void> }>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function exportToPdf(
  options: PdfExportOptions,
  launch: BrowserLauncher
): Promise<void> {
  let browser: { close(): Promise<void> } | null = null;

  try {
    browser = await launch({
      executablePath: options.browserPath,
      headless: true,
      args: ['--no-sandbox', '--allow-file-access-from-files'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not launch browser at "${options.browserPath}": ${message}`);
  }

  try {
    const browserInstance = browser as Awaited<ReturnType<BrowserLauncher>>;
    const page = await browserInstance.newPage();

    await page.setContent(options.html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const marginStr = `${options.marginMm}mm`;
    await page.pdf({
      path: options.outputPath,
      format: options.format,
      margin: {
        top: marginStr,
        right: marginStr,
        bottom: marginStr,
        left: marginStr,
      },
      printBackground: options.printBackground,
    });
  } finally {
    await browser.close();
  }
}
