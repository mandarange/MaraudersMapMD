import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateAiMap } from './aiMapGenerator';
import { generateSectionPack } from './sectionPackGenerator';
import { buildSearchIndex } from './searchIndexBuilder';
import { TokenEstimationMode } from './tokenEstimator';
import { getMarkdownEditor } from '../utils/editorUtils';

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
  return 'docs/MaraudersMap';
}

function getLargeDocThresholdBytes(): number {
  return getConfig().get<number>('ai.largeDocThresholdKb', 512) * 1024;
}

function docIdFromPath(filePath: string): string {
  return path.basename(filePath, '.md');
}

function getWorkspaceRoot(filePath: string): string | undefined {
  const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
  return folder?.uri.fsPath;
}

function getArtifactsBaseDir(workspaceRoot: string, filePath: string): string {
  const docId = docIdFromPath(filePath);
  return path.join(workspaceRoot, 'docs', 'MaraudersMap', docId);
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
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    return;
  }

  const docId = docIdFromPath(filePath);
  const outputBase = getArtifactsBaseDir(workspaceRoot, filePath);
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
    await handleGitPolicy(filePath);
  } catch (err) {
    getOutputChannel().appendLine(`[AI] Error generating artifacts: ${String(err)}`);
  }
}

// ── Git policy ──────────────────────────────────────────────────────

async function handleGitPolicy(filePath: string): Promise<void> {
  const workspaceRoot = getWorkspaceRoot(filePath);
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
  const editor = getMarkdownEditor();
  if (!editor) {
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
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Open a workspace folder first');
    return;
  }

  const docId = docIdFromPath(filePath);
  const outputBase = getArtifactsBaseDir(workspaceRoot, filePath);
  await fs.mkdir(outputBase, { recursive: true });

  const mapContent = generateAiMap({ filePath, content, tokenMode: getTokenMode() });
  await fs.writeFile(path.join(outputBase, 'ai-map.md'), mapContent, 'utf-8');
  vscode.window.showInformationMessage(`AI map generated for ${docId}`);
}

async function cmdExportSectionPack(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
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
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Open a workspace folder first');
    return;
  }

  const docId = docIdFromPath(filePath);
  const sectionsDir = path.join(getArtifactsBaseDir(workspaceRoot, filePath), 'sections');
  await fs.mkdir(sectionsDir, { recursive: true });

  const sections = generateSectionPack({ filePath, content });
  for (const section of sections) {
    await fs.writeFile(path.join(sectionsDir, section.filename), section.content, 'utf-8');
  }
  vscode.window.showInformationMessage(`Exported ${sections.length} section(s) for ${docId}`);
}

async function cmdBuildIndex(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
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
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Open a workspace folder first');
    return;
  }

  const docId = docIdFromPath(filePath);
  const outputBase = getArtifactsBaseDir(workspaceRoot, filePath);
  await fs.mkdir(outputBase, { recursive: true });

  const index = buildSearchIndex({ filePath, content, tokenMode: getTokenMode() });
  await fs.writeFile(
    path.join(outputBase, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf-8',
  );
  vscode.window.showInformationMessage(`Search index built for ${docId}`);
}


function buildReadabilityPrompt(relativePath: string): string {
  const skillRepoUrl = 'https://github.com/mandarange/MaraudersMapMD-skill';

  return `## Step 1: Ensure MaraudersMapMD skill is installed

Detect your current AI IDE/Environment to determine the skill installation path:
- Cursor: \`.cursor/skills/maraudersmapmd-skill/SKILL.md\` (or \`.cursor/rules/maraudersmapmd-skill.mdc\`)
- Claude Code: \`.claude/skills/maraudersmapmd-skill/SKILL.md\`
- Antigravity IDE: \`.agent/skills/maraudersmapmd-skill/SKILL.md\`

1. Check if the skill is already installed at the appropriate path.
2. If installed, check the YAML frontmatter for the \`version\` and compare it with the remote repository (${skillRepoUrl}).
3. If the skill is not installed, or if the remote version is newer, fetch the latest content from:
https://raw.githubusercontent.com/mandarange/MaraudersMapMD-skill/main/SKILL.md
and save it to the appropriate path for your environment.

## Step 2: Execute Skill
Improve the readability of this document: \`${relativePath}\`

(Please use the MaraudersMapMD skill exactly as implemented in its SKILL.md. Do not skip any steps defined in the skill.)`;
}

