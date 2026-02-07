import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';

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
  const tmpHtmlPath = path.join(os.tmpdir(), `maraudersmapmd-export-${Date.now()}.html`);

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
    fs.writeFileSync(tmpHtmlPath, options.html, 'utf8');

    const browserInstance = browser as Awaited<ReturnType<BrowserLauncher>>;
    const page = await browserInstance.newPage();

    await page.goto(pathToFileURL(tmpHtmlPath).toString(), {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await waitForImagesToLoad(page);
    await waitForMermaidRender(page);

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
    try {
      fs.unlinkSync(tmpHtmlPath);
    } catch {
      /* noop */
    }
    if (browser) {
      await browser.close();
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function waitForMermaidRender(page: any): Promise<void> {
  try {
    await page.waitForFunction(
      `(function() {
        var blocks = document.querySelectorAll('pre.mermaid');
        if (blocks.length === 0) return true;
        return window.__mermaidDone === true;
      })()`,
      { timeout: 15000 }
    );
  } catch {
    // If mermaid didn't render in time, continue with PDF generation anyway
  }
}

async function waitForImagesToLoad(page: any): Promise<void> {
  await page.evaluate(`
    new Promise((resolve) => {
      const images = Array.from(document.images);
      if (images.length === 0) {
        resolve();
        return;
      }
      let loaded = 0;
      const checkDone = () => {
        loaded++;
        if (loaded >= images.length) resolve();
      };
      images.forEach((img) => {
        if (img.complete) {
          checkDone();
        } else {
          img.addEventListener('load', checkDone, { once: true });
          img.addEventListener('error', checkDone, { once: true });
        }
      });
    })
  `);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
