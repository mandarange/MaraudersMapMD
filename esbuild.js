#!/usr/bin/env node

const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--minify');
const watch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: './dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'ES2024',
  sourcemap: !production,
  minify: production,
  logLevel: 'info',
};

async function build() {
  try {
    if (watch) {
      const ctx = await esbuild.context(baseConfig);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(baseConfig);
      console.log('Build complete');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
