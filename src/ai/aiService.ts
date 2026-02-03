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


function buildReadabilityPrompt(relativePath: string, fileName: string, docId: string): string {
  const artifactDir = `docs/MaraudersMap/${docId}`;
  const rewrittenName = fileName.replace(/\.md$/, '.rewritten.md');

  const skillUrl = 'https://raw.githubusercontent.com/mandarange/MaraudersMapMD-skill/main/SKILL.md';
  const skillPath = '.cursor/rules/maraudersmapmd-skill.mdc';

  return `## Step 1 — Install or update skill

Check if \`${skillPath}\` exists in this project.

1. Fetch ${skillUrl}.
2. If \`${skillPath}\` does NOT exist, save the fetched content as \`${skillPath}\`.
3. If \`${skillPath}\` already exists, compare the \`version\` in the YAML frontmatter of both. If the remote version is newer, overwrite \`${skillPath}\` with the fetched content. If the local version is older or missing, upgrade it. Otherwise keep the local file.
4. Always use the newest available version of the skill before rewriting.
5. After saving, ensure the YAML frontmatter in \`${skillPath}\` is Cursor-compatible. It MUST contain these fields:
   \`\`\`yaml
   ---
   description: "<keep the original description>"
   alwaysApply: false
   ---
   \`\`\`
   Remove any fields Cursor does not recognize (e.g. name, metadata, tags). Keep the rest of the file content unchanged.

## Step 2 — Rewrite for readability

Follow the maraudersmapmd-skill to rewrite "${fileName}".

- File: \`${relativePath}\`
- Output to: \`${rewrittenName}\` (same directory — do not modify the original)
- Artifacts at \`${artifactDir}/\`: \`ai-map.md\`, \`sections/*.md\`, \`index.json\``;
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

  const fileName = path.basename(filePath);
  const relativePath = path.relative(workspaceRoot, filePath);
  const docId = docIdFromPath(filePath);
  const prompt = buildReadabilityPrompt(relativePath, fileName, docId);
  await vscode.env.clipboard.writeText(prompt);
  vscode.window.showInformationMessage('Readability prompt copied to clipboard');
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
}
