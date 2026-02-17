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

  const skillRepoUrl = 'https://github.com/mandarange/MaraudersMapMD-skill';
  const skillArchiveUrl = 'https://github.com/mandarange/MaraudersMapMD-skill/archive/refs/heads/main.zip';
  const skillPath = '.cursor/rules/maraudersmapmd-skill.mdc';
  const skillBundleDir = '.cursor/skills/maraudersmapmd-skill';

  return `## Step 1 — Install or update skill

Check if \`${skillPath}\` and \`${skillBundleDir}/\` exist in this project.

1. Fetch the latest skill repo archive from ${skillArchiveUrl} (repo: ${skillRepoUrl}).
2. Compare local vs remote \`version\` from YAML frontmatter.
3. If remote is newer (or local is missing), DELETE the existing \`${skillBundleDir}/\` completely first (full clean reset).
4. After cleanup, extract and sync the FULL repository contents into \`${skillBundleDir}/\`. Do not sync only \`SKILL.md\`.
5. Ensure every companion file is present in the synced bundle. The skill requires these implementation files:
   - \`shards_db.py\` — shard database builder (Python)
   - \`shards_search.py\` — shard search utility (Python)
   - \`shards_to_json.py\` — shard-to-JSON converter (Python)
   - \`docs/MaraudersMap/\` — AI artifact examples and shard index
   - \`tests/\` — test fixtures and validation scripts
   If any of these are missing after sync, the installation is incomplete — re-fetch.
6. Never keep legacy files from previous versions. Old python/templates/scripts must not remain after update.
7. Read \`${skillBundleDir}/SKILL.md\`, then write/refresh \`${skillPath}\` with that content.
8. Always use the newest available version of the skill bundle before rewriting.
9. After saving, ensure the YAML frontmatter in \`${skillPath}\` is Cursor-compatible. It MUST contain these fields:
   \`\`\`yaml
   ---
   description: "<keep the original description>"
   alwaysApply: false
   ---
   \`\`\`
   Remove any fields Cursor does not recognize (e.g. name, metadata, tags). Keep the rest of the file content unchanged.

Execution rule:
- Do NOT stop after Step 1.
- Continue immediately to Step 2 in the same run.
- Do NOT ask for confirmation like "continue?" between steps.
- Ask questions only if truly blocked (e.g., missing file permission, missing network access, unrecoverable error).

## Step 2 — Rewrite for readability

Follow the maraudersmapmd-skill to rewrite "${fileName}".

- File: \`${relativePath}\`
- Output to: \`${rewrittenName}\` (same directory — do not modify the original)
- Artifacts at \`${artifactDir}/\`: \`ai-map.md\`, \`sections/*.md\`, \`index.json\``;
}

