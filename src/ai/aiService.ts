import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateAiMap } from './aiMapGenerator';
import { generateSectionPack } from './sectionPackGenerator';
import { buildSearchIndex } from './searchIndexBuilder';
import { exportWithBudget, PRESET_BUDGETS } from './tokenBudgetExporter';
import { estimateTokens, TokenEstimationMode } from './tokenEstimator';

// ── Debounce state ──────────────────────────────────────────────────
let lastGenerationTimestamp = 0;
const DEBOUNCE_MS = 5_000;

// ── Output channel (lazy) ───────────────────────────────────────────
let _outputChannel: vscode.OutputChannel | undefined;
function getOutputChannel(): vscode.OutputChannel {
  if (!_outputChannel) {
    _outputChannel = vscode.window.createOutputChannel('MaraudersMapMD AI');
  }
  return _outputChannel;
}

// ── Helpers ─────────────────────────────────────────────────────────

function getConfig() {
  return vscode.workspace.getConfiguration('maraudersMapMd');
}

function isAiEnabled(): boolean {
  return getConfig().get<boolean>('ai.enabled', true);
}

function getTokenMode(): TokenEstimationMode {
  return getConfig().get<string>('ai.tokenEstimateMode', 'koreanWeighted') as TokenEstimationMode;
}

function getOutputDir(): string {
  return getConfig().get<string>('ai.outputDir', '.ai');
}

function getLargeDocThresholdBytes(): number {
  return getConfig().get<number>('ai.largeDocThresholdKb', 512) * 1024;
}

function docIdFromPath(filePath: string): string {
  return path.basename(filePath, '.md');
}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

// ── Core generation logic ───────────────────────────────────────────

interface GenerateOptions {
  filePath: string;
  content: string;
  mapOnly?: boolean;
}

async function generateArtifacts(options: GenerateOptions): Promise<void> {
  const { filePath, content, mapOnly } = options;
  const config = getConfig();
  const tokenMode = getTokenMode();
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const docId = docIdFromPath(filePath);
  const outputBase = path.join(workspaceRoot, getOutputDir(), docId);
  const channel = getOutputChannel();

  await fs.mkdir(outputBase, { recursive: true });

  if (config.get<boolean>('ai.generate.map', true)) {
    const mapContent = generateAiMap({ filePath, content, tokenMode });
    await fs.writeFile(path.join(outputBase, 'ai-map.md'), mapContent, 'utf-8');
    channel.appendLine(`[AI] Generated ai-map.md for ${docId}`);
  }

  if (mapOnly) {
    channel.appendLine(`[AI] Large document — skipped sections/index for ${docId}`);
    return;
  }

  if (config.get<boolean>('ai.generate.sections', true)) {
    const sections = generateSectionPack({ filePath, content });
    if (sections.length > 0) {
      const sectionsDir = path.join(outputBase, 'sections');
      await fs.mkdir(sectionsDir, { recursive: true });
      for (const section of sections) {
        await fs.writeFile(path.join(sectionsDir, section.filename), section.content, 'utf-8');
      }
      channel.appendLine(`[AI] Generated ${sections.length} section file(s) for ${docId}`);
    }
  }

  if (config.get<boolean>('ai.generate.index', true)) {
    const index = buildSearchIndex({ filePath, content, tokenMode });
    await fs.writeFile(
      path.join(outputBase, 'index.json'),
      JSON.stringify(index, null, 2),
      'utf-8',
    );
    channel.appendLine(`[AI] Generated index.json for ${docId}`);
  }
}

// ── onSave handler ──────────────────────────────────────────────────

async function handleDocumentSave(document: vscode.TextDocument): Promise<void> {
  if (document.languageId !== 'markdown') {
    return;
  }

  if (document.isUntitled || !document.uri.fsPath) {
    return;
  }

  if (!isAiEnabled()) {
    return;
  }
  if (!getConfig().get<boolean>('ai.buildOnSave', true)) {
    return;
  }

  const now = Date.now();
  if (now - lastGenerationTimestamp < DEBOUNCE_MS) {
    return;
  }
  lastGenerationTimestamp = now;

  const filePath = document.uri.fsPath;
  const content = document.getText();

  const fileSizeBytes = Buffer.byteLength(content, 'utf-8');
  const threshold = getLargeDocThresholdBytes();
  const isLargeDoc = fileSizeBytes > threshold;

  if (isLargeDoc) {
    getOutputChannel().appendLine(
      `[AI] Warning: ${path.basename(filePath)} exceeds ${threshold / 1024}KB — generating map only`,
    );
  }

  try {
    await generateArtifacts({ filePath, content, mapOnly: isLargeDoc });
    await handleGitPolicy();
  } catch (err) {
    getOutputChannel().appendLine(`[AI] Error generating artifacts: ${String(err)}`);
  }
}

// ── Git policy ──────────────────────────────────────────────────────

