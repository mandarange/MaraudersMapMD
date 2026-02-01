import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'marauders-map-md.marauders-map-md';

const EXPECTED_COMMANDS = [
  'maraudersMapMd.openPreviewToSide',
  'maraudersMapMd.togglePreviewLock',
  'maraudersMapMd.format.bold',
  'maraudersMapMd.format.italic',
  'maraudersMapMd.format.inlineCode',
  'maraudersMapMd.insert.link',
  'maraudersMapMd.insert.heading',
  'maraudersMapMd.insert.quote',
  'maraudersMapMd.toggle.task',
  'maraudersMapMd.images.insertFromFile',
  'maraudersMapMd.images.pasteToAssets',
  'maraudersMapMd.export.html',
  'maraudersMapMd.export.pdf',
  'maraudersMapMd.history.open',
  'maraudersMapMd.history.createCheckpoint',
  'maraudersMapMd.history.diffWithCurrent',
  'maraudersMapMd.history.restoreSnapshot',
  'maraudersMapMd.history.pruneNow',
  'maraudersMapMd.ai.generateMap',
  'maraudersMapMd.ai.exportSectionPack',
  'maraudersMapMd.ai.buildIndex',
  'maraudersMapMd.ai.copyContextBudgeted',
  'maraudersMapMd.ai.insertHintRule',
  'maraudersMapMd.ai.insertHintDecision',
  'maraudersMapMd.ai.insertHintNote',
] as const;

const EXPECTED_CONFIG_SECTIONS = [
  'preview.updateDelayMs',
  'preview.largeDocThresholdKb',
  'preview.largeDocUpdateDelayMs',
  'preview.scrollSync',
  'render.allowHtml',
  'images.assetsDir',
  'images.allowRemote',
  'images.filenamePattern',
  'images.altTextSource',
  'pdf.browserPath',
  'pdf.format',
  'pdf.marginMm',
  'pdf.printBackground',
  'pdf.embedImages',
  'pdf.outputDirectory',
  'pdf.openAfterExport',
  'history.enabled',
  'history.storageLocation',
  'history.mode',
  'history.intervalMinutes',
  'history.maxSnapshotsPerFile',
  'history.maxTotalStorageMb',
  'history.retentionDays',
  'history.protectManualCheckpoints',
  'history.snapshotCompression',
  'history.createPreRestoreSnapshot',
  'ai.enabled',
  'ai.outputDir',
  'ai.buildOnSave',
  'ai.generate.map',
  'ai.generate.sections',
  'ai.generate.index',
  'ai.tokenEstimateMode',
  'ai.gitPolicy',
  'ai.largeDocThresholdKb',
] as const;

async function testExtensionActivation(): Promise<void> {
  const ext = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(ext, `Extension ${EXTENSION_ID} should be installed`);

  if (!ext.isActive) {
    await ext.activate();
  }
  assert.strictEqual(ext.isActive, true, 'Extension should be active');
}

async function testAllCommandsRegistered(): Promise<void> {
  const registeredCommands = await vscode.commands.getCommands(true);

  for (const cmd of EXPECTED_COMMANDS) {
    assert.ok(
      registeredCommands.includes(cmd),
      `Command "${cmd}" should be registered`
    );
  }

  assert.strictEqual(
    EXPECTED_COMMANDS.length,
    25,
    'Should have exactly 25 commands'
  );
}

async function testConfigurationSchema(): Promise<void> {
  const config = vscode.workspace.getConfiguration('maraudersMapMd');

  for (const key of EXPECTED_CONFIG_SECTIONS) {
    const inspected = config.inspect(key);
    assert.ok(
      inspected !== undefined && inspected.defaultValue !== undefined,
      `Configuration "maraudersMapMd.${key}" should have a default value`
    );
  }
}

async function testActivationOnMarkdownFile(): Promise<void> {
  const doc = await vscode.workspace.openTextDocument({
    language: 'markdown',
    content: '# Test Document\n\nHello world',
  });
  await vscode.window.showTextDocument(doc);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const ext = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(ext?.isActive, 'Extension should activate on markdown file open');
}

export async function run(): Promise<void> {
  const tests = [
    { name: 'Extension activates', fn: testExtensionActivation },
    { name: 'Activates on markdown file open', fn: testActivationOnMarkdownFile },
    { name: 'All 25 commands registered', fn: testAllCommandsRegistered },
    { name: 'Configuration schema complete', fn: testConfigurationSchema },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
      console.log(`  PASS: ${test.name}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL: ${test.name}`);
      console.error(`    ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${tests.length} total`);

  if (failed > 0) {
    throw new Error(`${failed} integration test(s) failed`);
  }
}