function buildPptPrompt(relativePath: string): string {
  const skillRepoUrl = 'https://github.com/mandarange/MaraudersPPT-Skill';
  const skillArchiveUrl = 'https://github.com/mandarange/MaraudersPPT-Skill/archive/refs/heads/main.zip';
  const skillPath = '.cursor/rules/maraudersppt-skill.mdc';
  const skillBundleDir = '.cursor/skills/maraudersppt-skill';

  return `## Step 1 — Install or update skill

Check if \`${skillPath}\` and \`${skillBundleDir}/\` exist in this project.

1. Fetch the latest skill repo archive from ${skillArchiveUrl} (repo: ${skillRepoUrl}).
2. Compare local vs remote \`version\` from YAML frontmatter.
3. If remote is newer (or local is missing), DELETE the existing \`${skillBundleDir}/\` completely first (full clean reset).
4. After cleanup, extract and sync the FULL repository contents into \`${skillBundleDir}/\`. Do not sync only \`SKILL.md\`.
5. Ensure every companion file is present in the synced bundle. The skill requires these implementation files:
   - \`templates/charts/*.py\` — Python chart generators (bar, donut, funnel, icon_grid, kpi_cards, comparison, process_flow, timeline)
   - \`templates/__init__.py\`, \`templates/charts/__init__.py\` — package init files
   - \`references/*.md\` — content-distillation, image-generation, keyword-extraction, layout-integrity, parallel-execution, visual-qa
   - \`docs/\` — design specs and PRD
   If any of these are missing after sync, the installation is incomplete — re-fetch.
6. Never keep legacy files from previous versions. Old python/templates/scripts must not remain after update.
7. Read \`${skillBundleDir}/SKILL.md\`, then write/refresh \`${skillPath}\` with that content.
8. Always use the newest available version of the full skill bundle before generating slides.
9. After saving, ensure the YAML frontmatter in \`${skillPath}\` is Cursor-compatible. It MUST contain these fields:
   \`\`\`yaml
   ---
   description: "<keep the original description>"
   alwaysApply: false
   ---
   \`\`\`
   Remove any fields Cursor does not recognize (e.g. name, metadata, tags). Keep the rest of the file content unchanged.

Execution rule:
- Do NOT stop after Step 1.
- Continue immediately to Step 2 in the same run.
- Do NOT ask for confirmation like "continue?" between steps.
- Do not require any model-switch guidance or confirmation prompt.
- Detect environment and proceed immediately using the skill's built-in image generation strategy/fallbacks.
- Ask questions only if truly blocked (e.g., missing file permission, missing network access, unrecoverable error).

Activation Guard (MUST):
- If the invocation keyword \`MaraudersMD2PPT\` is missing, HARD FAIL immediately and do not perform any conversion step.
- Never fall back to generic markdown-to-slides/pdf logic without the explicit \`MaraudersMD2PPT\` activation.
- After activation, keep \`activation_status=ACTIVE\` and \`pipeline_mode=SKILL_ONLY\` throughout the run.

## Step 2 — Generate presentation PDF

Follow the maraudersppt-skill and invoke it explicitly with \`MaraudersMD2PPT\`.
Important: \`MaraudersMD2PPT\` is an AI chat invocation keyword, not a terminal/shell command.
Run this in Cursor/Antigravity AI chat, not in terminal.

- Source Markdown: \`${relativePath}\`
- Invocation: \`MaraudersMD2PPT ${relativePath}\`
- Keep source language as-is (no translation).
- Generate only presentation-ready \`.pdf\` for slides.
- Do not generate \`.pptx\`.

## Step 3 — Diagnostic report (required)

Print a concise report at the end:
- Activation: OK/FAIL
- Invocation keyword detected: \`MaraudersMD2PPT\`
- Pipeline mode: SKILL_ONLY
- Step execution: Step1=done, Step2=done
- Output files: list generated \`.pdf\` path(s) only`;
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
  const skillRepoUrl = 'https://github.com/mandarange/Marauders_FactCheck_Skill';
  const skillArchiveUrl = 'https://github.com/mandarange/Marauders_FactCheck_Skill/archive/refs/heads/main.zip';
  const skillPath = '.cursor/rules/marauders-factcheck-skill.mdc';
  const skillBundleDir = '.cursor/skills/marauders-factcheck-skill';

  return `## Step 1 — Install or update skill

Check if \`${skillPath}\` and \`${skillBundleDir}/\` exist in this project.

1. Fetch the latest skill repo archive from ${skillArchiveUrl} (repo: ${skillRepoUrl}).
2. The skill files live under \`skills/marauders-factcheck-skill/\` inside the archive. Extract that subdirectory's contents into \`${skillBundleDir}/\`.
3. Compare local vs remote \`version\` from YAML frontmatter in \`SKILL.md\`.
4. If remote is newer (or local is missing), DELETE the existing \`${skillBundleDir}/\` completely first (full clean reset).
5. After cleanup, extract and sync the contents of \`skills/marauders-factcheck-skill/\` from the archive into \`${skillBundleDir}/\`. Do not sync only \`SKILL.md\`.
6. Ensure every companion file is present in the synced bundle. The skill requires these implementation files:
   - \`scripts/extract_metrics.py\` — metric candidate extractor (Python)
   - \`scripts/apply_citations.py\` — value replacement and source insertion (Python)
   - \`references/source-priority.md\` — Tier 1/2/3 source trust rules
   - \`references/metric-rules.md\` — number parsing and normalization rules
   - \`references/output-format.md\` — citation and log format templates
   - \`agents/openai.yaml\` — agent interface config
   If any of these are missing after sync, the installation is incomplete — re-fetch.
7. Never keep legacy files from previous versions. Old scripts/references must not remain after update.
8. Read \`${skillBundleDir}/SKILL.md\`, then write/refresh \`${skillPath}\` with that content.
9. Always use the newest available version of the skill bundle before running the check.
10. After saving, ensure the YAML frontmatter in \`${skillPath}\` is Cursor-compatible. It MUST contain these fields:
    \`\`\`yaml
    ---
    description: "<keep the original description>"
    alwaysApply: false
    ---
    \`\`\`
    Remove any fields Cursor does not recognize (e.g. name, metadata, tags). Keep the rest of the file content unchanged.

Execution rule:
- Do NOT stop after Step 1.
- Continue immediately to Step 2 in the same run.
- Do NOT ask for confirmation like "continue?" between steps.
- Ask questions only if truly blocked (e.g., missing file permission, missing network access, unrecoverable error).

## Step 2 — Fact-check quantitative claims

Follow the marauders-factcheck-skill to validate numeric claims in "${relativePath}".

- Source Markdown: \`${relativePath}\`
- Read the full skill workflow from \`${skillBundleDir}/SKILL.md\` and reference docs from \`${skillBundleDir}/references/\`.
- Use \`${skillBundleDir}/scripts/extract_metrics.py\` to extract metric candidates, then verify against live web evidence using the source-priority tiers.
- Use \`${skillBundleDir}/scripts/apply_citations.py\` to apply verified values and insert source citation lines.
- Apply the hybrid decision policy: replace only when Tier 1 evidence is clear and timestamped; otherwise flag with \`<!-- verification-needed -->\`.
- Add source citation lines directly under updated statements.
- Do not modify the original file. Output to a new file with \`.fact-checked.md\` suffix in the same directory.`;
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