async function handleGitPolicy(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const policy = getConfig().get<string>('ai.gitPolicy', 'ignoreAll');
  if (policy === 'commitAll') {
    return;
  }

  const gitignorePath = path.join(workspaceRoot, '.gitignore');
  let gitignoreContent = '';
  try {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // .gitignore doesn't exist yet — we'll suggest creating it
  }

  const outputDir = getOutputDir();

  if (policy === 'ignoreAll') {
    const ignorePattern = `${outputDir}/`;
    if (!gitignoreContent.includes(ignorePattern)) {
      const action = await vscode.window.showInformationMessage(
        `AI artifacts directory "${outputDir}/" is not in .gitignore. Add it?`,
        'Add to .gitignore',
        'Dismiss',
      );
      if (action === 'Add to .gitignore') {
        const newContent = gitignoreContent
          ? `${gitignoreContent.trimEnd()}\n\n# AI artifacts\n${ignorePattern}\n`
          : `# AI artifacts\n${ignorePattern}\n`;
        await fs.writeFile(gitignorePath, newContent, 'utf-8');
      }
    }
  } else if (policy === 'commitMapOnly') {
    const patternsNeeded: string[] = [];
    if (!gitignoreContent.includes(`${outputDir}/**/sections/`)) {
      patternsNeeded.push(`${outputDir}/**/sections/`);
    }
    if (!gitignoreContent.includes(`${outputDir}/**/index.json`)) {
      patternsNeeded.push(`${outputDir}/**/index.json`);
    }

    if (patternsNeeded.length > 0) {
      const action = await vscode.window.showInformationMessage(
        `Git policy is "commitMapOnly". Add ignore patterns for sections/index to .gitignore?`,
        'Add to .gitignore',
        'Dismiss',
      );
      if (action === 'Add to .gitignore') {
        const block = patternsNeeded.join('\n');
        const newContent = gitignoreContent
          ? `${gitignoreContent.trimEnd()}\n\n# AI artifacts (map only committed)\n${block}\n`
          : `# AI artifacts (map only committed)\n${block}\n`;
        await fs.writeFile(gitignorePath, newContent, 'utf-8');
      }
    }
  }
}

// ── Manual commands ─────────────────────────────────────────────────

async function cmdGenerateMap(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }
  if (!isAiEnabled()) {
    vscode.window.showWarningMessage('AI features are disabled');
    return;
  }
  if (editor.document.isUntitled) {
    vscode.window.showWarningMessage('Save the file first');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const content = editor.document.getText();
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const docId = docIdFromPath(filePath);
  const outputBase = path.join(workspaceRoot, getOutputDir(), docId);
  await fs.mkdir(outputBase, { recursive: true });

  const mapContent = generateAiMap({ filePath, content, tokenMode: getTokenMode() });
  await fs.writeFile(path.join(outputBase, 'ai-map.md'), mapContent, 'utf-8');
  vscode.window.showInformationMessage(`AI map generated for ${docId}`);
}

async function cmdExportSectionPack(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }
  if (!isAiEnabled()) {
    vscode.window.showWarningMessage('AI features are disabled');
    return;
  }
  if (editor.document.isUntitled) {
    vscode.window.showWarningMessage('Save the file first');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const content = editor.document.getText();
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const docId = docIdFromPath(filePath);
  const sectionsDir = path.join(workspaceRoot, getOutputDir(), docId, 'sections');
  await fs.mkdir(sectionsDir, { recursive: true });

  const sections = generateSectionPack({ filePath, content });
  for (const section of sections) {
    await fs.writeFile(path.join(sectionsDir, section.filename), section.content, 'utf-8');
  }
  vscode.window.showInformationMessage(`Exported ${sections.length} section(s) for ${docId}`);
}

async function cmdBuildIndex(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }
  if (!isAiEnabled()) {
    vscode.window.showWarningMessage('AI features are disabled');
    return;
  }
  if (editor.document.isUntitled) {
    vscode.window.showWarningMessage('Save the file first');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const content = editor.document.getText();
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return;
  }

  const docId = docIdFromPath(filePath);
  const outputBase = path.join(workspaceRoot, getOutputDir(), docId);
  await fs.mkdir(outputBase, { recursive: true });

  const index = buildSearchIndex({ filePath, content, tokenMode: getTokenMode() });
  await fs.writeFile(
    path.join(outputBase, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf-8',
  );
  vscode.window.showInformationMessage(`Search index built for ${docId}`);
}

async function cmdCopyContextBudgeted(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }
  if (!isAiEnabled()) {
    vscode.window.showWarningMessage('AI features are disabled');
    return;
  }

  const content = editor.document.getText();
  const tokenMode = getTokenMode();

  const items: vscode.QuickPickItem[] = [
    { label: '1k tokens', description: '~1,000 tokens' },
    { label: '2k tokens', description: '~2,000 tokens' },
    { label: '4k tokens', description: '~4,000 tokens' },
    { label: '8k tokens', description: '~8,000 tokens' },
    { label: 'Custom...', description: 'Enter a custom token budget' },
  ];

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select token budget for context export',
  });
  if (!picked) {
    return;
  }

  let budget: number;
  if (picked.label === 'Custom...') {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter token budget (number)',
      placeHolder: '3000',
      validateInput: (value) => {
        const n = Number(value);
        if (isNaN(n) || n <= 0 || !Number.isInteger(n)) {
          return 'Please enter a positive integer';
        }
        return undefined;
      },
    });
    if (!input) {
      return;
    }
    budget = Number(input);
  } else {
    const key = picked.label.split(' ')[0] as keyof typeof PRESET_BUDGETS;
    budget = PRESET_BUDGETS[key];
  }

  const exported = exportWithBudget({ content, budget, tokenMode });
  const actualTokens = estimateTokens(exported, tokenMode);

  await vscode.env.clipboard.writeText(exported);
  vscode.window.showInformationMessage(`Copied ~${actualTokens} tokens to clipboard`);
}

// ── Registration ────────────────────────────────────────────────────

export function registerAiListeners(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      // Fire-and-forget — do not block editor
      void handleDocumentSave(document);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.generateMap', () => {
      void cmdGenerateMap();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.exportSectionPack', () => {
      void cmdExportSectionPack();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.buildIndex', () => {
      void cmdBuildIndex();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.copyContextBudgeted', () => {
      void cmdCopyContextBudgeted();
    }),
  );
}
