import { execSync as nodeExecSync } from 'child_process';
import { existsSync } from 'fs';

type FsExistsSync = (path: string) => boolean;
type ExecSync = (command: string) => string;

/**
 * Platform-specific Chrome/Chromium executable paths
 */
const getPlatformPaths = (): string[] => {
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
  } else if (platform === 'win32') {
    // Windows
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\AppData\\Local';

    return [
      `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${programFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      `${programFilesX86}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
      `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ];
  } else {
    // Linux
    return [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];
  }
};

/**
 * Try to find Chrome/Chromium executable using 'which' or 'where' command
 */
const findViaWhich = (execSync: ExecSync): string | null => {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which';
    const searchCommands = [
      'google-chrome',
      'chromium-browser',
      'chromium',
      'chrome',
    ];

    for (const cmd of searchCommands) {
      try {
        const result = execSync(`${command} ${cmd}`).toString().trim();
        if (result) {
          return result;
        }
      } catch {
        // Command not found, try next
      }
    }
  } catch {
    // which/where command failed
  }

  return null;
}

/**
 * Detect Chrome/Chromium executable path
 * 
 * @param userPath - User-configured path override (from maraudersMapMd.pdf.browserPath setting)
 * @param fsExistsSync - Dependency injection for fs.existsSync (for testing)
 * @param execSync - Dependency injection for execSync (for testing)
 * @returns Path to Chrome/Chromium executable, or null if not found
 * 
 * Priority:
 * 1. User-configured path (if provided and exists)
 * 2. Auto-detected from platform-specific paths
 * 3. Fallback to 'which'/'where' command
 * 4. null if no browser found
 */
export function detectChrome(
  userPath: string | null = null,
  fsExistsSync: FsExistsSync = existsSync,
  execSync: ExecSync = (cmd: string) => nodeExecSync(cmd).toString()
): string | null {
  // Priority 1: User-configured path
  if (userPath && fsExistsSync(userPath)) {
    return userPath;
  }

  // Priority 2: Auto-detect from platform-specific paths
  const platformPaths = getPlatformPaths();
  for (const path of platformPaths) {
    if (fsExistsSync(path)) {
      return path;
    }
  }

  // Priority 3: Fallback to 'which'/'where' command
  const whichResult = findViaWhich(execSync);
  if (whichResult) {
    return whichResult;
  }

  // Priority 4: Not found
  return null;
}