function buildPptPrompt(relativePath: string): string {
  const skillArchiveUrl = 'https://github.com/mandarange/MaraudersPPT-Skill/archive/refs/heads/main.zip';

  return `## Step 1: Ensure MaraudersPPT skill is installed

Detect your current AI IDE/Environment to determine the skill installation path:
- Cursor: \`.cursor/skills/maraudersppt-skill\`
- Claude Code: \`.claude/skills/maraudersppt-skill\`
- Antigravity IDE: \`.agent/skills/maraudersppt-skill\`

1. Check if the skill is already installed at the appropriate path.
2. If installed, check the YAML frontmatter for the \`version\` and compare it with the remote repository.
3. If the skill is not installed, or if the remote version is newer, fetch the latest skill repo archive from ${skillArchiveUrl}.
Extract and sync the FULL repository contents into the appropriate skill directory for your environment.

## Step 2: Execute Skill
MaraudersMD2PPT \`${relativePath}\`

(Please use the MaraudersPPT skill exactly as implemented in its SKILL.md without modifying its workflow)`;
}

async function cmdCopyReadabilityPrompt(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Open a workspace folder first');
    return;
  }

  const artifactDir = getArtifactsBaseDir(workspaceRoot, filePath);
  const aiMapPath = path.join(artifactDir, 'ai-map.md');
  try {
    await fs.access(aiMapPath);
  } catch {
    try {
      await generateArtifacts({ filePath, content: editor.document.getText() });
    } catch {
      getOutputChannel().appendLine('[AI] Artifact generation failed — prompt will reference empty paths');
    }
  }

  const relativePath = path.relative(workspaceRoot, filePath);
  const prompt = buildReadabilityPrompt(relativePath);
  await vscode.env.clipboard.writeText(prompt);
  vscode.window.showInformationMessage('Readability prompt copied to clipboard');
}

async function cmdCopyPptPrompt(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Open a workspace folder first');
    return;
  }

  const relativePath = path.relative(workspaceRoot, filePath);
  const prompt = buildPptPrompt(relativePath);
  await vscode.env.clipboard.writeText(prompt);
  vscode.window.showInformationMessage('PPT prompt copied to clipboard');
}

function buildFactCheckPrompt(relativePath: string): string {
  const skillArchiveUrl = 'https://github.com/mandarange/Marauders_FactCheck_Skill/archive/refs/heads/main.zip';

  return `## Step 1: Ensure Marauders FactCheck skill is installed

Detect your current AI IDE/Environment to determine the skill installation path:
- Cursor: \`.cursor/skills/marauders-factcheck-skill\`
- Claude Code: \`.claude/skills/marauders-factcheck-skill\`
- Antigravity IDE: \`.agent/skills/marauders-factcheck-skill\`

1. Check if the skill is already installed at the appropriate path.
2. If installed, check the YAML frontmatter for the \`version\` and compare it with the remote repository.
3. If the skill is not installed, or if the remote version is newer, fetch the latest skill repo archive from ${skillArchiveUrl}.
The skill files live under \`skills/marauders-factcheck-skill/\` inside the archive. Extract and sync that subdirectory's contents into the appropriate skill directory for your environment.

## Step 2: Execute Skill
Please fact-check quantitative claims in: \`${relativePath}\`

(Please use the Marauders FactCheck skill exactly as implemented in its SKILL.md without modifying its workflow)`;
}

async function cmdCopyFactCheckPrompt(): Promise<void> {
  const editor = getMarkdownEditor();
  if (!editor) {
    vscode.window.showErrorMessage('Open a Markdown file first');
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const workspaceRoot = getWorkspaceRoot(filePath);
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('Open a workspace folder first');
    return;
  }

  const relativePath = path.relative(workspaceRoot, filePath);
  const prompt = buildFactCheckPrompt(relativePath);
  await vscode.env.clipboard.writeText(prompt);
  vscode.window.showInformationMessage('Fact Check prompt copied to clipboard');
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
    vscode.commands.registerCommand('maraudersMapMd.ai.copyReadabilityPrompt', () => {
      void cmdCopyReadabilityPrompt();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.copyPptPrompt', () => {
      void cmdCopyPptPrompt();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('maraudersMapMd.ai.copyFactCheckPrompt', () => {
      void cmdCopyFactCheckPrompt();
    }),
  );
}
